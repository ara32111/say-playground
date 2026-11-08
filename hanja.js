/* ===== 한자 놀이터 (uses helpers from the main page and hangul.js: good, bad, koPraise) ===== */
const HJ = window.HJDATA || {levels:[]};
const hjUnits = () => HJ.levels.flatMap(l=>l.units);
const hjUnit = id => hjUnits().find(u=>u.id===id);
const HGS = [
  {id:'learn',  t:'새 한자 카드',    k:'그림이 한자로 변신!',          e:'📖'},
  {id:'memory', t:'짝꿍 찾기',      k:'그림과 한자 짝 맞추기',        e:'🃏'},
  {id:'listen', t:'소리 듣고 고르기', k:'"날 일" 듣고 한자 찾기',       e:'👂'},
  {id:'hunum',  t:'훈음 고르기',     k:'한자 보고 뜻과 소리 고르기',    e:'🔤'},
  {id:'trace',  t:'따라 쓰기',      k:'손가락으로 한자 따라 쓰기',     e:'✏️'},
  {id:'word',   t:'낱말 속 한자',    k:'화요일의 "화"는 어떤 한자?',    e:'🔍'}
];
const HGS2 = [
  {id:'ecard',  t:'음 카드',     k:'한자를 보고 음을 크게!',          e:'📜'},
  {id:'eum',    t:'음 맞히기',    k:'한자 보고 소리 고르기',           e:'🔤'},
  {id:'hunt',   t:'소리 듣고 찾기', k:'"현" 소리 듣고 한자 고르기',      e:'👂'},
  {id:'friend', t:'진짜 친구',    k:'같은 소리, 다른 한자 구별',        e:'🕵️'},
  {id:'verse',  t:'구절 읽기',    k:'천지현황 순서대로 읽기',           e:'🎋'},
  {id:'flash',  t:'번개 읽기',    k:'배운 한자 빨리 읽기',             e:'⚡'}
];
const hjLevelOf = u => HJ.levels.find(l=>l.units.includes(u));
const hjGames = u => hjLevelOf(u).id==='L2' ? HGS2 : HGS;
const hjDone = (u,g) => !!hjState().done[u.id+':'+g];
const hjCount = u => hjGames(u).filter(g=>hjDone(u,g.id)).length;
function hjCollect(ch){ hjState().chars[ch.c] = true; save(); }
const hjChar = (c, cls='') => `<span class="hjc ${cls}">${esc(c)}</span>`;

/* ---------- screens ---------- */
function hjHome(){
  curLang = 'hj'; updateBar();
  nav('한자 놀이터', landing);
  const hs = hjState();
  stage.innerHTML = `
    <div class="hero"><h1>한자 놀이터</h1><p>레벨을 골라요</p></div>
    <div class="grid2">
      ${HJ.levels.map(l=>{
        const n = l.units.reduce((a,u)=>a+u.chars.length,0), got = l.units.reduce((a,u)=>a+u.chars.filter(c=>hs.chars[c.c]).length,0);
        return l.soon ? `
        <button class="weekbtn soon" disabled><span class="wem" aria-hidden="true">${l.e}</span>
          <span style="min-width:0"><span class="lbl-s">${esc(l.t)}</span><span class="t">${esc(l.sub)}</span><span class="k">준비 중이에요</span></span></button>` : `
        <button class="weekbtn" data-l="${l.id}"><span class="wem" aria-hidden="true">${l.e}</span>
          <span style="min-width:0"><span class="lbl-s">${esc(l.t)}</span><span class="t">${esc(l.sub)}</span><span class="k">한자 ${n}자</span></span>
          <span class="meter"><b>字</b>${got}/${n}</span></button>`;}).join('')}
      <button class="weekbtn review" id="hjDogamBtn"><span class="wem" aria-hidden="true">📚</span>
        <span style="min-width:0"><span class="t">한자 도감</span><span class="k">모은 한자 카드 보기</span></span></button>
    </div>`;
  stage.querySelectorAll('.weekbtn[data-l]').forEach(b=>b.onclick=()=>hjLevel(b.dataset.l));
  $('#hjDogamBtn').onclick = hjDogam;
}

