/* ===== 한글 2단계 · 어휘 키우기 (uses helpers from the main page + hangul.js) ===== */
const K2 = window.KO2DATA || {units:[]};
const v2Unit = id => K2.units.find(u=>u.id===id);
function v2State(){ const ks = koState(); if(!ks.v2) ks.v2 = {done:{}, words:{}, trophies:{}, miss:{}}; return ks.v2; }
const today = () => { const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
const daysAgo = s => { const [y,m,d]=s.split('-').map(Number); return Math.round((new Date().setHours(0,0,0,0) - new Date(y,m-1,d).getTime())/864e5); };
function collect2(w){ const v=v2State(); if(!v.words[w.w]){ v.words[w.w]=today(); save(); } }

const SPEC = {
  touch: {t:'몸 짚기',      k:'낱말 읽고 내 몸에서 찾기',      e:'👆'},
  act:   {t:'몸으로 흉내',   k:'낱말 읽고 몸으로 해 보기',      e:'🤸'},
  fit:   {t:'딱 맞는 말',    k:'어울리는 움직임 말 고르기',     e:'🧩'},
  wear:  {t:'입고 쓰고 신고', k:'물건에 맞는 말 고르기',        e:'👕'},
  basket:{t:'바구니 정리',   k:'낱말을 바구니에 나눠 담기',     e:'🧺'},
  seesaw:{t:'반대말 시소',   k:'반대말 짝 찾기',              e:'⚖️'},
  feel:  {t:'어떤 느낌?',    k:'맛 · 느낌 · 온도 고르기',      e:'🌡️'},
  move:  {t:'어떻게 움직일까?',k:'움직임 보고 흉내말 고르기',   e:'🐾'},
  heart: {t:'마음 맞히기',   k:'이야기 듣고 마음 고르기',       e:'💗'},
  where: {t:'어디 숨었니?',  k:'고양이 자리 맞히기',           e:'🐱'},
  polite:{t:'할머니 버전',   k:'높임말로 바꾸기',              e:'🙇'},
  key:   {t:'한자 열쇠',     k:'한자가 들어간 낱말 찾기',       e:'🔑'}
};
const v2Games = u => [
  {id:'learn',    t:'새 낱말 카드', k:'그림 · 뜻 · 예문 알아보기', e:'📖'},
  {id:'spec',     ...SPEC[u.g]},
  {id:'sentence', t:'문장 빈칸',   k:'문장에 알맞은 낱말 고르기', e:'📝'},
  {id:'riddle',   t:'수수께끼',    k:'뜻 듣고 낱말 맞히기',      e:'❓'},
  {id:'read',     t:'내가 읽기',   k:'먼저 읽고, 소리로 확인하기', e:'🗣️'},
  {id:'talk',     t:'엄마랑 말하기', k:'배운 말로 이야기 나누기',  e:'💬'}
];
const v2Done = (u,g) => !!v2State().done[u.id+':'+g];
const v2Count = u => v2Games(u).filter(g=>v2Done(u,g.id)).length;
const v2Q = (u,w) => w.c==='사람' ? '누구일까요?' : w.c==='곳' ? '어느 곳일까요?' : ['v1','v3b','v4','v12'].includes(u.id) ? '무엇일까요?' : '어떤 말일까요?';

/* reading level: 1 = no 받침, 2 = 받침, 3 = long / double 받침 / tricky vowels */
function readLv(w){
  const s = [...w.replace(/\s/g,'')]; let lv = 1;
  for(const ch of s){ const d = dec(ch); if(!d) continue;
    if(d[2]) lv = Math.max(lv, [3,5,6,9,10,11,12,13,14,15,18].includes(d[2]) ? 3 : 2);
    if([10,11,14,15,16,19].includes(d[1])) lv = Math.max(lv, 3); }
  if(s.length>=5) lv = Math.max(lv,3);
  return lv;
}

/* decoys: explicit d first; otherwise same-unit words that can't also be right */
function okDecoy(w, x){
  if(x===w || x.w===w.w) return false;
  if((w.nx||[]).includes(x.w) || (x.nx||[]).includes(w.w)) return false;
  if(w.v && x.v && w.v===x.v) return false;
  if(w.k && x.k && w.k!==x.k) return false;
  if(w.pos && !x.pos && w.d===undefined) return false;
  return true;
}
function decoys(u, w, n=2, extra){
  if(w.d) return shuffle(w.d).slice(0,n).map(s=>u.words.find(x=>x.w===s)||{w:s,e:''});
  return shuffle(u.words.filter(x=>okDecoy(w,x) && (!extra || extra(x)))).slice(0,n);
}
const v2R = (u, n, filt) => koRounds({words:u.words}, n, filt);

/* ---------- screens ---------- */
function koHome(){
  curLang = 'ko'; updateBar();
  nav('한글 놀이터', landing);
  const ks = koState(), l1n = KO.themes.reduce((a,t)=>a+t.words.length,0), l1g = Object.keys(ks.words).length;
  const l2n = K2.units.reduce((a,u)=>a+u.words.length,0), l2g = Object.keys(v2State().words).length;
  stage.innerHTML = `
    <div class="hero"><h1>한글 놀이터</h1><p>단계를 골라요</p></div>
    <div class="grid2">
      <button class="weekbtn" id="goL1"><span class="wem" aria-hidden="true">🐾</span>
        <span style="min-width:0"><span class="lbl-s">1단계</span><span class="t">이름 말</span><span class="k">동물 · 과일 · 탈것 · 물건</span></span>
        <span class="meter"><b>📚</b>${l1g}/${l1n}</span></button>
      <button class="weekbtn" id="goL2"><span class="wem" aria-hidden="true">🌳</span>
        <span style="min-width:0"><span class="lbl-s">2단계</span><span class="t">어휘 키우기</span><span class="k">움직임 · 꾸미는 말 · 마음 · 높임말</span></span>
        <span class="meter"><b>🍃</b>${l2g}/${l2n}</span></button>
      ${typeof r3Home==='function' ? `<button class="weekbtn" id="goL3"><span class="wem" aria-hidden="true">📖</span>
        <span style="min-width:0"><span class="lbl-s">3단계 · NEW</span><span class="t">짧은 글 읽기</span><span class="k">당연한 것을 당연하게 읽어요</span></span>
        <span class="meter"><b>⭐</b>${Object.keys(r3State().done).length}</span></button>` : ''}
    </div>`;
  $('#goL1').onclick = koL1; $('#goL2').onclick = v2Home; if($('#goL3')) $('#goL3').onclick = r3Home;
}

function v2Home(){
  curLang = 'ko'; updateBar();
  nav('2단계 · 어휘 키우기', koHome);
  const v = v2State(), got = Object.keys(v.words).length, total = K2.units.reduce((a,u)=>a+u.words.length,0);
  stage.innerHTML = `
    <div class="hero"><h1>어휘 키우기 🌳</h1><p>한 주에 한 단원씩 · 낱말 나무에 잎이 ${got}개 자랐어요</p></div>
    <div class="grid2">
      <button class="weekbtn review" id="revBtn" ${got<6?'disabled':''}><span class="wem" aria-hidden="true">🔁</span>
        <span style="min-width:0"><span class="t">오늘의 복습</span><span class="k">${got<6?'낱말을 6개 모으면 열려요':'예전에 배운 낱말 다시 만나기'}</span></span></button>
      <button class="weekbtn review" id="treeBtn"><span class="wem" aria-hidden="true">🌳</span>
        <span style="min-width:0"><span class="t">낱말 나무</span><span class="k">모은 낱말 보기</span></span>
        <span class="meter"><b>${got}</b>/${total}</span></button>
      ${K2.units.map(u=>`
        <button class="weekbtn" data-u="${u.id}">
          <span class="wem" aria-hidden="true">${u.e}</span>
          <span style="min-width:0"><span class="lbl-s">${esc(u.wk)}</span><span class="t">${esc(u.t)}</span><span class="k">낱말 ${u.words.length}개</span></span>
          <span class="meter">${v.trophies[u.id]?'🏆':'<b>⭐</b>'}${v2Count(u)}/6</span>
        </button>`).join('')}
    </div>`;
  stage.querySelectorAll('.weekbtn[data-u]').forEach(b=>b.onclick=()=>v2Menu(b.dataset.u));
  if(got>=6) $('#revBtn').onclick = v2Review;
  $('#treeBtn').onclick = v2Tree;
}

async function v2Menu(id){
  const u = v2Unit(id), G = v2Games(u);
  curLang = 'ko'; updateBar();
  nav(u.t, v2Home);
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio('v-shared'), loadAudio(id)]);
  if($('#barName').textContent !== u.t) return;
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">${u.e}</div><h1>${esc(u.t)}</h1><p>${esc(u.wk)} · 위에서부터 차례대로 하면 좋아요</p></div>
    <div class="grid2">
      ${G.map((g,i)=>`
        <button class="stagebtn ${v2Done(u,g.id)?'done':''}" data-g="${g.id}">
          <span class="num">${g.e}</span>
          <span style="min-width:0"><span class="t">${i+1}. ${g.t}</span><span class="k">${g.k}</span></span>
          <span class="stk" aria-hidden="true">${v2Done(u,g.id)?'⭐':''}</span>
        </button>`).join('')}
    </div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>v2Play(u, b.dataset.g));
}
function v2Play(u, gid){ (gid==='spec' ? SPECGAME[u.g] : V2GAME[gid])(u); }
function v2Nav(u, gid){ const g=v2Games(u).find(x=>x.id===gid); nav(`${u.t} · ${g.t}`, ()=>v2Menu(u.id)); }

