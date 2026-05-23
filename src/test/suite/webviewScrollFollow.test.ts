import * as assert from 'assert';
import {
  createScrollFollowState,
  isScrollAtBottom,
  recordScrollMetrics,
  updateScrollFollowStateForScroll
} from '../../webview/messages/scrollFollow';

suite('Webview scroll follow state', () => {
  test('treats a small bottom distance as bottom', () => {
    assert.strictEqual(isScrollAtBottom({ scrollTop: 596, scrollHeight: 1000, clientHeight: 400 }, 4), true);
    assert.strictEqual(isScrollAtBottom({ scrollTop: 595, scrollHeight: 1000, clientHeight: 400 }, 4), false);
  });

  test('does not disable following for layout growth without upward scroll', () => {
    const state = createScrollFollowState();
    recordScrollMetrics(state, { scrollTop: 600, scrollHeight: 1000, clientHeight: 400 });

    updateScrollFollowStateForScroll(state, { scrollTop: 600, scrollHeight: 1040, clientHeight: 400 }, 4);

    assert.strictEqual(state.followOutput, true);
  });

  test('disables following when the user scrolls upward', () => {
    const state = createScrollFollowState();
    recordScrollMetrics(state, { scrollTop: 600, scrollHeight: 1000, clientHeight: 400 });

    updateScrollFollowStateForScroll(state, { scrollTop: 520, scrollHeight: 1000, clientHeight: 400 }, 4);

    assert.strictEqual(state.followOutput, false);
  });

  test('re-enables following when scrolled back to bottom', () => {
    const state = createScrollFollowState();
    recordScrollMetrics(state, { scrollTop: 600, scrollHeight: 1000, clientHeight: 400 });
    updateScrollFollowStateForScroll(state, { scrollTop: 520, scrollHeight: 1000, clientHeight: 400 }, 4);

    updateScrollFollowStateForScroll(state, { scrollTop: 600, scrollHeight: 1000, clientHeight: 400 }, 4);

    assert.strictEqual(state.followOutput, true);
  });
});
