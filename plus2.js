/* ===== 더하기 2 특훈 (깡총이) — bridge from the visible number line to mental +2 =====
   uses math.js (MT, MGAME, numKo, opClip, chefRow, eqHtml, Q, numOpts, numCards, maState, maReward, rint, tick)
   + hangul.js (good, bad, koPraise) + main page helpers. Clips: audio/ma.js (numbers, op phrases) + audio/p2.js (prompts) */
document.head.insertAdjacentHTML('beforeend', `<style>
.flip{display:inline-block;transform:scaleX(-1)}
.p2vis{width:100%;display:flex;justify-content:center}
.p2rows{display:flex;flex-direction:column;align-items:center;gap:4px}
.eq.sm{font-size:clamp(30px,6vmin,52px)}
.eq.dim{opacity:.3}
.eq.p2big{background:var(--card);border-radius:24px;padding:4px 22px;box-shadow:var(--shadow);animation:pop .5s}
.p2note{font-family:var(--f-display);font-weight:700;font-size:clamp(20px,3.6vmin,30px);color:var(--berry);animation:pop .5s}
.popin{animation:pop .4s}
.pond.p3{width:min(440px,100%)}
.stone .sn{pointer-events:none}
.stone.lit{background:#F4E3A1}
.roo .flip{font-size:inherit}
.hopbox{height:clamp(120px,20vmin,160px);width:min(420px,100%);display:flex;align-items:flex-end;justify-content:center;border-bottom:6px dotted rgba(36,48,92,.18)}
.shadowroo{font-size:clamp(60px,12vmin,96px);line-height:1;filter:brightness(0);opacity:.25;transform:translateX(-110px)}
.shadowroo.go{animation:hop2 1.5s ease-in-out forwards}
@keyframes hop2{0%{transform:translate(-110px,0)}22%{transform:translate(-55px,-60px)}45%{transform:translate(0,0)}72%{transform:translate(55px,-60px)}95%,100%{transform:translate(110px,0)}}
.feet{gap:clamp(12px,3vmin,26px)}
.foot{width:clamp(88px,15vmin,124px);aspect-ratio:1;border-radius:50%;background:var(--card);box-shadow:var(--shadow);font-size:clamp(38px,7vmin,56px);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.foot.start{background:#F4E3A1}
.foot.on{background:var(--butter);animation:pop .35s}
.foot .fn{font-family:var(--f-display);font-weight:700;font-size:.62em;min-height:1em;color:var(--ink)}
.mach{display:flex;align-items:center;justify-content:center;gap:clamp(6px,2vmin,14px)}
.mach .arrow{font-size:clamp(24px,4.5vmin,36px);color:var(--ink-soft)}
.mbox{background:var(--blue);color:#fff;border-radius:26px;padding:14px 20px;font-family:var(--f-display);font-weight:700;font-size:clamp(32px,6vmin,54px);box-shadow:var(--shadow)}
.mbox.shake{animation:shake .5s}
.mnum2{background:var(--card);border-radius:20px;box-shadow:var(--shadow);min-width:1.5em;padding:4px 12px;font-family:var(--f-display);font-weight:700;font-size:clamp(40px,8vmin,66px);text-align:center;color:var(--ink)}
.mnum2.got{color:var(--good);animation:pop .4s}
.p2chip{font-family:var(--f-display);font-weight:700;font-size:24px;background:var(--card);border-radius:16px;padding:8px 16px;box-shadow:var(--shadow)}
:root[data-device="phone"] .eq.sm{font-size:30px}
:root[data-device="phone"] .foot{width:80px;font-size:34px}
:root[data-device="phone"] .mbox{font-size:28px;padding:10px 14px}
:root[data-device="phone"] .mnum2{font-size:36px}
</style>`);

const P2S = [
  {id:'chain',   t:'+1 두 번 = +2',     k:'아는 더하기 1로 시작해요',      e:'➕'},
  {id:'fade',    t:'사라지는 징검다리', k:'돌의 숫자가 하나씩 숨어요',     e:'🪨'},
  {id:'voice',   t:'입으로 깡총',       k:'엄마랑 소리 내어 이어 세기',    e:'👣'},
  {id:'machine', t:'+2 마법 기계',      k:'식만 보고 풀어요',              e:'✨'},
  {id:'flash',   t:'번개 +2',           k:'빠르게 풀기 · 보너스',          e:'⚡'}
];
const P2CORE = ['chain','fade','voice','machine'];
const p2St = () => { const m=maState(); if(!m.p2) m.p2 = {done:{}}; return m.p2; };
const ROO = '<span class="frog roo" id="roo"><span class="flip">🦘</span></span>';

