/* ===== 한자 놀이터 Level 3 · 사자성어 — light check: read the example, pick the idiom (한자 + 한글) ===== */
const hjL3 = () => HJ.levels.find(l=>l.id==='L3');
const SY_HINT = true;   /* 보기 카드의 한글 읽기는 숨기고 💡 힌트로 1초만 보여 줘요 */
const hjSyAll = () => hjL3().units.flatMap(u=>u.sy);
function hjSyState(){ const hs = hjState(); hs.sy = hs.sy || {}; hs.syDone = hs.syDone || {}; return hs; }
/* characters met in Level 1 and 2 count as "아는 글자" */
const hjKnown = () => new Set(HJ.levels.filter(l=>l.id!=='L3').flatMap(l=>l.units.flatMap(u=>u.chars.map(c=>c.c))));

function hjSyLevelBtn(l){
  const n = hjSyAll().length, got = hjSyAll().filter(y=>hjSyState().sy[y.c]).length;
  return `
    <button class="weekbtn" data-l="${l.id}"><span class="wem" aria-hidden="true">${l.e}</span>
      <span style="min-width:0"><span class="lbl-s">${esc(l.t)}</span><span class="t">${esc(l.sub)}</span><span class="k">예문 보고 고르기 · ${n}개</span></span>
      <span class="meter"><b>🏯</b>${got}/${n}</span></button>`;
}

function hjSyLevel(){
  const l = hjL3(), hs = hjSyState();
  curLang = 'hj'; updateBar();
  nav(`한자 ${l.t}`, hjHome);
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">${l.e}</div><h1>사자성어</h1><p>예문을 읽고 맞는 성어를 골라요</p></div>
    <div class="grid2">
      ${l.units.map((u,i)=>`
        <button class="weekbtn" data-u="${u.id}">
          <span class="wem" aria-hidden="true">${u.e}</span>
          <span style="min-width:0"><span class="lbl-s">${i+1}단원</span><span class="t">${esc(u.t)}</span><span class="hjrow syrow">${u.sy.map(y=>y.c).join(' ')}</span></span>
          <span class="meter">${hs.syDone[u.id]?'🏆':'<b>🏯</b>'}${u.sy.filter(y=>hs.sy[y.c]).length}/${u.sy.length}</span>
        </button>`).join('')}
      <button class="weekbtn review" id="syDogamBtn"><span class="wem" aria-hidden="true">📚</span>
        <span style="min-width:0"><span class="t">사자성어 도감</span><span class="k">모은 성어 다시 보기</span></span></button>
    </div>`;
  stage.querySelectorAll('.weekbtn[data-u]').forEach(b=>b.onclick=()=>hjSyQuiz(hjUnit(b.dataset.u)));
  $('#syDogamBtn').onclick = hjSyDogam;
}

/* the 4 characters with their 훈음; characters already learned get a red frame */
function hjSyChars(y){
  const K = hjKnown();
  return `<div class="vrow">${[...y.c].map((c,j)=>`<div class="vcol"><span class="hjc vhj ${K.has(c)?'known':''}">${c}</span><span class="syhun">${esc(y.hs[j])}</span></div>`).join('')}</div>`;
}

async function hjSyQuiz(u){
  curLang = 'hj'; updateBar();
  nav(u.t, hjSyLevel);
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio(u.id), loadAudio('hj-shared')]);
  const Q = shuffle(u.sy), again = new Set(), hs = hjSyState(); let i=0;
  function show(){
    const y = Q[i]; let locked=false, missed=false;
    const opts = shuffle([y, ...shuffle(hjSyAll().filter(x=>x!==y)).slice(0,3)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${Q.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble wrap ko-s">${esc(y.x)}</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="guide">어떤 사자성어일까요?</div>
      ${SY_HINT ? `<button class="big alt" id="hintBtn">💡 힌트</button>` : ''}
      <div class="cards two">${opts.map(o=>`<button class="card sycard" data-c="${o.c}"><span class="hjc syhj">${o.c}</span><span class="syr" ${SY_HINT?'hidden':''}>${esc(o.r)}</span></button>`).join('')}</div>
      <div id="rv"></div>`;
    const play = ()=>sayAll(y.x, '어떤 사자성어일까요?');
    play(); $('#again').onclick = play;
    /* 한글 읽기는 💡 힌트로 1초만 보여요 */
    let hintT = 0; const rs = ()=>stage.querySelectorAll('.sycard .syr');
    if(SY_HINT) $('#hintBtn').onclick = ()=>{ const b=$('#hintBtn'); rs().forEach(r=>r.hidden=false); b.disabled=true; clearTimeout(hintT);
      hintT = setTimeout(()=>{ if(locked || !document.body.contains(b)) return; rs().forEach(r=>r.hidden=true); b.disabled=false; }, 1000); };
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c!==y.c){
        c.classList.add('wrong'); bad(c);
        if(!missed && !again.has(y.c)){ missed=true; again.add(y.c); Q.push(y); $('.progress').textContent = `${i+1} / ${Q.length} · 틀린 성어는 한 번 더 나와요`; }
        return;
      }
      locked=true; c.classList.add('right'); good(c); hs.sy[y.c] = true; addStar();
      if(SY_HINT){ clearTimeout(hintT); rs().forEach(r=>r.hidden=false); $('#hintBtn').disabled=true; }
      $('#rv').innerHTML = `<div class="reveal syrev">${hjSyChars(y)}<div class="syname">${esc(y.r)}</div><div class="symean ko-s">${esc(y.m)}</div>
        <div class="guide">빨간 테두리 = 배운 한자</div></div>
        <div class="row"><button class="big go" id="next">${i<Q.length-1?'다음 ➜':'끝! 🎉'}</button></div>`;
      $('#next').onclick = ()=>{ ++speakToken; i++; i<Q.length ? show() : done(); };
      $('#rv').scrollIntoView({behavior:'smooth', block:'nearest'});
      const my = ++speakToken; await say(y.r); if(my!==speakToken) return; await wait(250); await say(y.m);
    });
  }
  function done(){
    const newTrophy = !hs.syDone[u.id]; hs.syDone[u.id] = true; save();
    const l = hjL3(), k = l.units.indexOf(u), nx = l.units[k+1];
    stage.innerHTML = `
      <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':'🏯'}</div>
        <h2>잘했어요, <span id="rwName"></span>!</h2>
        <p class="guide">"${esc(u.t)}" 사자성어 ${u.sy.length}개를 모았어요!</p></div>
      <div class="row"><button class="big alt" id="toLv">⬅️ 사자성어</button>${nx?`<button class="big go" id="nextU">다음: ${esc(nx.t)} ➜</button>`:''}</div>`;
    $('#rwName').textContent = state.name;
    fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨🏯');
    (async()=>{ const my=++speakToken; await koPraise(); if(my!==speakToken) return; await wait(200); say(newTrophy?'트로피를 받았어요!':'스티커를 받았어요!'); })();
    $('#toLv').onclick = hjSyLevel;
    if(nx) $('#nextU').onclick = ()=>hjSyQuiz(nx);
  }
  show();
}

