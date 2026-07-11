import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import type { AutocompleteProviderFactory } from '@earendil-works/pi-coding-agent';
import { PiAutocompleteRegistry } from '../../autocomplete/piAutocompleteRegistry';

suite('Pi autocomplete registry', () => {
  test('later providers wrap earlier providers and can delegate to the base provider', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'tauren-autocomplete-'));
    await fs.writeFile(path.join(cwd, 'closed-file.ts'), '');
    const registry = new PiAutocompleteRegistry();
    const calls: string[] = [];

    registry.add(((current) => ({
      ...current,
      async getSuggestions(lines, line, col, options) {
        calls.push('first');
        return current.getSuggestions(lines, line, col, options);
      }
    })) as AutocompleteProviderFactory);
    registry.add(((current) => ({
      ...current,
      async getSuggestions(lines, line, col, options) {
        calls.push('last');
        const delegated = await current.getSuggestions(lines, line, col, options);
        return delegated ? { ...delegated, items: [{ value: '@open-file.ts', label: 'open-file.ts' }, ...delegated.items] } : delegated;
      }
    })) as AutocompleteProviderFactory);

    const result = await registry.complete({ id: 'one', text: '@file', selectionStart: 5, selectionEnd: 5 }, cwd, new AbortController().signal);

    assert.deepStrictEqual(calls, ['last', 'first']);
    assert.strictEqual(result.items[0]?.value, '@open-file.ts');
    assert.ok(result.items.some((item) => item.value === '@closed-file.ts'));
  });

  test('uses the provider application result and rejects stale handles', async () => {
    const registry = new PiAutocompleteRegistry();
    registry.add(((current) => ({
      ...current,
      async getSuggestions() {
        return { prefix: '#', items: [{ value: '#one', label: 'one' }] };
      },
      applyCompletion() {
        return { lines: ['first', 'second'], cursorLine: 1, cursorCol: 3 };
      }
    })) as AutocompleteProviderFactory);

    const result = await registry.complete({ id: 'one', text: '#', selectionStart: 1, selectionEnd: 1 }, undefined, new AbortController().signal);
    const applied = registry.apply({ id: 'one', itemId: result.items[0]?.id ?? '' });

    assert.deepStrictEqual(applied, { id: 'one', text: 'first\nsecond', selectionStart: 9, selectionEnd: 9 });
    assert.strictEqual(registry.apply({ id: 'one', itemId: result.items[0]?.id ?? '' }), undefined);
  });
});
