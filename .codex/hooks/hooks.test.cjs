const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { policyReason } = require('./guard.cjs');

const root = path.resolve(__dirname, '../..');
const shellEvent = command => ({ tool_name: 'Bash', tool_input: { command } });

for (const command of [
  'rm -rf /',
  'git status && rm -fr ./data',
  'Remove-Item -LiteralPath C:/data -Recurse -Force',
  "& 'Remove-Item' -Recurse -Force ./data",
  'git push --force origin main',
  'git push origin main --force',
  'git push origin main --force-with-lease',
  'git -C ./frontend push origin main -f',
  'git push origin +HEAD:main',
  'git reset --hard HEAD',
  'git clean -fd',
  'powershell -EncodedCommand c29tZS1jb21tYW5k',
  'Get-Content backend/.env',
  'cat ~/.ssh/id_ed25519',
]) {
  test(`guard rejects without executing: ${command}`, () => {
    assert.ok(policyReason(shellEvent(command)));
  });
}

for (const command of [
  'git status --short',
  'git push origin feature/demo',
  'npm.cmd run lint --prefix frontend',
  'npm.cmd test --prefix backend',
  'Get-Content backend/.env.example',
]) {
  test(`guard permits ordinary workflow: ${command}`, () => {
    assert.equal(policyReason(shellEvent(command)), null);
  });
}

test('guard validates edit targets rather than document text', () => {
  assert.ok(policyReason({ tool_name: 'apply_patch', tool_input: {
    command: '*** Begin Patch\n*** Update File: backend/.env\n@@\n-X=old\n+X=new\n*** End Patch',
  } }));
  assert.equal(policyReason({ tool_name: 'apply_patch', tool_input: {
    command: '*** Begin Patch\n*** Update File: AGENTS.md\n@@\n+Do not read .env or run git push --force.\n*** End Patch',
  } }), null);
  assert.ok(policyReason({ tool_name: 'mcp__filesystem__read_file', tool_input: { path: 'C:/repo/server.key' } }));
});

test('guard launcher emits a supported PreToolUse denial', () => {
  const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(path.join(__dirname, 'guard.cjs'))})`], {
    input: JSON.stringify(shellEvent('git push origin main --force')), encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('configured hook command works from a project subdirectory', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(root, '.codex/hooks.json'), 'utf8'));
  const command = hooks.hooks.PreToolUse[0].hooks[0].command;
  const executable = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
  const args = process.platform === 'win32'
    ? ['-NoProfile', '-NonInteractive', '-Command', command]
    : ['-c', command];
  const result = spawnSync(executable, args, {
    cwd: path.join(root, 'frontend'), input: JSON.stringify(shellEvent('git push origin main --force')),
    encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('post-edit hook runs real ESLint, reports failure, then accepts the fix', () => {
  const file = path.join(root, 'frontend/src', `codex-hook-check-${process.pid}.ts`);
  assert.equal(fs.existsSync(file), false);
  const event = { tool_name: 'apply_patch', tool_input: {
    command: `*** Begin Patch\n*** Add File: ${file}\n+placeholder\n*** End Patch`,
  } };
  function lint() {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'lint-changed.cjs')], {
      input: JSON.stringify(event), encoding: 'utf8', timeout: 60000,
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  try {
    const invalid = 'export const hookCheck: any = 1\n';
    fs.writeFileSync(file, invalid);
    const failure = lint();
    assert.equal(failure.decision, 'block');
    assert.match(failure.reason, /no-explicit-any/);
    assert.equal(fs.readFileSync(file, 'utf8'), invalid);
    fs.writeFileSync(file, 'export const hookCheck: number = 1\n');
    const success = lint();
    assert.equal(success.hookSpecificOutput.hookEventName, 'PostToolUse');
    assert.match(success.hookSpecificOutput.additionalContext, /ESLint passed/);
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
