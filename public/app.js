import {defaults,remaining,nextPhase,phaseState,pauseState} from './engine.mjs';
const $=id=>document.getElementById(id), key='manman-learning-v1';
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
const validDurations=d=>d&&['explore','focus','rest'].every(k=>Number.isFinite(d[k])&&d[k]>=1&&d[k]<=90);
let durations=validDurations(saved?.durations)?saved.durations:{...defaults};
let mode=saved?.mode==='inquiry'?'inquiry':'gentle';
let state=saved?.state&&['explore','focus','rest'].includes(saved.state.phase)&&Number.isFinite(saved.state.remaining)&&Number.isFinite(saved.state.total)&&saved.state.total>0&&(!saved.state.running||Number.isFinite(saved.state.startedAt))?saved.state:phaseState('explore',durations);
let records=Array.isArray(saved?.records)?saved.records:[];
let pendingNext=null,toastTimer,lastPhase='',finished=false;
$('question').value=typeof saved?.question==='string'?saved.question:'';$('subject').value=typeof saved?.subject==='string'?saved.subject:'';
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function persist(){try{localStorage.setItem(key,JSON.stringify({durations,mode,state,records,question:$('question').value,subject:$('subject').value}));}catch{toast('浏览器未能保存，请导出足迹备份。');}}
const names={explore:'找到一个问题',focus:'试着解决问题',rest:'自由休息'};
function render(){const r=remaining(state);$('clock').textContent=`${String(Math.floor(Math.ceil(r)/60)).padStart(2,'0')}:${String(Math.ceil(r)%60).padStart(2,'0')}`;$('timerCircle').style.setProperty('--progress',`${Math.max(0,Math.min(100,(1-r/state.total)*100))}%`);$('toggle').textContent=state.running?'暂停一下':r===0?'这一段已结束':r===state.total?'开始这一小步':'继续这一小步';$('toggle').disabled=r===0;$('timerStatus').textContent=state.running?'只待这一小会儿':r===0?'你可以决定下一步':r===state.total?'准备好了再开始':'已暂停，时间留在这里';
$('advance').textContent=state.phase==='explore'?'已经找到问题，开始思考':state.phase==='focus'?'提前结束，留下这一小步':mode==='inquiry'?'休息好了，回到找问题':'休息好了，开始下一轮';
$('phaseLabel').textContent=`${state.phase==='rest'?'☕':'✧'} ${names[state.phase]}`;
$('timerMeta').textContent={explore:'给开始一点时间',focus:'只尝试眼前这一个问题',rest:'这段时间，自由支配'}[state.phase];
$('promise').textContent=state.phase==='focus'?'没解决也可以，到点就有权休息。':state.phase==='rest'?'不必有成果，也值得休息。':'时间到了，再决定下一步。';
$('taskHint').textContent=state.phase==='focus'?'暂停外部小说或视频，只尝试这一件小事。':mode==='inquiry'?'浏览一小段资料，看看哪里有一个“为什么”。':'可以放着熟悉的小说，打开资料，随便翻一翻。';
$('taskTitle').textContent=state.phase==='focus'?'只试着弄懂眼前这一点':'先找到一个想弄懂的问题';
document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
const phases=mode==='gentle'?['explore','focus','rest']:['explore','focus'];$('journey').replaceChildren(...phases.map((p,i)=>{const li=document.createElement('li');li.className=p===state.phase?'active':'';li.innerHTML=`<span class="step-icon">${p==='explore'?'✧':p==='focus'?'◎':'☕'}</span><div><b>${names[p]}</b><small>${durations[p]} min</small><p>${p==='explore'?(mode==='inquiry'?'发现疑惑，不急着作答':'允许陪伴，随便翻一翻'):p==='focus'?'只试一个小问题':'小说、散步，或者发会儿呆'}</p></div>`;return li;}));
if(state.running&&r===0&&!finished){finished=true;state=pauseState(state);state.remaining=0;persist();finishPhase();}
if(lastPhase!==state.phase){lastPhase=state.phase;finished=false;}
document.title=state.running?`${$('clock').textContent} · ${names[state.phase]} · 慢慢`:'慢慢 · 给好奇心一点时间';}
function enter(phase){state=phaseState(phase,durations);finished=false;$('decision').hidden=true;persist();render();}
function decision(title,copy,actions){state=pauseState(state);persist();$('decisionTitle').textContent=title;$('decisionCopy').textContent=copy;$('decisionActions').replaceChildren(...actions.map(([text,fn])=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;return b;}));$('decision').hidden=false;render();}
function exploreChoices(){decision('还没找到问题？也没关系。','先把范围缩小：只看一页、一个词，或者一个步骤。你也可以今天到这里。',[
['用一个提示，帮我缩小范围',()=>{$('decision').hidden=true;$('hints').hidden=false;$('hints').scrollIntoView({behavior:'smooth',block:'center'});$('question').focus();}],
['再探索 2 分钟',()=>{state={...phaseState('explore',durations),total:120,remaining:120};finished=false;$('decision').hidden=true;persist();render();}],
['先自由休息',()=>enter('rest')]
]);}
function finishPhase(){if(state.phase==='explore'){if(!$('question').value.trim())return exploreChoices();decision('有了一个小问题，真好。','现在可以试着解决它，也可以先休息。',[['带着问题开始思考',()=>enter('focus')],['再整理一下问题',()=>{$('decision').hidden=true;$('question').focus();}],['先休息一下',()=>enter('rest')]]);}else if(state.phase==='focus'){showReflection(nextPhase(mode,'focus'));}else{decision('休息结束了，不用着急。','准备好后，重新找到一个想靠近的小问题。',[['回到找问题',()=>enter('explore')],['再休息 2 分钟',()=>{state={...phaseState('rest',durations),total:120,remaining:120};finished=false;$('decision').hidden=true;persist();render();}]]);}}
function showReflection(next){state=pauseState(state);persist();pendingNext=next;$('note').value='';$('outcome').selectedIndex=0;$('feeling').value='';$('reflectionForm').querySelector('button[type=submit]').textContent=next==='explore'?'收好，回到找问题':'收好，安心休息';if(!$('reflection').open)$('reflection').showModal();render();}
function skipReflection(){const next=pendingNext||nextPhase(mode,'focus');$('reflection').close();pendingNext=null;enter(next);toast('可以先不记录，准备好后再开始。');}
$('toggle').onclick=()=>{if(remaining(state)<=0)return;state=state.running?pauseState(state):{...state,running:true,startedAt:Date.now()};persist();render();};
$('reset').onclick=()=>decision('重新留出这一小段时间？','问题和足迹会保留，当前阶段的计时会重新开始。',[['重新计时',()=>enter(state.phase)],['保留当前计时',()=>{$('decision').hidden=true;render();}]]);
$('advance').onclick=()=>{if(state.phase==='explore'){if(!$('question').value.trim())return exploreChoices();enter('focus');}else if(state.phase==='focus')showReflection(nextPhase(mode,'focus'));else enter('explore');};
$('restNow').onclick=()=>{if(state.phase==='focus')showReflection('rest');else enter('rest');};
$('helpOpen').onclick=()=>$('hints').hidden=!$('hints').hidden;
document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{if($('question').value.trim()){toast('问题框里已有内容，请在原问题上修改；提示没有覆盖它。');$('question').focus();return;}$('question').value=b.dataset.template;persist();$('question').focus();});
['subject','question'].forEach(id=>$(id).addEventListener('input',persist));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;persist();render();toast('模式已切换，当前阶段的计时会保留。');});
function openSettings(){for(const p of Object.keys(defaults))$(p+'Duration').value=durations[p];$('settings').showModal();}
$('settingsOpen').onclick=openSettings;$('editPace').onclick=openSettings;
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>b.dataset.preset.split(',').forEach((n,i)=>$(Object.keys(defaults)[i]+'Duration').value=n));
$('saveSettings').onclick=()=>{const d=Object.fromEntries(Object.keys(defaults).map(p=>[p,Number($(p+'Duration').value)]));if(!validDurations(d)){toast('每段请填写 1 到 90 分钟。');return;}durations=d;persist();$('settings').close();render();toast('节奏已保存，从下一段开始使用。');};
$('closeReflection').onclick=skipReflection;$('reflection').addEventListener('cancel',e=>{e.preventDefault();skipReflection();});
$('reflectionForm').onsubmit=e=>{e.preventDefault();records.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),subject:$('subject').value.trim(),question:$('question').value.trim(),seconds:Math.max(0,Math.round(state.total-remaining(state))),outcome:$('outcome').value,note:$('note').value.trim(),feeling:$('feeling').value});const next=pendingNext||nextPhase(mode,'focus');pendingNext=null;$('reflection').close();enter(next);renderRecords();};
function renderRecords(){const root=$('records');root.replaceChildren();if(!records.length){root.innerHTML='<div class="empty"><span>❧</span><div><b>这里，等着你的第一个小发现。</b><p>没有打卡，没有连续天数。一次尝试，就值得留下。</p></div></div>';return;}for(const r of records){const el=document.createElement('article');el.className='entry';const time=document.createElement('small');time.textContent=new Date(r.at).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})+' · '+new Date(r.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});const body=document.createElement('div'),title=document.createElement('strong');title.textContent=r.question||r.subject||'一次小小的尝试';body.append(title);if(r.note){const p=document.createElement('p');p.textContent=r.note;body.append(p);}const detail=document.createElement('p');detail.textContent=[r.outcome,r.feeling,`${Math.floor(r.seconds/60)} 分 ${r.seconds%60} 秒`].filter(Boolean).join(' · ');body.append(detail);const badge=document.createElement('span');badge.textContent='一点点，也算数';el.append(time,body,badge);root.append(el);}}
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({app:'慢慢',exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'}));a.href=url;a.download='慢慢-学习足迹.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();renderRecords();if(state.remaining===0&&!state.running)finishPhase();setInterval(render,500);document.addEventListener('visibilitychange',render);