function v2Reward(u, gid, words){
  const v = v2State(), G = v2Games(u); v.done[u.id+':'+gid] = true;
  const all = G.every(g=>v.done[u.id+':'+g.id]), newTrophy = all && !v.trophies[u.id];
  if(all) v.trophies[u.id] = true;
  save();
  const i = G.findIndex(g=>g.id===gid), sticker = (words && words.length ? shuffle(words)[0].e : u.e) || u.e;
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':sticker}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${newTrophy?`"${esc(u.t)}" 놀이를 모두 끝내서 트로피를 받았어요!`:`스티커 ${sticker} 를 받았어요! (${G[i].t})`}</p></div>
    <div class="row"><button class="big alt" id="toMenu">⬅️ ${esc(u.t)}</button>${i<G.length-1?`<button class="big go" id="nextG">다음: ${G[i+1].t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨🍃');
  (async()=>{ const my=++speakToken; await koPraise(); if(my!==speakToken) return; await wait(200); say(newTrophy?'트로피를 받았어요!':'스티커를 받았어요!'); })();
  $('#toMenu').onclick = ()=>v2Menu(u.id);
  if(i<G.length-1) $('#nextG').onclick = ()=>v2Play(u, G[i+1].id);
}

/* ---------- generic engines ---------- */
/* choice rounds: q(i) -> {html, opts:[{k,lab,e}], ans, play, after, word, cls} ; no hints: sound of the answer only after a right tap */
function v2Choice(u, gid, n, q, done){
  let i = 0; const got = [];
  function show(){
    const r = q(i); let locked = false;
    const cols = r.opts.length===2 ? 'two' : 'three';
    stage.innerHTML = `
      <div class="progress">${i+1} / ${n}</div>
      ${r.html}
      <div class="cards ${cols} ${r.cls||''}">${r.opts.map(o=>`
        <button class="card wordonly" data-k="${esc(o.k)}">${o.e?`<span class="tface ${r.hidePics?'hintpic':''}" aria-hidden="true" ${r.hidePics?'hidden':''}>${o.e}</span>`:''}<span class="tw ko-w">${esc(o.lab)}</span></button>`).join('')}</div>
      ${r.hint?`<div class="row"><button class="big alt" id="hintBtn">💡 그림 힌트</button></div>`:''}`;
    r.play(); const again = $('#again'); if(again) again.onclick = r.play;
    if(r.hint){ let t=null; $('#hintBtn').onclick = ()=>{ const ps=stage.querySelectorAll('.hintpic'); ps.forEach(p=>p.hidden=false); clearTimeout(t); t=setTimeout(()=>ps.forEach(p=>p.hidden=true),1000); }; }
    stage.querySelectorAll('.card').forEach(c=>c.onclick = async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.k === r.ans){
        locked = true; c.classList.add('right'); good(c);
        if(r.word){ collect2(r.word); got.push(r.word); }
        ++speakToken; await r.after(c); await wait(450);
        i++; i<n ? show() : (done ? done(got) : v2Reward(u, gid, got));
      }else{ c.classList.add('wrong'); bad(c); if(r.word){ const v=v2State(); v.miss[r.word.w]=(v.miss[r.word.w]||0)+1; save(); } }
    });
  }
  show();
}
const bear = (text, cls='') => `<div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble wrap ko-s ${cls}">${text}</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>`;

/* self-check rounds (read / touch / act): child goes first, then hears the answer; mom taps ⭕ or 🔁 */
function v2Check(u, gid, list, prompt){
  const queue = [...list], retried = new Set(); let n = 0;
  function show(){
    const w = queue.shift(); let shown = false;
    stage.innerHTML = `
      <div class="progress">${n+1} / ${list.length + retried.size}</div>
      ${bear(esc(prompt))}
      <div class="wordcard">${koWord(w.w,'mainw v2fit')}</div>
      <div id="ansPic" class="v2pic" hidden>${pic(w.e,'','md')}</div>
      <div class="row" id="step1"><button class="big go" id="reveal">🔊 정답 듣기</button></div>
      <div class="row" id="step2" hidden><span class="guide">엄마가 눌러 주세요</span></div>
      <div class="row" id="step3" hidden><button class="big alt" id="retry">🔁 다시 해 볼게요</button><button class="big go" id="okay">⭕ 잘했어요!</button></div>`;
    fitWord();
    const play = ()=>sayOne(prompt); play(); $('#again').onclick = ()=> shown ? sayOne(w.w) : play();
    $('#reveal').onclick = async ()=>{
      shown = true; $('#ansPic').hidden = false; $('#step1').hidden = true; $('#step2').hidden = false; $('#step3').hidden = false;
      collect2(w); await sayOne(w.w);
    };
    $('#okay').onclick = ()=>{ good($('#okay')); n++; next(); };
    $('#retry').onclick = ()=>{ const v=v2State(); v.miss[w.w]=(v.miss[w.w]||0)+1; save(); boop(); if(!retried.has(w.w)){ retried.add(w.w); queue.push(w); } n++; next(); };
  }
  function next(){ queue.length ? show() : v2Reward(u, gid, list); }
  show();
}
/* shrink long words so they stay on one line */
function fitWord(){ const el = stage.querySelector('.v2fit'); if(!el) return; const box = el.parentElement; let fs = parseFloat(getComputedStyle(el).fontSize); let k=0; while(el.scrollWidth > box.clientWidth - 8 && fs > 28 && k++<40){ fs -= 4; el.style.fontSize = fs+'px'; } }

/* ---------- common games ---------- */
function v2Learn(u){
  v2Nav(u,'learn'); const list = v2R(u, 12); let i=0;
  function show(){
    const w = list[i]; collect2(w);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${list.length}</div>
      <button id="picBtn" aria-label="다시 듣기">${pic(w.e,'','md')}</button>
      <div class="wordcard">${koWord(w.w,'mainw v2fit')}</div>
      <div class="bubble wrap ko-s">${esc(w.m)}</div>
      <div class="bubble me wrap ko-s v2ex">“${esc(w.x)}”</div>
      <div class="row"><button class="big alt" id="again">🔊 다시 듣기</button><button class="big go" id="next">${i<list.length-1?'다음 ➜':'끝! 🎉'}</button></div>`;
    fitWord();
    const play = ()=>sayAll(w.w, w.m, w.x);
    play(); $('#again').onclick = play; $('#picBtn').onclick = play;
    $('#next').onclick = ()=>{ addStar(); i++; i<list.length ? show() : v2Reward(u,'learn',list); };
  }
  show();
}

function v2Sentence(u){
  v2Nav(u,'sentence'); const rounds = v2R(u, 8);
  v2Choice(u, 'sentence', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w, ...decoys(u, w, 2, x=>!w.x.includes(x.w))]);
    const k = w.x.indexOf(w.w);
    const sent = esc(w.x.slice(0,k)) + `<span class="blank-w" id="bw">　　</span>` + esc(w.x.slice(k+w.w.length));
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w})),
      html: (w.pos ? scene(w.pos) : '') + bear(sent, 'sent'),
      play: ()=>sayAll(w.x),
      after: async ()=>{ $('#bw').textContent = w.w; $('#bw').classList.add('got'); await say(w.x); } };
  });
}

function v2Riddle(u){
  v2Nav(u,'riddle'); const rounds = v2R(u, 8);
  v2Choice(u, 'riddle', rounds.length, i=>{
    const w = rounds[i], q = v2Q(u,w), opts = shuffle([w, ...decoys(u, w)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w, e:o.e})), hidePics:true, hint:true,
      html: bear(`${esc(w.m)}<br><b>${q}</b>`),
      play: ()=>sayAll(w.m, q), after: ()=>say(w.w) };
  });
}

function v2Read(u){
  v2Nav(u,'read');
  const list = shuffle(u.words).sort((a,b)=>readLv(a.w)-readLv(b.w)).slice(0,8);
  v2Check(u, 'read', list, '소리 내어 읽어 봐요!');
}

function v2Talk(u){
  v2Nav(u,'talk'); const list = u.talk; let i=0;
  function show(){
    const t = list[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${list.length}</div>
      <div class="plates" aria-hidden="true">👩‍👧 💬</div>
      ${bear(esc(t))}
      <p class="guide">엄마랑 이야기를 나눈 다음 눌러요</p>
      <div class="row"><button class="big go" id="next">${i<list.length-1?'다 말했어요 ➜':'끝! 🎉'}</button></div>`;
    const play = ()=>sayAll('엄마랑 이야기해 봐요!', t); play(); $('#again').onclick = play;
    $('#next').onclick = ()=>{ addStar(); i++; i<list.length ? show() : v2Reward(u,'talk',u.words); };
  }
  show();
}
const V2GAME = {learn:v2Learn, sentence:v2Sentence, riddle:v2Riddle, read:v2Read, talk:v2Talk};

/* ---------- special games ---------- */
function gTouch(u){ v2Nav(u,'spec'); v2Check(u,'spec', v2R(u,8), '몸에서 찾아 짚어 봐요!'); }
function gAct(u){ v2Nav(u,'spec'); v2Check(u,'spec', v2R(u,8), '몸으로 흉내 내 봐요!'); }

function gFit(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 8);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w.w, ...w.d]), [a,b] = w.f.split('＿');
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o, lab:o})),
      html: `<div class="row">${pic(w.e,'','md')}</div>` + bear(`${esc(a)}<span class="blank-w" id="bw">　　</span>${esc(b)}`,'sent'),
      play: ()=>sayOne('어떤 말이 딱 맞을까요?'),
      after: async ()=>{ $('#bw').textContent = w.w; $('#bw').classList.add('got'); await say(w.f.replace('＿', w.w)); } };
  });
}

