import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MovementModel} from '../src/entities/MovementModel';

test('movement responds immediately and diagonals retain walking speed',()=>{
 const m=new MovementModel();const d=m.step(1,1,false,16);assert.ok(d.x>0&&d.y>0);assert.ok(Math.abs(Math.hypot(m.vx,m.vy)-225)<.01);
});
test('release stops within 90ms without a long slide',()=>{
 const m=new MovementModel();m.step(1,0,false,16);let distance=0;for(let i=0;i<6;i++)distance+=m.step(0,0,false,16).x;
 assert.ok(distance<10);assert.equal(m.vx,0);assert.equal(m.state,'IDLE');
});
test('blocked movement stops the walk cycle and preserves facing',()=>{
 const m=new MovementModel();m.step(0,-1,false,16);m.observeDisplacement(0,0,16);assert.equal(m.state,'IDLE');assert.equal(m.direction,'up');assert.equal(m.distance,0);
});
test('run is faster, dialogue freezes movement, and idle retains direction',()=>{
 const m=new MovementModel();m.step(-1,0,true,16);assert.equal(m.state,'RUN');assert.equal(m.direction,'left');assert.ok(Math.abs(m.vx)>225);
 m.setState('INTERACT');assert.deepEqual(m.step(1,0,false,16),{x:0,y:0});assert.equal(m.direction,'left');
 m.setState('IDLE');m.step(0,0,false,16);assert.equal(m.direction,'left');
});
test('animation stride follows real distance, not attempted wall movement',()=>{
 const m=new MovementModel();m.step(1,0,false,16);m.observeDisplacement(3.6,0,16);assert.equal(m.distance,3.6);m.step(1,0,false,16);m.observeDisplacement(0,0,16);assert.equal(m.distance,3.6);
});

test('wall sliding faces the actual displacement instead of blocked input',()=>{
 const m=new MovementModel();m.step(1,-1,false,16);m.observeDisplacement(2.5,0,16);assert.equal(m.direction,'right');
});
