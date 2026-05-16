import * as assert from 'assert';
import { SessionMetadataState, formatContextUsage } from '../../sessionMetadata';

suite('SessionMetadataState', () => {
  test('applies initial metadata and publishes webview state', () => {
    const state = new SessionMetadataState({
      initialSessionMeta: {
        model: {
          label: 'cached High',
          provider: 'anthropic',
          id: 'cached',
          reasoning: true,
          thinkingLevel: 'high'
        },
        modelOptions: [
          { provider: 'anthropic', id: 'cached', name: 'Cached', reasoning: true }
        ],
        contextUsage: { label: '40%', title: 'Context used: 40%', level: 'low' }
      }
    });

    assert.deepStrictEqual(state.getWebviewState().model, {
      label: 'cached High',
      provider: 'anthropic',
      id: 'cached',
      reasoning: true,
      thinkingLevel: 'high',
      options: [{ provider: 'anthropic', id: 'cached', name: 'Cached', reasoning: true }]
    });
    assert.deepStrictEqual(state.getWebviewState().contextUsage, {
      label: '40%',
      title: 'Context used: 40%',
      level: 'low'
    });
  });

  test('notifies when durable metadata changes', () => {
    const snapshots: unknown[] = [];
    const state = new SessionMetadataState({ onChange: (snapshot) => snapshots.push(snapshot) });

    assert.strictEqual(state.applyModelState({
      model: { provider: 'openai', id: 'gpt', reasoning: true },
      thinkingLevel: 'medium'
    }), true);
    assert.strictEqual(state.applyAvailableModels([
      { provider: 'openai', id: 'gpt', name: 'GPT', reasoning: true }
    ]), true);

    assert.deepStrictEqual(snapshots, [
      {
        model: {
          label: 'gpt Medium',
          provider: 'openai',
          id: 'gpt',
          reasoning: true,
          thinkingLevel: 'medium'
        },
        modelOptions: [],
        contextUsage: undefined
      },
      {
        model: {
          label: 'gpt Medium',
          provider: 'openai',
          id: 'gpt',
          reasoning: true,
          thinkingLevel: 'medium'
        },
        modelOptions: [{ provider: 'openai', id: 'gpt', name: 'GPT', reasoning: true }],
        contextUsage: undefined
      }
    ]);
  });

  test('formats known and unknown context usage', () => {
    assert.deepStrictEqual(formatContextUsage({ contextUsage: { tokens: 60, contextWindow: 100, percent: 60 } }), {
      label: '60%',
      title: 'Context used: 60%\nCurrent context: 60 tokens\nModel context size: 100 tokens',
      level: 'medium'
    });

    assert.deepStrictEqual(formatContextUsage({ contextUsage: { tokens: null, contextWindow: 100, percent: null } }), {
      label: '?%',
      title: 'Context usage unavailable\nModel context size: 100 tokens',
      level: 'low'
    });
  });
});