function gWear(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 9);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w.v, ...shuffle(u.verbs.filter(v=>v!==w.v)).slice(0,2)]);
    const k = w.x.indexOf(w.v);
    return { word:w, ans:w.v, opts:opts.map(o=>({k:o, lab:o})),
      html: `<div class="row">${pic(w.e,'','md')}</div>` + bear(`${esc(w.x.slice(0,k))}<span class="blank-w" id="bw">　　</span>${esc(w.x.slice(k+w.v.length))}`,'sent'),
      play: ()=>sayOne('어떤 말이 딱 맞을까요?'),
      after: async ()=>{ $('#bw').textContent = w.v; $('#bw').classList.add('got'); await say(w.x); } };
  });
}

function gBasket(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 9);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i];
    return { word:w, ans:w.c, cls:'baskets', opts:u.baskets.map(b=>({k:b[0], lab:b[2], e:b[1]})),
      html: bear('어느 바구니에 넣을까요?') + `<div class="wordcard">${koWord(w.w,'v2fit')}</div>`,
      play: ()=>sayOne('어느 바구니에 넣을까요?'),
      after: async c=>{ c.querySelector('.tface').textContent = w.e; await say(w.w); } };
  });
}

function gSeesaw(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 8);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], o = u.words.find(x=>x.w===w.o);
    const opts = shuffle([o, ...shuffle(u.words.filter(x=>x!==w && x!==o)).slice(0,2)]);
    return { word:w, ans:o.w, opts:opts.map(x=>({k:x.w, lab:x.w})),
      html: bear('반대말을 찾아봐요!') + `
        <div class="seesaw"><div class="ss-board"><div class="ss-l"><span class="em">${w.e}</span><span class="ko-w">${esc(w.w)}</span></div><div class="ss-r" id="ssR"><span class="em">❔</span></div></div><div class="ss-pivot"></div></div>`,
      play: ()=>sayOne('반대말을 찾아봐요!'),
      after: async ()=>{ $('#ssR').innerHTML = `<span class="em">${o.e}</span><span class="ko-w">${esc(o.w)}</span>`; stage.querySelector('.seesaw').classList.add('even'); await say(w.w); await wait(250); await say(o.w); } };
  });
}

