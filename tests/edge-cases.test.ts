import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,makeEnemy} from '../src/game/data';
import {act,activeActor,createBattle,enemyTurn} from '../src/game/combat';

test('enemy AI produces defeat when the last living hero falls',()=>{const p=newGame().party;p[0].hp=1;p[1].hp=p[2].hp=0;const b=createBattle(p,[makeEnemy('wolf',0)]);assert.equal(activeActor(b)?.id,'wolf-0');enemyTurn(b);assert.equal(b.phase,'defeat');assert.ok(b.allies.every(a=>a.hp===0));});
test('taunt redirects normal attacks to the living vanguard',()=>{const b=createBattle(newGame().party,[makeEnemy('wolf',0)]);b.queue=['kael','wolf-0','ren','mira'];act(b,'taunt','kael');const before=b.allies.map(a=>a.hp);enemyTurn(b);assert.ok(b.allies[0].hp<before[0]);assert.equal(b.allies[1].hp,before[1]);assert.equal(b.allies[2].hp,before[2]);});
test('boss phase two damages every living ally',()=>{const e=makeEnemy('boss',0);e.hp=350;const b=createBattle(newGame().party,[e]);b.round=2;b.queue=[e.id,'kael','ren','mira'];const before=b.allies.map(a=>a.hp);enemyTurn(b);assert.ok(b.allies.every((a,i)=>a.hp<before[i]));assert.match(b.log,/whole party/);});
test('guard expires on the owner next action, and no empty item is consumed',()=>{const b=createBattle(newGame().party,[makeEnemy('slime',0)],0);b.queue=['kael','ren','mira','slime-0'];act(b,'guard','kael');assert.ok(b.allies[0].guard);b.queue=['kael'];const before=JSON.stringify(b);assert.equal(act(b,'potion','kael'),false);assert.equal(JSON.stringify(b),before);act(b,'attack','slime-0');assert.equal(b.allies[0].guard,false);});
test('overdrive expires after two subsequent critical attacks',()=>{const b=createBattle(newGame().party,[makeEnemy('boss',0)]);b.queue=['ren'];act(b,'overdrive','ren');for(let i=0;i<3;i++){b.queue=['ren'];act(b,'attack','boss-0');assert.equal(b.events[0].critical,i<2);}});
test('dead allies cannot be targeted with a potion',()=>{const p=newGame().party;p[0].hp=0;const b=createBattle(p,[makeEnemy('slime',0)]);const snapshot=JSON.stringify(b);assert.equal(act(b,'potion','kael'),false);assert.equal(JSON.stringify(b),snapshot);});
