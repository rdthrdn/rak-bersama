import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});const p=await browser.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(8000);
const errors=[];p.on('pageerror',e=>errors.push(e.message));
const state=()=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
await p.goto('http://localhost:5173?renderer=canvas');await p.locator('[data-action="new"]').waitFor();await p.screenshot({path:'output/qa/mobile-title.png'});
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await p.locator('[data-action="new"]').click();await p.waitForTimeout(700);await p.screenshot({path:'output/qa/mobile-world.png'});
await p.locator('[data-action="pause"]').click();const start=(await state()).player;await p.keyboard.down('d');await p.waitForTimeout(180);await p.keyboard.up('d');assert.deepEqual((await state()).player,start);
await p.locator('[data-action="settings"]').click();await p.locator('[data-action="mute"]').click();await p.locator('[data-action="close"]').click();
// A test fixture uses the real public save schema to enter a normal encounter quickly.
await p.evaluate(()=>{const v=JSON.parse(localStorage.getItem('hundred-bonds-save-v1'));v.data.area='road';v.data.x=500;v.data.y=650;v.data.flags.promise=true;localStorage.setItem('hundred-bonds-save-v1',JSON.stringify(v));});
await p.reload();await p.locator('[data-action="continue"]').click();await p.waitForTimeout(350);await p.locator('[data-action="interact"]').first().click();await p.waitForTimeout(600);await p.screenshot({path:'output/qa/mobile-battle.png'});
await p.locator('[data-value="attack"]').click();await p.keyboard.press('Escape');assert.equal((await state()).selectedCommand,'');
// An interrupted battle recovers the exact world checkpoint.
await p.reload();await p.locator('[data-action="continue"]').click();await p.waitForTimeout(300);assert.equal((await state()).mode,'world');assert.equal((await state()).area,'road');assert.equal((await state()).flags.slimes,undefined);
await p.setViewportSize({width:1280,height:720});await p.screenshot({path:'output/qa/laptop-world.png'});
// Corrupt and future saves offer a new game, never a broken continue.
await p.evaluate(()=>localStorage.setItem('hundred-bonds-save-v1','{"version":99,"data":{}}'));await p.reload();await p.locator('[data-action="new"]').waitFor();assert.equal(await p.locator('[data-action="continue"]').count(),0);
assert.deepEqual(errors,[]);console.log('BROWSER EDGES PASSED: responsive layout, pause, settings, target cancellation, battle checkpoint, corrupt save.');fs.writeFileSync('output/qa/edges.json',JSON.stringify({passed:true,errors}));await browser.close();
