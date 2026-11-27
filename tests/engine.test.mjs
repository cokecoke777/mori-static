import {test} from 'node:test';import assert from 'node:assert/strict';import {remaining,pauseState,nextPhase,phaseState,defaults} from '../public/engine.mjs';
test('计时使用真实时间，后台或刷新不会造成倒计时漂移',()=>{const s={...phaseState('focus',defaults),running:true,startedAt:1000};assert.equal(remaining(s,31000),570);assert.equal(remaining(s,1000000),0);});
test('暂停后不继续扣时',()=>{const s=pauseState({...phaseState('explore',defaults),running:true,startedAt:1000},61000);assert.equal(remaining(s,999999),240);assert.equal(s.running,false);});
test('两种模式的循环和手动休息回路',()=>{assert.equal(nextPhase('gentle','focus'),'rest');assert.equal(nextPhase('inquiry','focus'),'explore');assert.equal(nextPhase('inquiry','rest'),'explore');assert.equal(nextPhase('gentle','explore'),'focus');});
test('新阶段等待主动开始',()=>{assert.deepEqual(phaseState('rest',{...defaults,rest:3}),{phase:'rest',total:180,remaining:180,running:false,startedAt:null});});