function p2Home(){
  curLang='ma'; updateBar(); nav('수학 · 더하기 2 특훈', maHome);
  const d = p2St().done;
  stage.innerHTML = `
    <div class="hero"><h1>🦘 깡총이의 더하기 2</h1><p>보이는 징검다리 → 머릿속 징검다리</p></div>
    <div class="grid2">
      ${P2S.map((s,i)=>`
        <button class="stagebtn ${d[s.id]?'done':''}" data-s="${s.id}">
          <span class="num">${i+1}</span>
          <span style="min-width:0"><span class="t ko-s">${s.e} ${s.t}</span><span class="k">${s.k}</span></span>
          <span class="stk" aria-hidden="true">${d[s.id]?'⭐':''}</span>
        </button>`).join('')}
    </div>
    <div class="guide">엄마 가이드: 1번부터 차례로 해요. 숫자 돌이 점점 숨어서, 마지막에는 식만 보고 머릿속으로 두 번 뛰어요. 틀리면 깡총이가 무엇을 틀렸는지 알려 주고, 2번에서는 돌을 하나 더 보여 줘요.</div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>p2Go(b.dataset.s));
}
async function p2Go(id){
  const s = P2S.find(x=>x.id===id); curLang='ma'; updateBar(); nav(`더하기 2 · ${s.t}`, p2Home);
  const title = $('#barName').textContent;
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio('ma'), loadAudio('p2')]);
  if($('#barName').textContent !== title) return;
  P2GAME[id]();
}
function p2Done(id){
  const st = p2St(); st.done[id] = true; save();
  if(P2CORE.every(k=>st.done[k]) && !maState().done.plus2) return maReward('plus2');
  const i = P2S.findIndex(s=>s.id===id), s = P2S[i], nx = P2S[i+1];
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${s.e}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2><p class="guide">${s.t} 끝!</p></div>
    <div class="row"><button class="big alt" id="toP2">⬅️ 깡총이</button>${nx?`<button class="big go" id="nextS">다음: ${nx.t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨🦘'); koPraise();
  $('#toP2').onclick = p2Home;
  if(nx) $('#nextS').onclick = ()=>p2Go(nx.id);
}

/* ---------- shared ---------- */
/* start numbers per round, no immediate repeats */
function p2Seq(spec){ let prev=-1; return spec.map(([lo,hi])=>{ let a; do{ a=rint(lo,hi); }while(a===prev && hi>lo); prev=a; return a; }); }
const rep = (n, r) => Array(n).fill(r);
/* options for a+2 always include the +1 mistake */
const p2Opts = a => shuffle([a+2, a+1, Math.random()<.5 ? a+3 : a]);
function fillQ(n, id='qv'){ const q=$('#'+id); if(q){ q.textContent=n; q.classList.add('got'); } }
/* answer cards inside host; resolves on the right answer; onWrong(n) runs after a wrong tap */
function p2Ask(host, ans, opts, onWrong){
  host.innerHTML = numCards(opts);
  return new Promise(res=>{
    let locked=false;
    host.querySelectorAll('.card.num').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      const n = +c.dataset.n;
      if(n===ans){ locked=true; c.classList.add('right'); good(c); stopVoice(); res(c); return; }
      c.classList.add('wrong'); bad(c);
      if(onWrong){ locked=true; try{ await onWrong(n); } finally{ locked=false; } }
    });
  });
}
/* what went wrong, said after the tap */
const p2Wrong = (a, n) => sayOne(n===a+1 ? '한 번만 뛰었네! 한 번 더!' : n<=a ? '아직 안 뛰었어요!' : '너무 멀리 뛰었어요! 두 번만!');

