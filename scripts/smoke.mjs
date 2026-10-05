import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(60000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
fs.mkdirSync('output/qa',{recursive:true});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const shot=async name=>{const s=await state();console.log(name,JSON.stringify({mode:s.mode,player:s.player}));};
async function move(x,y){
 for(let i=0;i<35;i++){
  const s=await state();const dx=x-s.player.x,dy=y-s.player.y;if(Math.hypot(dx,dy)<18)return;
  const keys=[];if(Math.abs(dx)>8)keys.push(dx>0?'ArrowRight':'ArrowLeft');if(Math.abs(dy)>8)keys.push(dy>0?'ArrowDown':'ArrowUp');
  for(const k of keys)await page.keyboard.down(k);
  await page.evaluate(ms=>window.advanceTime(ms),Math.min(240,Math.max(Math.abs(dx),Math.abs(dy))*4));
  for(const k of keys)await page.keyboard.up(k);
  await page.waitForTimeout(25);
 }
 throw new Error('Could not reach '+x+','+y+' '+JSON.stringify((await state()).player));
}
async function interact(){await page.locator('[data-action="interact"]').first().click();await page.waitForTimeout(120);}
async function talk(){if(await page.locator('[data-action="pause"]').count())throw new Error('Pause can interrupt dialogue');for(let i=0;i<25;i++){let s=await state();if(!s.dialogue)return;const c=page.locator('[data-action="choice"]');if(await c.count())await c.first().click();else await page.keyboard.press('e');await page.waitForTimeout(60);}throw new Error('Dialogue stuck');}
async function battle(name){
 await page.waitForTimeout(700);await shot(name+'-battle');let actions=0;
 for(let i=0;i<160;i++){
  let s=await state();if(s.modal==='victory'){await shot(name+'-victory');await page.keyboard.press('Escape');if((await state()).modal!=='victory')throw new Error('Escape dismissed the victory reward');await page.locator('[data-action="reward"]').click();await page.waitForTimeout(450);return;}
  if(s.modal==='defeat')throw new Error('Defeated in '+name);
  if(s.busy||s.battle?.phase!=='command'){await page.waitForTimeout(250);continue;}
  const b=s.battle,actor=b.allies.find(a=>a.id===b.queue[0]);if(!actor){await page.waitForTimeout(250);continue;}
  const target=b.enemies.filter(e=>e.hp>0).sort((a,b)=>a.hp-b.hp)[0];const hurt=b.allies.filter(a=>a.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  let command='attack',targetId=target.id;
  if(hurt.hp<hurt.maxHp*.45&&b.potions>0){await page.locator('[data-value="items"]').click();command='potion';targetId=hurt.id;}
  else if(actor.id==='mira'&&actor.mp>=6){await page.locator('[data-value="skills"]').click();command='ember';}
  else if(actor.id==='ren'&&actor.mp>=4){await page.locator('[data-value="skills"]').click();command=target.hp/target.maxHp<.4&&actor.mp>=6?'execute':'twin';}
  else if(actor.id==='kael'&&actor.mp>=5){await page.locator('[data-value="skills"]').click();command='breaker';}
  await page.locator(`[data-action="command"][data-value="${command}"]`).click();
  await page.locator(`[data-action="target"][data-value="${targetId}"]`).click();actions++;await page.waitForTimeout(220);
 }
 throw new Error('Combat exceeded action bound '+name+' actions '+actions);
}
try{
 await page.goto('http://localhost:5173?view=classic',{waitUntil:'domcontentloaded'});await page.locator('[data-action="new"]').waitFor();await page.waitForTimeout(500);await shot('01-title');await page.locator('[data-action="new"]').click();await page.waitForTimeout(700);await shot('02-town');
 await move(760,650);await move(760,490);await interact();await shot('03-dialogue');await talk();
 if(!(await state()).flags.promise)throw new Error('Promise missing');
 await move(820,650);await move(1400,650);await interact();await page.waitForTimeout(400);await move(490,680);await interact();await battle('04-slimes');
 await move(715,575);await move(950,575);await move(980,540);await interact();await battle('05-wolves');
 await move(1440,560);await interact();await page.waitForTimeout(400);await shot('06-dungeon');await move(410,740);await interact();await move(600,735);await move(690,610);await interact();await battle('07-wraiths');
 await move(1015,590);await move(1215,431);await interact();await talk();await battle('08-boss');await shot('09-ending');
 if((await state()).mode!=='ending')throw new Error('Ending missing');
 await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForTimeout(400);if((await state()).mode!=='ending')throw new Error('Save recovery failed');await shot('10-reloaded');
 console.log('FULL JOURNEY PASSED',JSON.stringify({errors}));fs.writeFileSync('output/qa/result.json',JSON.stringify({passed:true,errors},null,2));if(errors.length)process.exitCode=1;
}catch(e){console.error(e);console.log('failure',JSON.stringify({mode:(await state()).mode,player:(await state()).player}));fs.writeFileSync('output/qa/result.json',JSON.stringify({passed:false,error:String(e),errors},null,2));process.exitCode=1;}
await browser.close();
