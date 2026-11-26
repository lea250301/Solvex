const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { patchPaths } = require('./guard.cjs');

const root = path.resolve(__dirname, '../..');
const excluded = /(?:^|\/)(?:node_modules|dist|coverage|\.vercel)(?:\/|$)/;

function sourceFile(value) {
  const absolute = path.resolve(root, value);
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  if (!/^(?:frontend|backend)\//.test(relative) || excluded.test(relative)
      || !/\.(?:[cm]?js|tsx?)$/.test(relative) || !fs.existsSync(absolute)) return null;
  if (path.relative(root, fs.realpathSync(absolute)).startsWith('..')) return null;
  return relative;
}

function run(event) {
  const input = event.tool_input ?? {};
  const command = typeof input === 'string' ? input : input.command ?? input.cmd ?? input.patch ?? '';
  let candidates = [];
  if (/^(?:apply_patch|Edit|Write)$/.test(event.tool_name)) {
    candidates = patchPaths(command);
    if (input.file_path) candidates.push(input.file_path);
    if (input.path) candidates.push(input.path);
  } else if (/^(?:Bash|exec_command)$/.test(event.tool_name)) {
    for (const args of [
      ['diff', '--name-only', '--diff-filter=ACMR', '-z', 'HEAD', '--', 'frontend', 'backend'],
      ['ls-files', '--others', '--exclude-standard', '-z', '--', 'frontend', 'backend'],
    ]) candidates.push(...execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean));
  }
  const files = [...new Set(candidates.map(sourceFile).filter(Boolean))];
  if (!files.length) return null;
  const cacheDirectory = path.join(os.tmpdir(), 'solvex-codex-lint');
  const cacheFile = path.join(cacheDirectory, crypto.createHash('sha256').update(root).digest('hex') + '.json');
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch { /* First run. */ }
  const hashes = Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
  const changed = files.filter(file => cache[file] !== hashes[file]);
  if (!changed.length) return null;
  for (const component of ['frontend', 'backend']) {
    const selected = changed.filter(file => file.startsWith(component + '/'));
    if (!selected.length) continue;
    const eslint = path.join(root, component, 'node_modules/eslint/bin/eslint.js');
    if (!fs.existsSync(eslint)) throw new Error(`Run npm ci --prefix ${component} before using the lint hook.`);
    const result = spawnSync(process.execPath, [eslint, '--', ...selected.map(file => file.slice(component.length + 1))], {
      cwd: path.join(root, component), encoding: 'utf8', timeout: 60000, windowsHide: true,
    });
    if (result.status !== 0 || result.error) {
      throw new Error(`ESLint failed for ${selected.join(', ')}.\n${(result.stdout ?? '') + (result.stderr ?? '')}`);
    }
    for (const file of selected) cache[file] = hashes[file];
  }
  fs.mkdirSync(cacheDirectory, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  return `ESLint passed for changed files: ${changed.join(', ')}. Full lint and tests are still required before handoff.`;
}

module.exports = { run, sourceFile };
if (!module.parent || module.parent.filename.endsWith('[eval]')) {
  try {
    const message = run(JSON.parse(fs.readFileSync(0, 'utf8')));
    if (message) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message } }));
  } catch (error) {
    console.log(JSON.stringify({ decision: 'block', reason: String(error.message).slice(0, 8000) }));
  }
}
