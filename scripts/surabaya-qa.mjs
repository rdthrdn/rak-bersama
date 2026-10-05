import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('output/phase5',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
await page.goto('http://localhost:5173?renderer=canvas');await page.locator('[data-action="new"]').click();await page.waitForTimeout(3500);
await page.screenshot({path:'output/phase5/01-kampung.png'});
async function position(area,x,y){await page.evaluate(({area,x,y})=>{const save=JSON.parse(localStorage.getItem('hundred-bonds-save-v1'));Object.assign(save.data,{area,x,y});localStorage.setItem('hundred-bonds-save-v1',JSON.stringify(save));},{area,x,y});await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForTimeout(3300);assert.equal((await state()).area,area);}
for(const [name,area,x,y]of [['02-warung','town',400,570],['03-alley','town',680,822],['04-gate','town',1450,650],['05-urban-road','road',1050,560],['06-belfry','dungeon',1260,360]]){
 await position(area,x,y);await page.screenshot({path:`output/phase5/${name}.png`});const s=await state();assert.equal(s.mode,'world');assert.ok(s.movement.player.feet.y>295&&s.movement.player.feet.y<860);
}
// A previously valid save inside the new street frontage must recover and remain playable.
await position('road',280,350);const recovered=(await state()).player;assert.ok(Math.hypot(recovered.x-280,recovered.y-350)>20);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');assert.ok((await state()).player.x<recovered.x-15);
// Parked motorcycles are solid at ground level, while their upper silhouette can occlude.
await position('town',450,581);await page.keyboard.down('ArrowUp');await page.waitForTimeout(250);await page.keyboard.up('ArrowUp');const stopped=(await state()).player;assert.ok(stopped.y>=552&&stopped.y<568);
await position('road',1280,690);await page.keyboard.down('Shift');await page.keyboard.down('ArrowDown');await page.waitForTimeout(350);await page.keyboard.up('ArrowDown');await page.keyboard.up('Shift');assert.ok((await state()).player.y<713);
assert.deepEqual(errors,[]);fs.writeFileSync('output/phase5/result.json',JSON.stringify({passed:true,errors}));console.log('SURABAYA QA PASSED: showcase, alley, gate, road, belfry, save recovery; zero browser errors.');await browser.close();