function gFeel(u){
  v2Nav(u,'spec'); const items = shuffle(u.items).slice(0,8);
  v2Choice(u,'spec', items.length, i=>{
    const [e, thing, ans, sent, nx] = items[i], w = u.words.find(x=>x.w===ans);
    const ds = shuffle(u.words.filter(x=>x.w!==ans && !nx.includes(x.w))).slice(0,2);
    return { word:w, ans, opts:shuffle([w,...ds]).map(x=>({k:x.w, lab:x.w})),
      html: `<div class="row">${pic(e, thing, 'md')}</div>` + bear('어떤 말이 딱 맞을까요?'),
      play: ()=>sayAll('어떤 말이 딱 맞을까요?'), after: ()=>say(sent) };
  }, got=>ladder(u, got));
}
/* 온도 사다리 — tap the cards from coldest to hottest */
function ladder(u, got){
  const L = u.ladder; let next = 0;
  stage.innerHTML = `
    <div class="progress">마지막 · 온도 사다리</div>
    ${bear('차가운 것부터 차례대로 놓아 봐요!')}
    <div class="ladder">${L.map((_,k)=>`<div class="lslot" id="ls${k}"><span class="lnum">${k+1}</span></div>`).join('')}</div>
    <div class="cards two">${shuffle(L).map(([w,e])=>`<button class="card wordonly" data-w="${esc(w)}"><span class="tw ko-w">${esc(w)}</span></button>`).join('')}</div>`;
  const play = ()=>sayOne('차가운 것부터 차례대로 놓아 봐요!'); play(); $('#again').onclick = play;
  stage.querySelectorAll('.card').forEach(c=>c.onclick = async ()=>{
    if(c.classList.contains('right')) return;
    if(c.dataset.w === L[next][0]){
      c.classList.add('right'); c.disabled = true; good(c);
      $('#ls'+next).innerHTML = `<span class="em">${L[next][1]}</span><span class="ko-w">${esc(L[next][0])}</span>`; $('#ls'+next).classList.add('on');
      await sayOne(L[next][0]); next++;
      if(next===L.length){ await wait(500); v2Reward(u,'spec',got); }
    }else bad(c);
  });
}

