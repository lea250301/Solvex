const fs = require('node:fs');
const path = require('node:path');

function sensitivePath(value) {
  const normalized = String(value).replaceAll('\\', '/');
  const name = path.posix.basename(normalized).toLowerCase();
  return (name === '.env' || name.startsWith('.env.')) && name !== '.env.example'
    || /\.(?:pem|key|p12|pfx)$/i.test(name)
    || /^id_(?:rsa|ed25519)/i.test(name)
    || /(?:^|\/)\.(?:ssh|aws|gnupg)(?:\/|$)/i.test(normalized)
    || /(?:^|\/)\.codex\/(?:auth\.json|secrets)(?:\/|$)/i.test(normalized);
}

function patchPaths(command) {
  return [...command.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)]
    .map(match => match[1].trim());
}

function policyReason(event) {
  const input = event.tool_input ?? {};
  const tool = event.tool_name ?? '';
  const command = typeof input === 'string' ? input : input.command ?? input.cmd ?? input.patch ?? '';
  const shell = command.replaceAll('`', '').replaceAll('"', '').replaceAll("'", '');
  if (/^(?:Bash|exec_command|shell|shell_command)$/.test(tool)) {
    if (/(?:^|[\s;&|()])(?:rm|rmdir|del|erase|remove-item|ri)(?:\.exe)?\s/i.test(shell)) {
      return 'Destructive deletion commands are blocked; review specific files with the user.';
    }
    if (/\bgit(?:\.exe)?\b[^\r\n;&|]*\bpush\b[^\r\n;&|]*(?:--force\b|\s-f\b|\s\+\S)/i.test(shell)) {
      return 'Force push is blocked; use an ordinary branch and pull request.';
    }
    if (/\bgit\b[^\r\n;&|]*\b(?:reset\s+--hard|clean)\b/i.test(shell)) {
      return 'Discarding work with git reset --hard or git clean is blocked.';
    }
    if (/\b(?:invoke-expression|iex|eval)\s|-(?:enc|encodedcommand)\b/i.test(shell)) {
      return 'Opaque shell evaluation is blocked; use a direct reviewable command.';
    }
    const tokens = command.replaceAll('\\', '/').split(/[\s"'`;=(),]+/).filter(Boolean);
    if (tokens.some(sensitivePath)) return 'Commands referring to environment secrets or private keys are blocked.';
  }
  const paths = /^(?:apply_patch|Edit|Write)$/.test(tool)
    ? patchPaths(command)
    : [];
  if (input && typeof input === 'object') {
    for (const key of ['path', 'file_path', 'filePath', 'filename']) {
      if (typeof input[key] === 'string') paths.push(input[key]);
    }
    if (Array.isArray(input.paths)) paths.push(...input.paths.filter(value => typeof value === 'string'));
  }
  if (paths.some(sensitivePath)) return 'Access to environment secrets or private keys is blocked.';
  if (/^(?:apply_patch|Edit|Write)$/.test(tool) && paths.some(value => /(?:^|[\\/])\.codex[\\/](?:config\.toml|hooks\.json|hooks[\\/]|rules[\\/])/.test(value))) {
    return 'Do not modify active safety controls through an edit tool; the user must review policy changes.';
  }
  return null;
}

module.exports = { sensitivePath, patchPaths, policyReason };

// The require-based launcher has no parent filename belonging to this module.
if (!module.parent || module.parent.filename.endsWith('[eval]')) {
  try {
    const reason = policyReason(JSON.parse(fs.readFileSync(0, 'utf8')));
    if (reason) console.log(JSON.stringify({ hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason,
    } }));
  } catch {
    console.error('Solvex safety hook could not validate the input.');
    process.exitCode = 2;
  }
}
