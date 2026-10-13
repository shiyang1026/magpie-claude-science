import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const binary = process.env.MAGPIE_BIN || '/Applications/magpie.app/Contents/MacOS/magpie';
fs.accessSync(binary, fs.constants.X_OK);
const bun = process.env.MAGPIE_BUN || (process.env.PATH || '').split(path.delimiter).map(dir => path.join(dir, 'bun')).find(file => { try { fs.accessSync(file, fs.constants.X_OK); return true; } catch { return false; } });
assert.ok(bun, 'Install Bun or set MAGPIE_BUN for offline integration testing.');
const portProbe = http.createServer();
await listen(portProbe, 0);
const address = '127.0.0.1:' + portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const base = 'http://' + address;
fs.mkdirSync(path.join(root, 'work'), { recursive: true });
const lab = fs.mkdtempSync(path.join(fs.realpathSync(path.join(root, 'work')), 'magpie-integration-'));
const home = path.join(lab, 'home');
fs.mkdirSync(home);
const env = {
  PATH: process.env.PATH, HOME: home, USER: 'magpie-test', LOGNAME: 'magpie-test', TMPDIR: lab,
  XDG_CONFIG_HOME: path.join(home, '.config'), XDG_CACHE_HOME: path.join(home, '.cache'),
  XDG_DATA_HOME: path.join(home, '.local', 'share'), MAGPIE_ADDR: address,
  MAGPIE_BUN: bun, MAGPIE_NO_STATS: '1', DO_NOT_TRACK: '1', MAGPIE_NO_ACCOUNTS: '1', MAGPIE_NO_SHORTCUT: '1',
  // Prevent unrelated background catalogue/download HTTP traffic from leaving the machine.
  HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1', ALL_PROXY: 'http://127.0.0.1:1',
  NO_PROXY: '127.0.0.1,localhost,::1',
};
const children = new Set();
let server, gateway, logs = '';
const calls = [];
async function cli(args) {
  const child = spawn(binary, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 30000);
  try {
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, `magpie ${args[0]} failed: ${output}`);
    return output;
  } finally { clearTimeout(timer); children.delete(child); }
}
async function listen(server, port) {
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
  try { await exited; } finally { clearTimeout(timer); }
}
async function request(body, agent = 'claude-science') {
  const response = await fetch(base + '/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer magpie-' + agent, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return body.stream ? text : JSON.parse(text);
}
try {
  server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: [{ id: 'luna', type: 'model', display_name: 'Local Fake Luna' }] })); return;
    }
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw || '{}');
    calls.push({ path: req.url, body });
    if (req.url === '/v1/messages/count_tokens') {
      res.setHeader('content-type', 'application/json'); res.end('{"input_tokens":7}'); return;
    }
    if (req.url !== '/v1/messages') { res.statusCode = 404; res.end('{}'); return; }
    const message = { id: 'msg_fake', type: 'message', role: 'assistant', model: 'luna', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 7, output_tokens: 0 } };
    if (!body.stream) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ...message, content: [{ type: 'tool_use', id: 'tool_fake', name: 'echo', input: { value: 'hello' } }], stop_reason: 'tool_use', usage: { input_tokens: 7, output_tokens: 4 } })); return;
    }
    res.setHeader('content-type', 'text/event-stream');
    const events = [
      { type: 'message_start', message },
      { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'tool_fake', name: 'echo', input: {} } },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"value":"hello"}' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 4 } },
      { type: 'message_stop' },
    ];
    for (const event of events) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    res.end();
  });
  await listen(server, 0);
  const upstream = 'http://127.0.0.1:' + server.address().port;
  await cli(['plugin', 'add', root]);
  await cli(['plugin', 'options', 'magpie-claude-science', JSON.stringify({ agent: 'claude-science', model: 'fake/luna' })]);
  await cli(['provider', 'add', 'fake', 'anthropic=' + upstream, 'key=test', 'models=luna']);
  const agents = await cli(['agents']);
  assert.match(agents, /^\s*Claude Science\s+/m);
  const plugins = await cli(['plugin', 'list', '--json']);
  assert.match(plugins, /claude-science/);
  await cli(['claude-science', 'fake/luna']);
  const agentConfig = JSON.parse(fs.readFileSync(path.join(home, '.config', 'magpie', 'claude-science.json'), 'utf8'));
  assert.equal(agentConfig.model, 'fake/luna'); assert.equal(agentConfig.gateway, base);
  assert.equal(agentConfig.key, 'magpie-claude-science');
  gateway = spawn(binary, ['serve'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] }); children.add(gateway);
  gateway.stdout.on('data', data => { logs += data; }); gateway.stderr.on('data', data => { logs += data; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(gateway.exitCode, null, 'Gateway exited: ' + logs);
    try {
      const response = await fetch(base + '/v1/models', { signal: AbortSignal.timeout(500) });
      if (response.ok) { const catalog = await response.json(); assert.ok(catalog.data.some(model => model.id === 'fake/luna')); ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Isolated gateway did not start: ' + logs);
  const body = { model: 'claude-sonnet-4-6', max_tokens: 64, stream: true,
    messages: [{ role: 'user', content: 'Call echo with hello.' }],
    tools: [{ name: 'echo', description: 'Echo a value', input_schema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } }] };
  const stream = await request(body);
  const events = stream.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)));
  assert.equal(events.find(event => event.type === 'message_start').message.model, body.model);
  assert.deepEqual(events.find(event => event.type === 'content_block_delta').delta, { type: 'input_json_delta', partial_json: '{"value":"hello"}' });
  assert.ok(events.some(event => event.type === 'message_stop'));
  assert.equal(calls.at(-1).body.model, 'luna'); assert.deepEqual(calls.at(-1).body.tools, body.tools);
  const reply = await request({ ...body, stream: false });
  assert.equal(reply.model, body.model); assert.equal(reply.content[0].type, 'tool_use');
  const other = await request({ ...body, model: 'fake/luna', stream: false }, 'other-agent');
  assert.equal(calls.at(-1).body.model, 'luna'); assert.equal(other.model, 'luna');
  const counted = await fetch(base + '/v1/messages/count_tokens', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer magpie-claude-science' },
    body: JSON.stringify({ model: 'fake/luna', messages: body.messages, tools: body.tools }), signal: AbortSignal.timeout(15000),
  });
  assert.equal(counted.status, 200); assert.deepEqual(await counted.json(), { input_tokens: 7 });
  assert.equal(calls.at(-1).path, '/v1/messages/count_tokens'); assert.equal(calls.at(-1).body.model, 'luna');
  const unknownAlias = await fetch(base + '/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer magpie-other-agent' }, body: JSON.stringify({ ...body, stream: false }) });
  assert.notEqual(unknownAlias.status, 200, 'Other agent alias must not be rewritten');
  await unknownAlias.text();
  assert.doesNotMatch(logs, /middleware.*(didn't load|failed|onRequest.*error)/i);
  console.log('PASS: installed Magpie loads agent and middleware; isolated agent config; catalog; streaming tool deltas; nonstreaming alias echo; token counting; other-agent isolation.');
} finally {
  await Promise.all([...children].map(stop));
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  fs.rmSync(lab, { recursive: true, force: true });
}