/* number-line pictures: all numbers / only the start / three stones / none (shadow kangaroo) */
function p2Vis(a, mode){
  if(mode==='none') return `<div class="hopbox"><span class="shadowroo" id="shroo"><span class="flip">🦘</span></span></div>`;
  const ns = mode==='three' ? [a, a+1, a+2] : Array.from({length:8}, (_,k)=>Math.max(0, a-2)+k);
  return `<div class="pond ${mode==='three'?'p3':''}"><div class="stones">${ns.map(n=>`
    <div class="stone" data-n="${n}"><span class="sn">${mode==='all'||n===a ? n : ''}</span>${n===a?ROO:''}</div>`).join('')}</div></div>`;
}
function shadowHop(){
  const s=$('#shroo'); if(!s) return;
  s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
  setTimeout(()=>tone([[640,.1]]), 650); setTimeout(()=>tone([[760,.1]]), 1400);
}
/* kangaroo hops two stones; reveal=true lights up hidden numbers and says them */
async function hopRoo(a, reveal=true){
  const roo=$('#roo'); if(!roo) return;
  for(let k=1;k<=2;k++){
    await wait(220);
    const st = stage.querySelector(`.stone[data-n="${a+k}"]`); if(!st) return;
    st.appendChild(roo); tone([[523+k*120,.12]]);
    if(reveal){ const sn=st.querySelector('.sn'); if(!sn.textContent){ sn.textContent=a+k; st.classList.add('lit'); } await sayOne(numKo(a+k)); }
    else await wait(380);
  }
  if(reveal) stage.querySelector(`.stone[data-n="${a+2}"]`).classList.add('on');
}
const MERGE = '한 번 더하고, 또 한 번 더하면, 더하기 이!';
const sentence = a => [numKo(a), opClip('+',2,false), numKo(a+2)];

/* 1. +1 두 번 = +2 — rounds 1-4: solve a+1, carry it down, solve +1 again, the two rows merge into a+2.
      rounds 5-8: a+2 directly; after a wrong tap the +1 steps appear as help */