function hjLevel(id){
  const l = HJ.levels.find(x=>x.id===id), hs = hjState();
  curLang = 'hj'; updateBar();
  nav(`한자 ${l.t}`, hjHome);
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">${l.e}</div><h1>${esc(l.sub)}</h1><p>단원을 골라요</p></div>
    <div class="grid2">
      ${l.units.map((u,i)=>`
        <button class="weekbtn" data-u="${u.id}">
          <span class="wem" aria-hidden="true">${u.e}</span>
          <span style="min-width:0"><span class="lbl-s">${i+1}단원</span><span class="t">${esc(u.t)}</span><span class="hjrow">${u.vs ? u.vs.map(v=>v.c).join(' ') : u.chars.map(c=>c.c).join(' ')}</span></span>
          <span class="meter">${hs.trophies[u.id]?'🏆':'<b>⭐</b>'}${hjCount(u)}/${hjGames(u).length}</span>
        </button>`).join('')}
    </div>`;
  stage.querySelectorAll('.weekbtn[data-u]').forEach(b=>b.onclick=()=>hjMenu(b.dataset.u));
}

async function hjMenu(id){
  const u = hjUnit(id), title = u.t, G = hjGames(u);
  curLang = 'hj'; updateBar();
  nav(title, ()=>hjLevel(hjLevelOf(u).id));
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio(id), loadAudio('hj-shared')]);
  if($('#barName').textContent !== title) return;
  stage.innerHTML = `
    <div class="hero"><div class="hjrow hjbig" aria-hidden="true">${u.vs ? u.vs.map(v=>v.c).join(' ') : u.chars.map(c=>c.c).join(' ')}</div><h1>${esc(u.t)}</h1><p>${u.vs ? esc(u.vs.map(v=>v.r).join(' · ')) : '하고 싶은 놀이를 골라요'}</p></div>
    <div class="grid2">
      ${G.map(g=>`
        <button class="stagebtn ${hjDone(u,g.id)?'done':''}" data-g="${g.id}">
          <span class="num">${g.e}</span>
          <span style="min-width:0"><span class="t">${g.t}</span><span class="k">${g.k}</span></span>
          <span class="stk" aria-hidden="true">${hjDone(u,g.id)?'⭐':''}</span>
        </button>`).join('')}
    </div>
    <div class="guide">${u.vs ? '가이드: 음 카드 → 음 맞히기 → 소리 듣고 찾기 순서로 하면 좋아요.' : '엄마 가이드: 1번 새 한자 카드부터 하면 좋아요.'}</div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>HGAME[b.dataset.g](u));
}
function hjNav(u, gid){ const g=hjGames(u).find(x=>x.id===gid); nav(`${u.t} · ${g.t}`, ()=>hjMenu(u.id)); }

function hjReward(u, gid){
  const hs = hjState(), HGS = hjGames(u); hs.done[u.id+':'+gid] = true;
  const all = HGS.every(g=>hs.done[u.id+':'+g.id]); const newTrophy = all && !hs.trophies[u.id];
  if(all) hs.trophies[u.id] = true;
  save();
  const i = HGS.findIndex(g=>g.id===gid), ch = shuffle(u.chars)[0];
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':`<span class="hjc">${ch.c}</span>`}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${newTrophy?`"${esc(u.t)}" 놀이를 모두 끝내서 트로피를 받았어요!`:`한자 스티커 ${ch.c} 를 받았어요! (${HGS[i].t})`}</p></div>
    <div class="row"><button class="big alt" id="toMenu">⬅️ ${esc(u.t)}</button>${i<HGS.length-1?`<button class="big go" id="nextG">다음: ${HGS[i+1].t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨'+ch.e);
  (async()=>{ const my=++speakToken; await koPraise(); if(my!==speakToken) return; await wait(200); say(newTrophy?'트로피를 받았어요!':'스티커를 받았어요!'); })();
  $('#toMenu').onclick = ()=>hjMenu(u.id);
  if(i<HGS.length-1) $('#nextG').onclick = ()=>HGAME[HGS[i+1].id](u);
}
/* n rounds that cycle through the unit's characters in random order */
function hjRounds(u, n){ let out=[]; while(out.length<n) out = out.concat(shuffle(u.chars)); return out.slice(0,n); }

/* 1. 새 한자 카드 — the picture turns into the character */
function hjLearn(u){
  hjNav(u,'learn'); const list = u.chars; let i=0;
  function show(){
    const ch = list[i]; hjCollect(ch);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${list.length}</div>
      <button class="morphbox" id="mb" aria-label="다시 보기"><span class="mpic" aria-hidden="true">${ch.e}</span><span class="hjc mchar">${ch.c}</span></button>
      <div class="hunum">${esc(ch.h)}</div>
      <div class="bubble wrap ko-s">${esc(ch.m)}</div>
      <div class="row"><button class="big alt" id="again">🔊 다시 듣기</button><button class="big go" id="next">${i<list.length-1?'다음 ➜':'끝! 🎉'}</button></div>`;
    const mb = $('#mb');
    const morph = ()=>{ mb.classList.remove('to'); void mb.offsetWidth; setTimeout(()=>mb.classList.add('to'), 900); };
    const play = ()=>sayAll(ch.h, ch.m);
    morph(); play();
    mb.onclick = ()=>{ morph(); sayOne(ch.h); };
    $('#again').onclick = play;
    $('#next').onclick = ()=>{ addStar(); i++; i<list.length ? show() : hjReward(u,'learn'); };
  }
  show();
}

