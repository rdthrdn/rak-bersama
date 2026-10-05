import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('output/phase2',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
await page.goto('http://localhost:5173?renderer=canvas');await page.locator('[data-action="new"]').click();await page.waitForTimeout(1200);await page.screenshot({path:'output/phase2/town.png'});
async function position(area,x,y){await page.evaluate(({area,x,y})=>{const v=JSON.parse(localStorage.getItem('hundred-bonds-save-v1'));Object.assign(v.data,{area,x,y});localStorage.setItem('hundred-bonds-save-v1',JSON.stringify(v));},{area,x,y});await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForTimeout(3200);}
for(const [name,area,x,y,id,behind]of [
 ['fountain-behind','town',670,495,'town-fountain',true],
 ['fountain-front','town',670,590,'town-fountain',false],
 ['house-behind','town',350,345,'town-house-0',true],
 ['house-front','town',350,570,'town-house-0',false],
 ['column-behind','dungeon',1110,450,'dungeon-column-2',true],
 ['column-front','dungeon',1110,540,'dungeon-column-2',false]
]){
 await position(area,x,y);const s=(await state()).movement,object=s.scenery.objects.find(o=>o.id===id);assert.ok(object,`Missing ${id}`);assert.equal(s.player.depth,s.player.feet.y);assert.equal(s.player.depth<Math.max(...object.depths),behind);assert.ok(s.scenery.layers.shadow<s.player.depth);assert.ok(s.scenery.layers.foreground>s.player.depth);
 await page.screenshot({path:`output/phase2/${name}.png`});
}
await position('town',130,830);await page.screenshot({path:'output/phase2/foreground.png'});
// A visible facade blocks the feet before they enter the building.
await position('town',350,570);await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');await page.waitForTimeout(100);const houseStop=(await state()).movement;assert.ok(houseStop.player.feet.y>=516.4);assert.equal(houseStop.player.state,'IDLE');await page.screenshot({path:'output/phase2/house-collision.png'});
// A pre-rebuild save inside the expanded facade recovers to walkable ground.
await position('town',350,480);const recovered=(await state()).player;assert.ok(recovered.y>516.4);await page.keyboard.down('ArrowDown');await page.waitForTimeout(200);await page.keyboard.up('ArrowDown');assert.ok((await state()).player.y>recovered.y+15);
// World interaction and dialogue must each consume one keyboard press.
await position('town',760,490);await page.keyboard.press('e');assert.ok((await state()).dialogue);await page.keyboard.press('Space');assert.ok((await state()).dialogue);
// Traverse around the column's collider to cross its ordering line through real input.
await position('dungeon',1110,450);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(230);await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowDown');await page.waitForTimeout(500);await page.keyboard.up('ArrowDown');await page.waitForTimeout(100);
const crossed=(await state()).movement;assert.ok(crossed.player.y>510);assert.ok(crossed.player.depth>crossed.scenery.objects.find(o=>o.id==='dungeon-column-2').depths[0]);
await page.screenshot({path:'output/phase2/column-crossed.png'});assert.deepEqual(errors,[]);fs.writeFileSync('output/phase2/result.json',JSON.stringify({passed:true,errors}));console.log('DEPTH QA PASSED: fountain, split house, column behind/front, feet sorting, ground shadows, foreground, real traversal.');await browser.close();