function p2Chain(){
  const as = p2Seq(rep(8,[0,8])); let i=0;
  const next = ()=>{ i++; i<as.length ? show() : p2Done('chain'); };
  const row = (x,b,r,id,cls='') => `<div class="eq sm ${cls}" id="${id}">${x}<span class="op">+</span>${b}<span class="op">=</span>${r}</div>`;
  const q = id => `<span class="q" id="${id}">?</span>`;
  function show(){
    const a = as[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${as.length}</div>
      ${chefRow('🦘', i<4 ? '더하기 일을 두 번 해 봐요!' : '더하면 얼마일까요?')}
      <div class="p2rows" id="rows"></div>
      <div id="ask" class="ask"></div>`;
    (i<4 ? guided : direct)(a);
  }
  async function merge(a){
    $('#rows').querySelectorAll('.eq').forEach(e=>e.classList.add('dim'));
    $('#rows').insertAdjacentHTML('beforeend', `<div class="p2note">+1 +1 = +2</div>${row(a,2,a+2,'r3','p2big')}`);
    fanfare(); await sayAll(MERGE, ...sentence(a)); await wait(500);
  }
  async function guided(a){
    const ask=$('#ask');
    $('#rows').innerHTML = row(a,1,q('q1'),'r1') + row(q('s2'),1,q('q2'),'r2','dim');
    const v1 = ()=>sayAll('더하기 일을 두 번 해 봐요!', numKo(a), opClip('+',1,true)); v1(); $('#again').onclick=v1;
    await p2Ask(ask, a+1, numOpts(a+1,0,100));
    fillQ(a+1,'q1'); ask.innerHTML=''; await sayAll(numKo(a), opClip('+',1,false), numKo(a+1));
    await wait(200); fillQ(a+1,'s2'); $('#s2').classList.add('popin'); $('#r2').classList.remove('dim'); tick(); await wait(400);
    const v2 = ()=>sayAll(numKo(a+1), opClip('+',1,true)); v2(); $('#again').onclick=v2;
    await p2Ask(ask, a+2, numOpts(a+2,0,100));
    fillQ(a+2,'q2'); ask.innerHTML=''; await sayAll(numKo(a+1), opClip('+',1,false), numKo(a+2));
    await merge(a); next();
  }
  async function direct(a){
    const rows=$('#rows'), ask=$('#ask');
    rows.innerHTML = row(a,2,q('qv'),'r0','p2big');
    const v = ()=>sayAll(numKo(a), opClip('+',2,true)); v(); $('#again').onclick=v;
    let helped=false;
    await p2Ask(ask, a+2, p2Opts(a), async n=>{
      await p2Wrong(a,n);
      if(!helped){ helped=true; rows.insertAdjacentHTML('beforeend', `<div class="p2note">+1 하고, 또 +1</div>${row(a,1,a+1,'h1','popin')}${row(a+1,1,'?','h2','popin')}`); }
    });
    fillQ(a+2); ask.innerHTML='';
    if(helped) $('#h2').lastChild.textContent = a+2;
    else rows.insertAdjacentHTML('beforeend', `<div class="p2note">+1 +1 = +2</div>${row(a,1,a+1,'h1','dim popin')}${row(a+1,1,a+2,'h2','dim popin')}`);
    await sayAll(MERGE, ...sentence(a)); await wait(500); next();
  }
  show();
}

/* 2. 사라지는 징검다리 — rounds 1-2 all numbers, 3-4 only the start stone, 5-6 three stones, 7-8 no stones (shadow hop).
      a wrong answer re-shows the same question one help level up; after the right answer the hidden numbers light up */
function p2Fade(){
  const as = p2Seq(rep(8,[0,8])), M = ['all','all','start','start','three','three','none','none'], ORDER = ['all','start','three','none'];
  let i=0;
  const next = ()=>{ i++; i<as.length ? show(M[i]) : p2Done('fade'); };
  function show(mode, retry=false){
    const a = as[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${as.length}${retry?' · 🔁 돌을 더 보여 줄게요':''}</div>
      ${chefRow('🦘','깡총이가 어디에 도착할까요?')}
      <div id="vis" class="p2vis">${p2Vis(a, mode)}</div>
      ${eqHtml(a,'+',2,Q)}
      <div id="ask" class="ask"></div>`;
    const v = ()=>{ if(mode==='none') shadowHop(); return retry ? sayAll(numKo(a), opClip('+',2,true)) : sayAll('깡총이가 어디에 도착할까요?', numKo(a), opClip('+',2,true)); };
    v(); $('#again').onclick=v; retry=false;
    p2Ask($('#ask'), a+2, p2Opts(a), async n=>{
      await p2Wrong(a,n);
      const k = ORDER.indexOf(mode); if(k>0) show(ORDER[k-1], true);
    }).then(async ()=>{
      fillQ(a+2);
      if(mode==='none') $('#vis').innerHTML = p2Vis(a,'three');
      await hopRoo(a, true); await sayAll(...sentence(a)); await wait(400); next();
    });
  }
  show(M[0]);
}

/* 3. 입으로 깡총 — kangaroo says the start number; the child taps two footprints saying the next two numbers out loud (mom listens) */
function p2Voice(){
  const as = p2Seq([...rep(6,[0,8]), ...rep(2,[10,17])]); let i=0;
  const next = ()=>{ i++; i<as.length ? show() : p2Done('voice'); };
  function show(){
    const a = as[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${as.length}</div>
      ${chefRow('🦘','발자국을 누르면서 소리 내어 세어 봐요!')}
      ${eqHtml(a,'+',2,Q)}
      <div class="row feet">
        <div class="foot start"><span class="flip">🦘</span><span class="fn">${a}</span></div>
        <button class="foot" data-k="1" aria-label="첫 번째 깡총">👣<span class="fn"></span></button>
        <button class="foot" data-k="2" aria-label="두 번째 깡총">👣<span class="fn"></span></button>
      </div>
      <div id="ask" class="ask"></div>
      ${i===0?'<div class="guide">엄마 가이드: 깡총이가 출발 숫자를 말하면, 발자국을 하나 누를 때마다 다음 수를 소리 내어 말하게 해 주세요. (육 → "칠!" "팔!")</div>':''}`;
    const v = ()=>sayAll('발자국을 누르면서 소리 내어 세어 봐요!', numKo(a)); v(); $('#again').onclick=v;
    const feet = [...stage.querySelectorAll('button.foot')]; let step=0;
    feet.forEach(f=>f.onclick=()=>{
      const k = +f.dataset.k;
      if(k!==step+1){ if(k>step+1) bad(f); return; }
      step=k; f.classList.add('on'); tone([[523+k*120,.12]]);
      if(step===2) setTimeout(ask, 450);
    });
    async function ask(){
      await p2Ask($('#ask'), a+2, p2Opts(a), n=>p2Wrong(a,n));
      fillQ(a+2); $('#ask').innerHTML='';
      await sayOne(numKo(a));
      for(let k=1;k<=2;k++){ const fn=feet[k-1].querySelector('.fn'); fn.textContent=a+k; fn.parentElement.classList.add('popin'); await wait(150); await sayOne(numKo(a+k)); }
      await wait(250); await sayAll(...sentence(a)); await wait(400); next();
    }
  }
  show();
}

/* 4. +2 마법 기계 — equation only (sums to 10, then to 20); a wrong answer flashes three blank stones and a hop, then try again */
function p2Machine(){
  const as = p2Seq([...rep(4,[0,8]), ...rep(4,[9,18])]); let i=0;
  const next = ()=>{ i++; i<as.length ? show() : p2Done('machine'); };
  function show(){
    const a = as[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${as.length}</div>
      ${chefRow('🦘','마법 기계에 넣으면 무엇이 나올까요?')}
      <div class="mach"><div class="mnum2">${a}</div><span class="arrow">➜</span><div class="mbox" id="mbox">✨ +2</div><span class="arrow">➜</span><div class="mnum2" id="mout">?</div></div>
      ${eqHtml(a,'+',2,Q)}
      <div id="peek" class="p2vis"></div>
      <div id="ask" class="ask"></div>`;
    const buzz = ()=>{ const m=$('#mbox'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); tone([[440,.08],[660,.08],[880,.12]]); };
    const v = ()=>{ buzz(); return sayAll(i===0?'마법 기계에 넣으면 무엇이 나올까요?':numKo(a), ...(i===0?[numKo(a)]:[]), opClip('+',2,true)); };
    v(); $('#again').onclick=v;
    p2Ask($('#ask'), a+2, p2Opts(a), async n=>{
      $('#peek').innerHTML = p2Vis(a,'three');
      await Promise.all([p2Wrong(a,n), hopRoo(a,false)]);
      await wait(700); $('#peek').innerHTML='';
    }).then(async ()=>{
      $('#peek').innerHTML=''; fillQ(a+2); const o=$('#mout'); o.textContent=a+2; o.classList.add('got'); buzz();
      await sayAll(...sentence(a)); await wait(400); next();
    });
  }
  show();
}

/* 5. 번개 +2 — 10 quick questions (start 0-18), 5-second bar; slow or wrong ones listed at the end */
function p2Flash(){
  const as = p2Seq(rep(10,[0,18])); let i=0, fast=0; const miss=new Set();
  function show(){
    const a = as[i], t0 = performance.now(); let wrong=false;
    stage.innerHTML = `
      <div class="progress">⚡ ${i+1} / ${as.length}</div>
      <div class="fbar"><i style="animation-duration:5s"></i></div>
      ${eqHtml(a,'+',2,Q)}
      <div id="ask" class="ask"></div>`;
    if(i===0) sayOne('번개처럼 풀어 봐요!');
    p2Ask($('#ask'), a+2, p2Opts(a), async ()=>{ wrong=true; miss.add(a); }).then(async ()=>{
      fillQ(a+2);
      if(!wrong && performance.now()-t0 <= 5000) fast++; else miss.add(a);
      await sayAll(...sentence(a)); await wait(200); i++; i<as.length ? show() : end();
    });
  }
  function end(){
    const M=[...miss];
    stage.innerHTML = `
      <div class="reward"><div class="medal" aria-hidden="true">⚡</div><h2>번개 ${fast} / ${as.length}!</h2>
        <p class="guide">${M.length ? '느렸거나 틀린 문제예요. 눌러서 한 번 더 들어요.' : '모두 번개처럼 풀었어요!'}</p></div>
      ${M.length ? `<div class="row">${M.map(a=>`<button class="p2chip" data-a="${a}">${a} + 2 = ${a+2}</button>`).join('')}</div>` : ''}
      <div class="row"><button class="big go" id="fin">끝! 🎉</button></div>`;
    stage.querySelectorAll('.p2chip').forEach(b=>b.onclick=()=>sayAll(...sentence(+b.dataset.a)));
    $('#fin').onclick = ()=>p2Done('flash');
  }
  show();
}

const P2GAME = {chain:p2Chain, fade:p2Fade, voice:p2Voice, machine:p2Machine, flash:p2Flash};
MT.splice(MT.findIndex(g=>g.id==='plus')+1, 0, {id:'plus2', t:'더하기 2 특훈', k:'깡총이랑 머릿속 징검다리', e:'🦘'});
MGAME.plus2 = p2Home;