/* 2. 짝꿍 찾기 — picture ↔ character; 2 rounds × 3 pairs; sound only after a match */
function hjMemory(u){
  hjNav(u,'memory');
  const all = hjRounds(u, 6), R = 2, per = 3; let round = 0;
  function show(){
    const chars = all.slice(round*per, round*per+per);
    const cards = shuffle(chars.flatMap((ch,n)=>[{n,ch,type:'pic'},{n,ch,type:'char'}]));
    let first=null, lock=false, matched=0;
    stage.innerHTML = `
      <div class="progress">라운드 ${round+1} / ${R} · 그림과 한자 짝을 찾아요!</div>
      <div class="mgrid three">${cards.map((c,k)=>`
        <button class="mcard" data-k="${k}" aria-label="card">
          <span class="back" aria-hidden="true">🐻</span>
          <span class="front">${c.type==='pic' ? `<span class="em">${c.ch.e}</span>` : `<span class="hjc mhj">${c.ch.c}</span>`}</span>
        </button>`).join('')}</div>`;
    stage.querySelectorAll('.mcard').forEach(el=>el.onclick=async ()=>{
      const c = cards[+el.dataset.k];
      if(lock || el.classList.contains('open')) return;
      el.classList.add('open');
      if(!first){ first={c,el}; return; }
      const a = first; first = null;
      if(a.c.n===c.n && a.c.type!==c.type){
        a.el.classList.add('matched'); el.classList.add('matched'); good(el); hjCollect(c.ch); matched++;
        lock = true; await say(c.ch.h); lock = false;
        if(matched===chars.length){
          await wait(500); round++;
          if(round<R){ fanfare(); burst(innerWidth/2, innerHeight/2); stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🃏</div><h2>라운드 ${round} 성공!</h2></div><div class="row"><button class="big go" id="nextR">라운드 ${round+1} ➜</button></div>`; $('#nextR').onclick = show; }
          else hjReward(u,'memory');
        }
      }else{ lock = true; await wait(900); a.el.classList.remove('open'); el.classList.remove('open'); lock = false; }
    });
  }
  show();
}

/* 3. 소리 듣고 고르기 — hear "날 일", tap the character (characters only, no pictures) */
function hjListen(u){
  hjNav(u,'listen'); const rounds = hjRounds(u, 6); let i=0;
  function show(){
    const ch = rounds[i]; let locked=false;
    const opts = shuffle([ch, ...shuffle(u.chars.filter(x=>x!==ch)).slice(0,3)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble ko-s">어떤 한자일까요?</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="cards hjcards">${opts.map(o=>`<button class="card" data-c="${o.c}"><span class="hjc cardhj">${o.c}</span></button>`).join('')}</div>
      <div class="hint ko-s" id="hint"></div>`;
    const play = ()=>sayAll(ch.h);
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c===ch.c){
        locked=true; c.classList.add('right'); good(c); hjCollect(ch); $('#hint').textContent = `${ch.e} ${ch.h}`;
        await say(ch.h); await wait(500); i++; i<rounds.length ? show() : hjReward(u,'listen');
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

/* 4. 훈음 고르기 — see the character, choose its 훈음 card; sound only after answering */
function hjHunum(u){
  hjNav(u,'hunum'); const rounds = hjRounds(u, 6); let i=0;
  function show(){
    const ch = rounds[i]; let locked=false;
    const opts = shuffle([ch, ...shuffle(u.chars.filter(x=>x!==ch)).slice(0,2)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="wordcard"><span class="hjc mainhj">${ch.c}</span></div>
      <div class="cards three">${opts.map(o=>`<button class="card wordonly" data-c="${o.c}"><span class="tw ko-w">${esc(o.h)}</span></button>`).join('')}</div>`;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c===ch.c){
        locked=true; c.classList.add('right'); good(c); hjCollect(ch);
        await say(ch.h); await wait(500); i++; i<rounds.length ? show() : hjReward(u,'hunum');
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

/* 5. 따라 쓰기 — trace one grey character; coverage check like 한글 (no stroke order) */
function hjTrace(u){
  hjNav(u,'trace'); const rounds = shuffle(u.chars); let i=0, color='#E4407A';
  async function show(){
    const ch = rounds[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="row"><span class="pic md"><span class="em" aria-hidden="true">${ch.e}</span></span><span class="hunum sm">${esc(ch.h)}</span></div>
      <div class="tracebox hj" id="tb"><canvas id="cg"></canvas><canvas id="cu"></canvas></div>
      <div class="row">
        ${['#E4407A','#2F74E0','#2FA866','#F29D1F'].map(c=>`<button class="pen ${c===color?'on':''}" data-c="${c}" style="--pc:${c}" aria-label="pen color"></button>`).join('')}
      </div>
      <div class="row tracebtns">
        <button class="big alt" id="undo">↩️ 한 획 지우기</button><button class="big alt" id="clr">🧽 다 지우기</button><button class="big go" id="done">다 썼어요!</button>
      </div>
      <div class="hint ko-s" id="hint"></div>`;
    sayOne(ch.h);
    const tb=$('#tb'), cg=$('#cg'), cu=$('#cu'), dpr=Math.max(1, window.devicePixelRatio||1);
    const W=tb.clientWidth, H=tb.clientHeight;
    [cg,cu].forEach(c=>{ c.width=W*dpr; c.height=H*dpr; c.getContext('2d').scale(dpr,dpr); });
    const fs=Math.min(H*0.84, W*0.9);
    const font = `700 ${fs}px "Noto Serif KR", serif`;
    try{ await document.fonts.load(font, ch.c); }catch(e){}
    const cx=W/2, cy=H/2;
    const g = cg.getContext('2d');   /* 田-shaped guide lines, like a 한자 practice notebook */
    g.save(); g.strokeStyle='rgba(90,101,144,.18)'; g.lineWidth=2; g.setLineDash([8,8]);
    const half = fs*0.52;
    g.strokeRect(cx-half, cy-half, half*2, half*2);
    g.beginPath(); g.moveTo(cx-half,cy); g.lineTo(cx+half,cy); g.moveTo(cx,cy-half); g.lineTo(cx,cy+half); g.stroke(); g.restore();
    const drawGuide = (ctx, col)=>{ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=fs*0.07; ctx.lineJoin='round'; ctx.strokeText(ch.c,cx,cy+fs*0.02); ctx.fillText(ch.c,cx,cy+fs*0.02); };
    drawGuide(g, '#DCE2EC');
    const mask = document.createElement('canvas'); mask.width=cg.width; mask.height=cg.height;
    const mctx = mask.getContext('2d'); mctx.scale(dpr,dpr); drawGuide(mctx,'#000');
    const ux = cu.getContext('2d'); let drawing=false, last=null;
    const pt = e=>{ const r=cu.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
    const lw = Math.max(14, fs*0.085);
    const hist=[]; cu.onpointerdown = e=>{ hist.push(ux.getImageData(0,0,cu.width,cu.height)); if(hist.length>40) hist.shift(); drawing=true; last=pt(e); cu.setPointerCapture(e.pointerId); ux.fillStyle=color; ux.beginPath(); ux.arc(last[0],last[1],lw/2,0,Math.PI*2); ux.fill(); };
    cu.onpointermove = e=>{ if(!drawing) return; const p=pt(e); ux.strokeStyle=color; ux.lineWidth=lw; ux.lineCap='round'; ux.lineJoin='round'; ux.beginPath(); ux.moveTo(last[0],last[1]); ux.lineTo(p[0],p[1]); ux.stroke(); last=p; };
    cu.onpointerup = cu.onpointercancel = ()=>{ drawing=false; };
    stage.querySelectorAll('.pen').forEach(p=>p.onclick=()=>{ color=p.dataset.c; stage.querySelectorAll('.pen').forEach(q=>q.classList.toggle('on', q===p)); });
    $('#clr').onclick = ()=>{ hist.push(ux.getImageData(0,0,cu.width,cu.height)); ux.clearRect(0,0,W,H); $('#hint').textContent=''; };
    $('#undo').onclick = ()=>{ if(!hist.length){ boop(); return; } ux.putImageData(hist.pop(),0,0); $('#hint').textContent=''; };
    $('#done').onclick = async ()=>{
      const gd = mctx.getImageData(0,0,mask.width,mask.height).data, ud = ux.getImageData(0,0,cu.width,cu.height).data;
      let gp=0, cov=0, up=0, out=0; const st=3*Math.round(dpr);
      for(let y=0; y<mask.height; y+=st){ for(let x=0; x<mask.width; x+=st){ const k=(y*mask.width+x)*4+3; const gi=gd[k]>40, ui=ud[k]>40; if(gi){gp++; if(ui) cov++;} if(ui){up++; if(!gi) out++;} } }
      const c = gp ? cov/gp : 0, o = up ? out/up : 1;
      if(c>=0.55 && o<=0.6){
        good($('#tb')); hjCollect(ch); await say(ch.h); await wait(500);
        i++; i<rounds.length ? show() : hjReward(u,'trace');
      }else{ bad($('#tb')); $('#hint').textContent='회색 글자 위를 꼼꼼히 따라 써 볼까?'; say('조금 더 따라 써 볼까?'); }
    };
  }
  show();
}

/* 6. 낱말 속 한자 — 화요일: which character is the marked 화? */
function hjWord(u){
  hjNav(u,'word');
  const pool = shuffle(u.chars.flatMap(ch=>ch.wd.map(([w,k,e])=>({ch,w,k,e}))));
  const rounds = []; u.chars.forEach(ch=>rounds.push(pool.find(p=>p.ch===ch)));   /* one word per character */
  const extra = pool.filter(p=>!rounds.includes(p)); rounds.push(extra[0]);
  const R = shuffle(rounds); let i=0;
  function show(){
    const r = R[i]; let locked=false;
    const syl = [...r.w];
    const opts = shuffle([r.ch, ...shuffle(u.chars.filter(x=>x!==r.ch)).slice(0,2)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${R.length}</div>
      <div class="row"><span class="pic md"><span class="em" aria-hidden="true">${r.e}</span></span><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="sylrow">${syl.map((s,k)=>s===' '?'':`<span class="syl ${k===r.k?'hjmark':''}" ${k===r.k?'id="mk"':''}>${esc(s)}</span>`).join('')}</div>
      <div class="bubble wrap ko-s">빨간 네모 <b>"${esc(syl[r.k])}"</b>는 어떤 한자일까요?</div>
      <div class="cards three">${opts.map(o=>`<button class="card" data-c="${o.c}"><span class="hjc cardhj">${o.c}</span></button>`).join('')}</div>
      <div class="hint ko-s" id="hint"></div>`;
    const play = ()=>sayOne(r.w);
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c===r.ch.c){
        locked=true; c.classList.add('right'); good(c); hjCollect(r.ch);
        const mk=$('#mk'); mk.textContent=r.ch.c; mk.classList.add('got','hjc');
        $('#hint').textContent = `${r.w} 의 "${syl[r.k]}" = ${r.ch.c} (${r.ch.h})`;
        await say(r.ch.h); await wait(250); await say(r.w); await wait(600);
        i++; i<R.length ? show() : hjReward(u,'word');
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

const HGAME = {learn:hjLearn, memory:hjMemory, listen:hjListen, hunum:hjHunum, trace:hjTrace, word:hjWord};
/* Level 2 (천자문) games live in hanja2.js and register themselves into HGAME */

/* 한자 도감 — every character collected so far; tap to hear */
function hjDogam(){
  curLang='hj'; updateBar();
  nav('한자 도감', hjHome);
  const hs = hjState();
  stage.innerHTML = `
    <div class="hero"><h1>한자 도감 📚</h1><p>놀이에서 만난 한자가 여기에 모여요 · ${Object.keys(hs.chars).length}자</p></div>
    ${HJ.levels.filter(l=>!l.soon).map(l=>l.units.map(u=>`
      <div class="dg-sec"><div class="dg-t">${u.e} ${esc(u.t)}</div>
        <div class="dgrid hjgrid">${u.chars.map(ch=> hs.chars[ch.c]
          ? `<button class="dcard" data-u="${u.id}" data-c="${ch.c}"><span class="hjc dhj">${ch.c}</span><span class="mw xs">${esc(ch.h)}</span></button>`
          : `<div class="dcard locked" aria-label="아직 못 만난 한자"><span class="em">❔</span></div>`).join('')}</div></div>`).join('')).join('')}`;
  stage.querySelectorAll('.dcard[data-c]').forEach(b=>b.onclick=async ()=>{
    const u = hjUnit(b.dataset.u), ch = u.chars.find(x=>x.c===b.dataset.c);
    await loadAudio(u.id); sayAll(ch.h, ch.m);
  });
}