function gMove(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 8);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w, ...decoys(u,w)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w})),
      html: bear('어떻게 움직일까요?') + `<div class="mvbox"><span class="mv mv-${w.a}" aria-hidden="true">${w.e}</span></div>`,
      play: ()=>sayOne('어떻게 움직일까요?'), after: ()=>say(w.x) };
  });
}

function gHeart(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 8);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w, ...decoys(u,w)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w, e:o.e})),
      html: `<div class="plates" aria-hidden="true">📖</div>` + bear(`${esc(w.s)}<br><b>어떤 마음일까요?</b>`),
      play: ()=>sayAll(w.s, '어떤 마음일까요?'), after: ()=>say(w.x) };
  });
}

function gWhere(u){
  v2Nav(u,'spec'); const rounds = shuffle(u.words.filter(w=>w.pos));
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w, ...decoys(u, w, 2, x=>!!x.pos)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w})),
      html: scene(w.pos) + bear('고양이가 어디에 있을까요?'),
      play: ()=>sayOne('고양이가 어디에 있을까요?'), after: ()=>say(w.x) };
  });
}
/* little picture: cat + table / fence / trees / circle */
function scene(pos){
  const cat = cls => `<span class="sc-cat ${cls}" aria-hidden="true">🐱</span>`;
  const table = `<div class="sc-table"><i></i><b class="l"></b><b class="r"></b></div>`;
  const inner = {
    up:      table + cat('c-up'),
    down:    table + cat('c-down'),
    side:    table + cat('c-side'),
    in:      `<div class="sc-fence"></div>` + cat('c-in'),
    out:     `<div class="sc-fence left"></div>` + cat('c-out'),
    between: `<span class="sc-tree t1">🌳</span><span class="sc-tree t2">🌳</span>` + cat('c-mid'),
    middle:  `<div class="sc-ring"></div>` + cat('c-ring')
  }[pos];
  return `<div class="scene" aria-hidden="true">${inner}</div>`;
}

