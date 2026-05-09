import * as assert from 'assert';
import { ChatSession } from '../../chatSession';

suite('ChatSession', () => {
  test('beginSubmit rejects blank input and accepts trimmed non-blank input', () => {
    const session = new ChatSession();

    assert.strictEqual(session.beginSubmit('   '), undefined);
    assert.deepStrictEqual(session.snapshot(), { messages: [], busy: false });

    assert.deepStrictEqual(session.beginSubmit('  hello Pi  '), {
      text: 'hello Pi',
      sessionGeneration: 0
    });
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'user', text: 'hello Pi' },
        { role: 'assistant', text: '' }
      ],
      busy: true
    });
    assert.strictEqual(session.beginSubmit('second prompt'), undefined);
  });

  test('assistant deltas append to the active assistant message', () => {
    const session = new ChatSession();

    session.beginSubmit('hello');

    assert.strictEqual(session.appendAssistantDelta('Hi'), true);
    assert.strictEqual(session.appendAssistantDelta(''), false);
    assert.strictEqual(session.appendAssistantDelta(' there'), true);
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: 'Hi there' }
      ],
      busy: true
    });
  });

  test('assistant deltas create an assistant message when no prompt is active', () => {
    const session = new ChatSession();

    assert.strictEqual(session.appendAssistantDelta('late message'), true);
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'assistant', text: 'late message' }
      ],
      busy: false
    });
  });

  test('agent lifecycle updates busy state and clears the active assistant on end', () => {
    const session = new ChatSession();

    session.handleAgentStart();
    assert.strictEqual(session.snapshot().busy, true);

    session.appendAssistantDelta('late message');
    session.handleAgentEnd();
    assert.strictEqual(session.snapshot().busy, false);

    session.addErrorMessage('after end');
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'assistant', text: 'late message' },
        { role: 'system', text: 'after end', error: true }
      ],
      busy: false
    });
  });

  test('new sessions reset transcript and increment generation', () => {
    const session = new ChatSession();

    session.beginSubmit('hello');
    session.appendAssistantDelta('response');
    session.startNewSession();

    assert.strictEqual(session.generation, 1);
    assert.deepStrictEqual(session.snapshot(), { messages: [], busy: false });
    assert.deepStrictEqual(session.beginSubmit('next'), {
      text: 'next',
      sessionGeneration: 1
    });
  });

  test('setBusy updates busy state without changing transcript', () => {
    const session = new ChatSession();

    session.setBusy(true);
    assert.deepStrictEqual(session.snapshot(), { messages: [], busy: true });

    session.setBusy(false);
    assert.deepStrictEqual(session.snapshot(), { messages: [], busy: false });
  });

  test('errors mark active assistant or create a system error when idle', () => {
    const session = new ChatSession();

    session.addErrorMessage('idle failure');
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'system', text: 'idle failure', error: true }
      ],
      busy: false
    });

    session.beginSubmit('hello');
    session.addErrorMessage('active failure');
    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'system', text: 'idle failure', error: true },
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: 'active failure', error: true }
      ],
      busy: true
    });

    session.failActivePrompt('prompt failed');
    assert.strictEqual(session.snapshot().busy, false);
  });

  test('failActivePrompt records an assistant error and clears busy state', () => {
    const session = new ChatSession();

    session.beginSubmit('hello');
    session.failActivePrompt('prompt failed');

    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: 'prompt failed', error: true }
      ],
      busy: false
    });
  });

  test('activities attach to the active assistant message and can be updated', () => {
    const session = new ChatSession();

    session.beginSubmit('show activity');
    const firstId = session.upsertActivity('thinking:0', {
      kind: 'thinking',
      title: 'Thinking',
      status: 'running',
      body: 'one',
      code: false
    });

    assert.strictEqual(
      session.upsertActivity('thinking:0', {
        kind: 'thinking',
        title: 'Thinking',
        status: 'running',
        body: ' two',
        code: false
      }, 'append'),
      firstId
    );

    session.upsertActivity('thinking:0', {
      kind: 'thinking',
      title: 'Thinking',
      status: 'completed',
      summary: 'Completed'
    });

    session.addActivity({
      kind: 'turn',
      title: 'Turn completed',
      status: 'completed'
    });

    assert.deepStrictEqual(session.snapshot(), {
      messages: [
        { role: 'user', text: 'show activity' },
        {
          role: 'assistant',
          text: '',
          activities: [
            {
              id: firstId,
              kind: 'thinking',
              title: 'Thinking',
              status: 'completed',
              summary: 'Completed',
              body: 'one two',
              code: false
            },
            {
              id: 'activity-0-2',
              kind: 'turn',
              title: 'Turn completed',
              status: 'completed'
            }
          ]
        }
      ],
      busy: true
    });
  });

  test('message and activity snapshots are copied before returning', () => {
    const session = new ChatSession();

    session.beginSubmit('copy activity');
    session.addActivity({
      kind: 'rpc',
      title: 'RPC event',
      status: 'info',
      body: 'original'
    });

    const snapshot = session.snapshot();
    snapshot.messages[0].text = 'changed user text';
    snapshot.messages[1].activities![0].body = 'changed activity';

    const nextSnapshot = session.snapshot();
    assert.strictEqual(nextSnapshot.messages[0].text, 'copy activity');
    assert.strictEqual(nextSnapshot.messages[1].activities![0].body, 'original');
  });

  test('ending an agent run clears activity source mappings', () => {
    const session = new ChatSession();

    session.beginSubmit('first');
    const firstId = session.upsertActivity('agent', {
      kind: 'agent',
      title: 'Agent processing',
      status: 'running'
    });
    session.handleAgentEnd();

    const secondId = session.upsertActivity('agent', {
      kind: 'agent',
      title: 'Agent processing',
      status: 'running'
    });

    assert.notStrictEqual(firstId, secondId);
  });

  test('starting a new session resets activity ids and source mappings', () => {
    const session = new ChatSession();

    session.beginSubmit('first');
    session.upsertActivity('source', {
      kind: 'rpc',
      title: 'First',
      status: 'info'
    });
    session.startNewSession();
    session.beginSubmit('second');

    const id = session.upsertActivity('source', {
      kind: 'rpc',
      title: 'Second',
      status: 'info'
    });

    assert.strictEqual(id, 'activity-1-1');
  });
});
