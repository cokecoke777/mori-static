export const defaults={explore:5,focus:10,rest:5};
export function remaining(state,now=Date.now()){return Math.max(0,state.remaining-(state.running?Math.max(0,now-state.startedAt)/1000:0));}
export function nextPhase(mode,phase){return phase==='explore'?'focus':phase==='focus'?(mode==='inquiry'?'explore':'rest'):'explore';}
export function phaseState(phase,durations){return {phase,remaining:durations[phase]*60,total:durations[phase]*60,running:false,startedAt:null};}
export function pauseState(state,now=Date.now()){return {...state,remaining:remaining(state,now),running:false,startedAt:null};}
