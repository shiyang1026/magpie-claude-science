import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
const api=await import('../src/bridge.js').catch(()=>({}));
const config={model:'codex/gpt-6-luna',displayName:'GPT-6-Luna',gateway:'http://127.0.0.1:3425',key:'magpie-claude-science',token:'test-local-only'};
test('catalog offers Science-compatible shell IDs with true display names',()=>{
  assert.equal(typeof api.catalog,'function');
  const data=api.catalog(config);
  assert.equal(data.has_more,false);
  assert.ok(data.data.every(x=>x.id.startsWith('claude-')));
  assert.ok(data.data.some(x=>x.display_name.includes('GPT-6-Luna')));
});
test('only loopback Magpie endpoints and real upstream model ids are accepted',()=>{
  assert.equal(typeof api.validateConfig,'function');
  assert.doesNotThrow(()=>api.validateConfig(config));
  for(const gateway of ['https://example.com','http://127.0.0.1.evil:3425','http://user:pass@127.0.0.1:3425','file:///tmp/a']) assert.throws(()=>api.validateConfig({...config,gateway}));
  for(const model of ['','claude-science/a','bad\nmodel']) assert.throws(()=>api.validateConfig({...config,model}));
});
test('authenticated bridge forwards tools and counting with real model and preserves streaming',async()=>{
  assert.equal(typeof api.createBridge,'function');
  const seen=[];
  const upstream=http.createServer(async(req,res)=>{
    const chunks=[];for await(const c of req)chunks.push(c);
    const body=JSON.parse(Buffer.concat(chunks));seen.push({url:req.url,body,auth:req.headers.authorization,host:req.headers.host});
    if(req.url.includes('count_tokens')){res.setHeader('content-type','application/json');res.end('{"input_tokens":12}');return;}
    res.setHeader('content-type','text/event-stream');
    res.write('event: message_start\ndata: '+JSON.stringify({type:'message_start',message:{model:body.model}})+'\n\n');
    res.end('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"OK"}}\n\n');
  });
  await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
  const cfg={...config,gateway:`http://127.0.0.1:${upstream.address().port}`};
  const server=api.createBridge(()=>cfg);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base+'/v1/models')).status,401);
    assert.equal((await fetch(base+'/arbitrary',{headers:{authorization:'Bearer test-local-only'}})).status,404);
    const headers={'authorization':'Bearer test-local-only','content-type':'application/json'};
    const body={model:'claude-sonnet-4-6',stream:true,messages:[{role:'user',content:'hello'}],tools:[{name:'calculate',input_schema:{type:'object'}}]};
    const res=await fetch(base+'/v1/messages',{method:'POST',headers,body:JSON.stringify(body)});
    assert.equal(res.status,200);const txt=await res.text();assert.ok(txt.includes('claude-sonnet-4-6'));assert.ok(txt.includes('OK'));
    assert.equal(seen[0].body.model,'codex/gpt-6-luna');assert.deepEqual(seen[0].body.tools,body.tools);
    assert.equal(seen[0].auth,'Bearer magpie-claude-science');
    const counted=await fetch(base+'/v1/messages/count_tokens',{method:'POST',headers,body:JSON.stringify({model:body.model,messages:body.messages})});
    assert.deepEqual(await counted.json(),{input_tokens:12});
    assert.equal(seen[1].body.model,'codex/gpt-6-luna');
    const bad=await fetch(base+'/v1/messages',{method:'POST',headers,body:JSON.stringify({...body,model:'unknown-shell'})});assert.equal(bad.status,400);assert.equal(seen.length,2);
  }finally{server.closeAllConnections();upstream.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>upstream.close(r))]);}
});
