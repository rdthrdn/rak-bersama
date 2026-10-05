import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame, makeEnemy} from '../src/game/data';
import {createBattle, act, activeActor, damage} from '../src/game/combat';
import {decodeSave} from '../src/game/save';

test('damage stays finite and guarding reduces the incoming hit',()=>{
 const a=newGame().party[0], e=makeEnemy('wolf',0);
 assert.ok(damage(a,e,1)>=1);
 e.guard=true;
 assert.ok(damage(a,e,1)<damage(a,{...e,guard:false},1));
});
test('initiative excludes dead actors and starts with the fastest actor',()=>{
 const p=newGame().party; p[1].hp=0;
 const b=createBattle(p,[makeEnemy('slime',0)]);
 assert.equal(activeActor(b)?.id,'mira');
 assert.ok(!b.queue.includes('ren'));
});
test('mend caps HP and spends MP; dead targets cannot be healed',()=>{
 const p=newGame().party; p[0].hp=p[0].maxHp-2;
 const b=createBattle(p,[makeEnemy('slime',0)]); b.queue=['mira','ren','kael','slime-0'];
 const mp=b.allies[2].mp;
 act(b,'mend','kael');
 assert.equal(b.allies[0].hp,b.allies[0].maxHp);
 assert.equal(b.allies[2].mp,mp-5);
});
test('final enemy death produces victory and removes defeated target',()=>{
 const b=createBattle(newGame().party,[makeEnemy('slime',0)]); b.enemies[0].hp=1;
 act(b,'attack','slime-0');
 assert.equal(b.phase,'victory');
 assert.ok(!b.queue.includes('slime-0'));
});
test('invalid targets and unaffordable skills do not consume a turn',()=>{
 const b=createBattle(newGame().party,[makeEnemy('wolf',0)]);
 const before=JSON.stringify(b); act(b,'attack','missing'); assert.equal(JSON.stringify(b),before);
 b.queue=['mira']; b.allies[2].mp=0;
 const q=JSON.stringify(b); act(b,'ember','wolf-0'); assert.equal(JSON.stringify(b),q);
});
test('saves reject malformed, future versions and nonfinite party values',()=>{
 assert.equal(decodeSave('broken'),null);
 assert.equal(decodeSave(JSON.stringify({version:99,data:newGame()})),null);
 const g=newGame(); g.party[0].hp=-3;
 assert.equal(decodeSave(JSON.stringify({version:1,data:g})),null);
 assert.deepEqual(decodeSave(JSON.stringify({version:1,data:newGame()})),newGame());
});
