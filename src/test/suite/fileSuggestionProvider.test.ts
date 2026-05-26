import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getAtFileSuggestions } from '../../fileSuggestions/fileSuggestionProvider';

suite('@ file suggestion provider', () => {
  test('returns fuzzy file and directory suggestions', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'tauren-file-suggestions-'));
    await fs.mkdir(path.join(cwd, 'src'));
    await fs.writeFile(path.join(cwd, 'src', 'alpha.ts'), '');
    await fs.writeFile(path.join(cwd, 'README.md'), '');

    const suggestions = await getAtFileSuggestions({ cwd, prefix: '@alp' });

    assert.ok(suggestions.some((item) => item.value === '@src/alpha.ts' && !item.directory));
  });

  test('quotes paths with spaces and keeps directories open', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'tauren-file-suggestions-'));
    await fs.mkdir(path.join(cwd, 'two words'));
    await fs.writeFile(path.join(cwd, 'two words', 'file.txt'), '');

    const suggestions = await getAtFileSuggestions({ cwd, prefix: '@two' });
    const directory = suggestions.find((item) => item.directory && item.label === 'two words/');

    assert.ok(directory);
    assert.strictEqual(directory.value, '@"two words/"');
  });
});