/* 사자성어 도감 — collected idioms; tap one to see its characters and hear it */
function hjSyDogam(){
  curLang='hj'; updateBar();
  nav('사자성어 도감', hjSyLevel);
  const hs = hjSyState(), all = hjSyAll();
  stage.innerHTML = `
    <div class="hero"><h1>사자성어 도감 📚</h1><p>모은 성어 ${all.filter(y=>hs.sy[y.c]).length} / ${all.length}</p></div>
    ${hjL3().units.map(u=>`
      <div class="dg-sec"><div class="dg-t">${u.e} ${esc(u.t)}</div>
        <div class="sygrid">${u.sy.map(y=> hs.sy[y.c]
          ? `<button class="card sycard" data-u="${u.id}" data-c="${y.c}"><span class="hjc syhj">${y.c}</span><span class="syr">${esc(y.r)}</span></button>`
          : `<div class="card sycard locked" aria-label="아직 못 만난 성어"><span class="em">❔</span></div>`).join('')}</div></div>`).join('')}
    <div id="rv"></div>`;
  stage.querySelectorAll('.sycard[data-c]').forEach(b=>b.onclick=async ()=>{
    const u = hjUnit(b.dataset.u), y = u.sy.find(x=>x.c===b.dataset.c);
    $('#rv').innerHTML = `<div class="reveal syrev">${hjSyChars(y)}<div class="syname">${esc(y.r)}</div><div class="symean ko-s">${esc(y.m)}</div><div class="guide">예: ${esc(y.x)}</div></div>`;
    $('#rv').scrollIntoView({behavior:'smooth', block:'nearest'});
    await loadAudio(u.id); sayAll(y.r, y.m);
  });
}