function gPolite(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 9);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], opts = shuffle([w, ...decoys(u,w)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w})),
      html: bear('할머니께는 어떻게 말할까요?') + `<div class="polite"><div class="wordcard sm">${koWord(w.p)}</div><span class="arrow" aria-hidden="true">➜ 👵</span><div class="wordcard sm q">${koWord('?')}</div></div>`,
      play: ()=>sayAll('할머니께는 어떻게 말할까요?', w.p),
      after: async ()=>{ stage.querySelector('.polite .q .koword').textContent = w.w; await say(w.x); } };
  });
}

function gKey(u){
  v2Nav(u,'spec'); const rounds = v2R(u, 9);
  v2Choice(u,'spec', rounds.length, i=>{
    const w = rounds[i], syl = w.w[w.i];
    const opts = shuffle([w, ...decoys(u, w, 2, x=>!x.w.includes(syl))]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w})),
      html: bear('이 한자가 들어간 낱말을 찾아봐요!') + `<div class="hjkey"><span class="hjbig">${w.hj}</span><span class="ko">${esc(w.hs)}</span></div>`,
      play: ()=>sayAll('이 한자가 들어간 낱말을 찾아봐요!', w.hs),
      after: async c=>{ const t=c.querySelector('.tw'); t.innerHTML = [...w.w].map((s,k)=>k===w.i?`<b class="hjhit">${s}</b>`:s).join(''); c.insertAdjacentHTML('afterbegin', `<span class="tface">${w.e}</span>`); await say(w.w); } };
  });
}
const SPECGAME = {touch:gTouch, act:gAct, fit:gFit, wear:gWear, basket:gBasket, seesaw:gSeesaw, feel:gFeel, move:gMove, heart:gHeart, where:gWhere, polite:gPolite, key:gKey};

