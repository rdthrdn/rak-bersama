import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('output/phase1',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:800},recordVideo:{dir:'output/phase1/video',size:{width:1280,height:800}}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
await page.goto('http://localhost:5173?renderer=canvas');await page.locator('[data-action="new"]').click();await page.waitForTimeout(3200);
const first=(await state()).movement.player;await page.waitForTimeout(450);const idle=(await state()).movement.player;assert.deepEqual(first.feet,idle.feet);assert.notEqual(first.bodyOffset,idle.bodyOffset);assert.equal(idle.state,'IDLE');
await page.screenshot({path:'output/phase1/idle.png'});
for(const [key,dir]of [['ArrowUp','up'],['ArrowRight','right'],['ArrowDown','down'],['ArrowLeft','left']]){
 await page.keyboard.down(key);await page.waitForTimeout(350);const s=(await state()).movement;assert.equal(s.player.direction,dir);assert.equal(s.player.state,'WALK');assert.ok(s.player.speed>150);await page.screenshot({path:`output/phase1/walk-${dir}.png`});await page.keyboard.up(key);
 const released=(await state()).movement.player;await page.waitForTimeout(150);const stopped=(await state()).movement.player;assert.equal(stopped.state,'IDLE');assert.ok(Math.hypot(stopped.x-released.x,stopped.y-released.y)<12);
}
await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);assert.equal((await state()).movement.player.state,'RUN');assert.ok((await state()).movement.player.speed>280);await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');await page.waitForTimeout(150);
await page.locator('[data-action="pause"]').click();const paused=(await state()).movement.player;await page.keyboard.down('ArrowUp');await page.waitForTimeout(150);await page.keyboard.up('ArrowUp');assert.deepEqual((await state()).movement.player.feet,paused.feet);await page.locator('[data-action="close"]').click();await page.waitForTimeout(100);assert.equal((await state()).movement.player.state,'IDLE');
// Loading near the southern boundary keeps the whole formation on the map.
await page.evaluate(()=>{const v=JSON.parse(localStorage.getItem('hundred-bonds-save-v1'));v.data.x=700;v.data.y=852;localStorage.setItem('hundred-bonds-save-v1',JSON.stringify(v));});
await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForTimeout(300);assert.ok((await state()).movement.followers.every(f=>f.y<860));
// A save fixture positions the feet just south of the existing fountain collider.
await page.evaluate(()=>{const v=JSON.parse(localStorage.getItem('hundred-bonds-save-v1'));v.data.x=670;v.data.y=590;localStorage.setItem('hundred-bonds-save-v1',JSON.stringify(v));});
await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForTimeout(600);await page.keyboard.down('ArrowUp');await page.waitForTimeout(450);const wall=(await state()).movement.player;assert.ok(wall.y>=564&&wall.y<590);assert.equal(wall.state,'IDLE');assert.equal(wall.speed,0);await page.screenshot({path:'output/phase1/wall.png'});await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);assert.equal((await state()).movement.player.direction,'right');await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowUp');
assert.deepEqual(errors,[]);console.log('MOVEMENT QA PASSED: 4 directions, idle breathing, run, short stop, grounded origin, pause/resume, wall animation.');fs.writeFileSync('output/phase1/result.json',JSON.stringify({passed:true,errors}));await browser.close();
