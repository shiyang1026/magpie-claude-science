import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export const repository = 'shiyang1026/magpie-claude-science';
const publicFiles = new Set(['package.json','README.md','README.zh-CN.md','CHANGELOG.md','LICENSE','docs/operations.zh-CN.md','docs/publishing.md']);
export function validatePackage(manifest, files) {
 assert.equal(manifest.name, 'magpie-claude-science');
 assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
 assert.notEqual(manifest.private,true,'Package must be public');
 assert.equal(manifest.repository?.url, `git+https://github.com/${repository}.git`);
 assert.equal(manifest.bin?.['magpie-claude-science'],'src/cli.js');
 for (const hook of ['preinstall','install','postinstall','prepare','prepack','postpack','prepublish','prepublishOnly','publish','postpublish']) assert.ok(!manifest.scripts?.[hook], `Forbidden lifecycle hook: ${hook}`);
 for (const file of files) assert.ok(publicFiles.has(file) || /^src\/[a-zA-Z0-9_-]+\.js$/.test(file), `Unexpected package file: ${file}`);
 for (const file of ['package.json','src/cli.js','src/agent.js','src/middleware.js','README.md','README.zh-CN.md','LICENSE']) assert.ok(files.includes(file), `Missing package file: ${file}`);
}
export function validateRelease(manifest, context) {
 const mode=context.mode??'manual';
 assert.ok(['manual','automatic'].includes(mode),'Unknown release mode');
 if(mode==='manual'){
  assert.equal(context.event,'workflow_dispatch','Manual release must be dispatched');
  assert.equal(context.sourceRef??context.ref,context.ref,'Manual dispatch must run on its release tag');
  assert.equal(context.sourceSha??context.sha,context.sha,'Manual dispatch differs from release commit');
 }else{
  assert.equal(context.event,'push','Automatic release must originate from a main push');
  assert.equal(context.sourceRef,'refs/heads/main','Automatic release source must be main');
  assert.match(context.sourceSha,/^[a-f0-9]{40}$/);
  assert.equal(context.created,true,'Release Please must have created a release');
  assert.equal(context.sha,context.sourceSha,'Automatic release must use the triggering commit for truthful npm provenance; recover older tags manually');
 }
 assert.equal(context.repository,repository,'Wrong source repository');
 assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
 assert.equal(context.ref,`refs/tags/v${manifest.version}`,'Release tag must match the package version');
 assert.match(context.sha,/^[a-f0-9]{40}$/);
 assert.equal(context.head,context.sha,'Checkout differs from dispatch commit');
 assert.equal(context.tagCommit,context.sha,'Tag differs from dispatch commit');
 assert.equal(context.dirty,'','Release source must be clean');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const manifest=JSON.parse(fs.readFileSync('package.json','utf8'));
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 const mode=process.env.RELEASE_MODE||'manual';
 const tag=process.env.RELEASE_TAG||process.env.GITHUB_REF?.replace(/^refs\/tags\//,'');
 assert.match(tag??'',/^v\d+\.\d+\.\d+$/,'A version tag is required');
 const sha=process.env.RELEASE_SHA||process.env.GITHUB_SHA;
 assert.match(sha??'',/^[a-f0-9]{40}$/);
 validateRelease(manifest,{mode,event:process.env.GITHUB_EVENT_NAME,repository:process.env.GITHUB_REPOSITORY,ref:`refs/tags/${tag}`,sha,
  sourceRef:process.env.GITHUB_REF,sourceSha:process.env.GITHUB_SHA,created:process.env.RELEASE_CREATED==='true',
  head:git('rev-parse','HEAD'),tagCommit:git('rev-parse',`refs/tags/${tag}^{commit}`),dirty:git('status','--porcelain','--untracked-files=all')});
 console.log('Release tag, source repository, version, commit and clean tree verified.');
}