/* ---------- 오늘의 복습: missed words first, then words met 1 · 3 · 7 days ago, then any ---------- */
async function v2Review(){
  const v = v2State();
  nav('오늘의 복습', v2Home); stage.innerHTML = `<div class="progress">Loading…</div>`;
  const pool = [];
  K2.units.forEach(u=>u.words.forEach(w=>{ if(v.words[w.w]) pool.push({u,w}); }));
  const score = ({w}) => (v.miss[w.w]||0)*10 + ([1,3,7].includes(daysAgo(v.words[w.w])) ? 5 : 0) + Math.random()*3;
  const picks = pool.sort((a,b)=>score(b)-score(a)).slice(0,6);
  await Promise.all([loadAudio('v-shared'), ...new Set(picks.map(p=>p.u.id))].map(x=>typeof x==='string'?loadAudio(x):x));
  if($('#barName').textContent !== '오늘의 복습') return;
  v2Choice(null, 'review', picks.length, i=>{
    const {u,w} = picks[i], q = v2Q(u,w), opts = shuffle([w, ...decoys(u,w)]);
    return { word:w, ans:w.w, opts:opts.map(o=>({k:o.w, lab:o.w, e:o.e})), hidePics:true, hint:true,
      html: bear(`${esc(w.m)}<br><b>${q}</b>`),
      play: ()=>sayAll(w.m, q),
      after: async ()=>{ if(v.miss[w.w]) { v.miss[w.w]--; save(); } await say(w.w); } };
  }, got=>{
    fanfare(); burst(innerWidth/2, innerHeight/2, '🔁⭐🍃');
    stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🔁</div><h2>복습 끝!</h2><p class="guide">낱말 ${got.length}개를 다시 만났어요</p></div>
      <div class="row"><button class="big go" id="toHome">⬅️ 어휘 키우기</button></div>`;
    koPraise(); $('#toHome').onclick = v2Home;
  });
}

/* ---------- 낱말 나무 (도감) ---------- */
function v2Tree(){
  curLang='ko'; updateBar(); nav('낱말 나무', v2Home);
  const v = v2State(), got = Object.keys(v.words).length;
  stage.innerHTML = `
    <div class="hero"><h1>낱말 나무 🌳</h1><p>놀이에서 만난 낱말이 잎이 돼요 · ${got}개</p></div>
    ${K2.units.map(u=>`
      <div class="dg-sec"><div class="dg-t">${u.e} ${esc(u.wk)} · ${esc(u.t)}</div>
        <div class="dgrid">${u.words.map(w=> v.words[w.w]
          ? `<button class="dcard" data-u="${u.id}" data-w="${esc(w.w)}"><span class="em">${w.e}</span><span class="mw ${[...w.w].length>=5?'xs':[...w.w].length>=4?'s':''}">${esc(w.w)}</span></button>`
          : `<div class="dcard locked" aria-label="아직 못 모은 낱말"><span class="em">🌱</span></div>`).join('')}</div></div>`).join('')}`;
  stage.querySelectorAll('.dcard[data-w]').forEach(b=>b.onclick=async ()=>{
    const u = v2Unit(b.dataset.u), w = u.words.find(x=>x.w===b.dataset.w);
    await loadAudio(u.id); sayAll(w.w, w.m);
  });
}

/* ---------- styles for level 2 ---------- */
(()=>{ const st = document.createElement('style'); st.textContent = `
.cards.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.cards.baskets .card{min-height:130px}
.v2ex{font-size:clamp(18px,3.2vmin,26px);max-width:min(680px,100%)}
.v2pic .pic.md .em{font-size:clamp(70px,13vmin,110px)}
.wordcard.sm{padding:10px 22px;border-width:4px}
.wordcard.sm .koword{font-size:clamp(36px,7vmin,60px)}
.polite{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}
.polite .arrow{font-size:clamp(28px,5vmin,44px)}
.polite .q .koword{color:var(--berry)}
.hjkey{display:flex;flex-direction:column;align-items:center;gap:10px}
.hjkey .ko{font-size:clamp(20px,3.4vmin,28px);padding:4px 16px}
.hjbig{font-family:"Noto Serif KR",serif;font-weight:700;font-size:clamp(90px,18vmin,160px);line-height:1;color:var(--ink);background:var(--card);border-radius:28px;padding:10px 26px;box-shadow:var(--shadow)}
.hjhit{color:#E4407A;text-decoration:underline;text-underline-offset:6px}
.seesaw{width:min(520px,92vw);height:230px;position:relative}
.ss-board{position:absolute;left:0;right:0;top:160px;height:14px;background:#B5835A;border-radius:8px;transform:rotate(-12deg);transition:transform .6s;display:flex;justify-content:space-between}
.seesaw.even .ss-board{transform:rotate(0)}
.ss-l,.ss-r{position:relative;top:-124px;gap:2px;width:44%;display:flex;flex-direction:column;align-items:center;font-size:clamp(20px,3.6vmin,28px)}
.ss-l .em,.ss-r .em{font-size:clamp(46px,8vmin,70px);line-height:1}
.ss-pivot{position:absolute;left:50%;top:168px;width:0;height:0;border-left:34px solid transparent;border-right:34px solid transparent;border-bottom:60px solid #8C6A4F;transform:translateX(-50%)}
.mvbox{width:min(560px,92vw);height:170px;background:rgba(255,253,247,.7);border-radius:28px;position:relative;overflow:hidden;box-shadow:var(--shadow)}
.mv{position:absolute;left:8%;bottom:16px;font-size:clamp(64px,11vmin,96px);line-height:1}
.mv-hop{animation:mvHop 1.1s ease-in-out infinite}
@keyframes mvHop{0%{transform:translate(0,0)}25%{transform:translate(70px,-70px)}50%{transform:translate(140px,0)}75%{transform:translate(210px,-70px)}100%{transform:translate(280px,0)}}
.mv-crawl{animation:mvCrawl 6s linear infinite}
@keyframes mvCrawl{from{transform:translateX(0)}to{transform:translateX(300px)}}
.mv-waddle{animation:mvWaddle 3s linear infinite}
@keyframes mvWaddle{0%{transform:translateX(0) rotate(-14deg)}12.5%{transform:translateX(38px) rotate(14deg)}25%{transform:translateX(76px) rotate(-14deg)}37.5%{transform:translateX(114px) rotate(14deg)}50%{transform:translateX(152px) rotate(-14deg)}62.5%{transform:translateX(190px) rotate(14deg)}75%{transform:translateX(228px) rotate(-14deg)}87.5%{transform:translateX(266px) rotate(14deg)}100%{transform:translateX(300px) rotate(-14deg)}}
.mv-roll{animation:mvRoll 2.4s linear infinite}
@keyframes mvRoll{from{transform:translateX(0) rotate(0)}to{transform:translateX(320px) rotate(720deg)}}
.mv-twinkle{left:50%;bottom:40px;margin-left:-.5em;animation:mvTw 1s ease-in-out infinite}
@keyframes mvTw{0%,100%{transform:scale(.7);opacity:.35;filter:brightness(1)}50%{transform:scale(1.15);opacity:1;filter:brightness(1.4) drop-shadow(0 0 18px gold)}}
.mv-sneak{animation:mvSneak 4s steps(8) infinite}
@keyframes mvSneak{0%{transform:translate(0,6px) scaleY(.85)}100%{transform:translate(300px,6px) scaleY(.85)}}
.mv-wiggle{animation:mvWig 3.4s ease-in-out infinite}
@keyframes mvWig{0%{transform:translateX(0) scaleX(1)}12%{transform:translateX(10px) scaleX(.7)}25%{transform:translateX(50px) scaleX(1.2)}37%{transform:translateX(60px) scaleX(.7)}50%{transform:translateX(100px) scaleX(1.2)}62%{transform:translateX(110px) scaleX(.7)}75%{transform:translateX(150px) scaleX(1.2)}100%{transform:translateX(200px) scaleX(1)}}
.mv-stride{animation:mvStride 2s ease-in-out infinite}
@keyframes mvStride{0%{transform:translate(0,0)}16%{transform:translate(50px,-14px)}33%{transform:translate(100px,0)}50%{transform:translate(150px,-14px)}66%{transform:translate(200px,0)}83%{transform:translate(250px,-14px)}100%{transform:translate(300px,0)}}
.mv-toddle{animation:mvTod 4s linear infinite}
@keyframes mvTod{0%{transform:translate(0,0) rotate(-6deg)}10%{transform:translate(18px,-6px) rotate(6deg)}20%{transform:translate(36px,0) rotate(-6deg)}30%{transform:translate(54px,-6px) rotate(6deg)}40%{transform:translate(72px,0) rotate(-6deg)}50%{transform:translate(90px,-6px) rotate(6deg)}60%{transform:translate(108px,0) rotate(-6deg)}70%{transform:translate(126px,-6px) rotate(6deg)}80%{transform:translate(144px,0) rotate(-6deg)}90%{transform:translate(162px,-6px) rotate(6deg)}100%{transform:translate(180px,0) rotate(-6deg)}}
.mv-float{left:42%;animation:mvFloat 4s ease-in-out infinite}
@keyframes mvFloat{0%,100%{transform:translate(-30px,0)}50%{transform:translate(30px,-60px)}}
.mv-spin{left:50%;bottom:36px;margin-left:-.5em;animation:mvSpin 1.2s linear infinite}
@keyframes mvSpin{to{transform:rotate(360deg)}}
.mv-flutter{animation:mvFlut 3s ease-in-out infinite}
@keyframes mvFlut{0%{transform:translate(0,0) scaleX(1)}10%{transform:translate(30px,-40px) scaleX(.6)}20%{transform:translate(60px,-10px) scaleX(1)}30%{transform:translate(90px,-60px) scaleX(.6)}40%{transform:translate(120px,-20px) scaleX(1)}50%{transform:translate(150px,-70px) scaleX(.6)}60%{transform:translate(180px,-30px) scaleX(1)}70%{transform:translate(210px,-60px) scaleX(.6)}80%{transform:translate(240px,-20px) scaleX(1)}100%{transform:translate(300px,-40px) scaleX(.6)}}
@media (prefers-reduced-motion: reduce){.mv{animation-duration:12s}}
.scene{width:min(360px,88vw);height:200px;position:relative;background:rgba(255,253,247,.7);border-radius:28px;box-shadow:var(--shadow)}
.sc-cat{position:absolute;font-size:52px;line-height:1}
.sc-table{position:absolute;left:50%;bottom:22px;width:170px;height:84px;transform:translateX(-50%)}
.sc-table i{position:absolute;left:0;right:0;top:0;height:16px;background:#B5835A;border-radius:6px}
.sc-table b{position:absolute;top:14px;width:14px;height:70px;background:#8C6A4F;border-radius:4px}
.sc-table b.l{left:14px}.sc-table b.r{right:14px}
.c-up{left:50%;bottom:104px;margin-left:-26px}
.c-down{left:50%;bottom:24px;margin-left:-26px;font-size:44px}
.c-side{left:calc(50% + 100px);bottom:22px}
.sc-fence{position:absolute;left:50%;top:30px;width:170px;height:140px;transform:translateX(-50%);border:8px dashed #8C6A4F;border-radius:18px}
.sc-fence.left{left:34%}
.c-in{left:50%;top:70px;margin-left:-26px}
.c-out{right:18px;top:70px}
.sc-tree{position:absolute;bottom:14px;font-size:88px;line-height:1}
.sc-tree.t1{left:12%}.sc-tree.t2{right:12%}
.c-mid{left:50%;bottom:20px;margin-left:-26px}
.sc-ring{position:absolute;left:50%;top:50%;width:170px;height:170px;margin:-85px 0 0 -85px;border:8px solid #E4407A;border-radius:50%}
.c-ring{left:50%;top:50%;margin:-26px 0 0 -26px}
.ladder{display:flex;gap:10px;width:min(700px,100%);justify-content:center}
.lslot{flex:1;min-height:110px;border-radius:20px;border:4px dashed var(--ink-soft);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(16px,2.8vmin,22px);background:rgba(255,253,247,.5)}
.lslot .em{font-size:44px;line-height:1}
.lslot .lnum{font-family:var(--f-display);font-weight:700;font-size:26px;color:var(--ink-soft)}
.lslot.on{border-style:solid;border-color:var(--good);background:#DDF6E7}
.weekbtn[disabled]{opacity:.55}
`; document.head.appendChild(st); })();
