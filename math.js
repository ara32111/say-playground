/* ===== 수학 놀이터 (소마셈 K 원리셈: 모으기·가르기·더하기 1,2·빼기 1,2·10 짝꿍수) — uses helpers from main page + hangul.js ===== */
const NUMD = ['영','일','이','삼','사','오','육','칠','팔','구'];
function numKo(n){ if(n===100) return '백'; if(n<10) return NUMD[n]; const t=Math.floor(n/10), u=n%10; return (t===1?'':NUMD[t])+'십'+(u?NUMD[u]:''); }
const hasJong = s => { const c=s.charCodeAt(s.length-1)-0xAC00; return c>=0 && c<=11171 && c%28!==0; };
const eunNeun = s => s + (hasJong(s)?'은':'는');
const rangI = s => s + (hasJong(s)?'이랑':'랑');
/* must match make_audio_ma.py */
const opClip = (op,b,q) => `${op==='+'?'더하기':'빼기'} ${eunNeun(numKo(b))}${q?'?':''}`;
const pairClip = a => `${rangI(numKo(a))} ${eunNeun(numKo(10-a))} 십 짝꿍!`;
const rint = (a,b) => a + Math.floor(Math.random()*(b-a+1));

const MT = [
  {id:'gather', t:'모으기',      k:'사탕을 눌러서 바구니에 모아요',   e:'🍬'},
  {id:'split',  t:'가르기',      k:'다람쥐에게 도토리 나눠 주기',     e:'🐿️'},
  {id:'plus',   t:'더하기 1, 2', k:'개구리 징검다리 (100까지)',      e:'🐸'},
  {id:'minus',  t:'빼기 1, 2',   k:'쿠키 괴물 · 개구리 뒤로 뛰기',    e:'🍪'},
  {id:'ten',    t:'10 짝꿍수',   k:'계란판 꽉 채우기',              e:'🥚'},
  {id:'pairs',  t:'짝꿍 카드',   k:'10이 되는 짝 찾기 · 2라운드',    e:'🃏'},
  {id:'train',  t:'숫자 기차',   k:'섞어서 복습하기',               e:'🚂'}
];
const maDone = id => !!maState().done[id];
const N_ROUNDS = 8;

function maHome(){
  curLang='ma'; updateBar(); nav('수학 놀이터', landing);
  stage.innerHTML = `
    <div class="hero"><h1>수학 놀이터</h1><p>놀이를 골라요 · 소마셈 K 원리셈</p></div>
    <div class="grid2">
      ${MT.map((g,i)=>`
        <button class="stagebtn ${maDone(g.id)?'done':''}" data-g="${g.id}">
          <span class="num">${i+1}</span>
          <span style="min-width:0"><span class="t ko-s">${g.e} ${g.t}</span><span class="k">${g.k}</span></span>
          <span class="stk" aria-hidden="true">${maDone(g.id)?'⭐':''}</span>
        </button>`).join('')}
    </div>
    ${maState().trophy?'<div class="small">🏆 수학 놀이를 모두 끝냈어요!</div>':''}
    <div class="guide">엄마 가이드: 1번부터 차례로 하면 좋아요. 물건은 눌러서 옮겨요. 뒤쪽 문제는 💡를 누르면 그림이 1초 보여요.</div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>maStart(b.dataset.g));
}
async function maStart(id){
  maNav(id); const title=$('#barName').textContent;
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await loadAudio('ma');
  if($('#barName').textContent !== title) return;
  MGAME[id]();
}
function maNav(id){ const g=MT.find(x=>x.id===id); curLang='ma'; updateBar(); nav(`수학 · ${g.t}`, maHome); }

function maReward(id){
  const ms = maState(); ms.done[id] = true;
  const all = MT.every(g=>ms.done[g.id]); const newTrophy = all && !ms.trophy; if(all) ms.trophy = true;
  save();
  const i = MT.findIndex(g=>g.id===id), sticker = MT[i].e;
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':sticker}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${newTrophy?'수학 놀이를 모두 끝내서 트로피를 받았어요!':`스티커 ${sticker} 를 받았어요! (${MT[i].t})`}</p></div>
    <div class="row"><button class="big alt" id="toMenu">⬅️ 수학 놀이터</button>${i<MT.length-1?`<button class="big go" id="nextG">다음: ${MT[i+1].t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨'+sticker);
  (async()=>{ const my=++speakToken; await koPraise(); if(my!==speakToken) return; await wait(200); say(newTrophy?'트로피를 받았어요!':'스티커를 받았어요!'); })();
  $('#toMenu').onclick = maHome;
  if(i<MT.length-1) $('#nextG').onclick = ()=>maStart(MT[i+1].id);
}

/* ---------- shared pieces ---------- */
const chefRow = (face, text) => `<div class="chef"><div class="face" aria-hidden="true">${face}</div><div class="bubble ko-s">${text}</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>`;
const objs = (e, n, home) => Array.from({length:n}, ()=>`<button class="obj" data-h="${home}" aria-label="${e}">${e}</button>`).join('');
const eqHtml = (a, op, b, r) => `<div class="eq">${a}<span class="op">${op}</span>${b}<span class="op">=</span>${r}</div>`;
const Q = '<span class="q" id="qv">?</span>';
function numOpts(ans, lo=0, hi=100){ const c = shuffle([ans-2,ans-1,ans+1,ans+2].filter(x=>x>=lo && x<=hi)).slice(0,2); return shuffle([ans, ...c]); }
const numCards = opts => `<div class="cards three">${opts.map(o=>`<button class="card num" data-n="${o}"><span class="tw">${o}</span></button>`).join('')}</div>`;
function bindNums(ans, onRight){
  let locked=false;
  stage.querySelectorAll('.card.num').forEach(c=>c.onclick=async ()=>{
    if(locked || c.classList.contains('wrong')) return;
    if(+c.dataset.n===ans){ locked=true; c.classList.add('right'); const q=$('#qv'); if(q){ q.textContent=ans; q.classList.add('got'); } good(c); await onRight(c); }
    else{ c.classList.add('wrong'); bad(c); }
  });
}
function bindHint(){ const b=$('#hintBtn'); if(!b) return; let t=null; b.onclick=()=>{ const h=$('#hintArea'); h.hidden=false; clearTimeout(t); t=setTimeout(()=>{ h.hidden=true; }, 1000); }; }
const tick = () => tone([[660,.08]]);
const carton = (filled, cls='') => `<div class="carton ${cls}">${Array.from({length:10},(_,k)=>`<span class="cell">${k<filled?'🥚':''}</span>`).join('')}</div>`;
const splitDia = (T, l, r) => `<div class="sdia"><div class="nb">${T}</div><svg viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true"><path d="M100 2 L36 42 M100 2 L164 42" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"/></svg><div class="sbot"><div class="nb ${l==='?'?'qb':''}">${l==='?'?Q:l}</div><div class="nb ${r==='?'?'qb':''}">${r==='?'?Q:r}</div></div></div>`;

/* one number-only question (later rounds + 숫자 기차); o = {face, say, voice[], done[], body, ans, lo, hi, hint} */
function eqRound(o, label, next, top=''){
  stage.innerHTML = `
    <div class="progress">${label}</div>${top}
    ${chefRow(o.face||'🐻', o.say)}
    ${o.body}
    ${o.hint?`<div id="hintArea" class="hintarea" hidden>${o.hint}</div>`:''}
    ${numCards(numOpts(o.ans, o.lo??0, o.hi??100))}
    ${o.hint?'<div class="row"><button class="big alt" id="hintBtn">💡 힌트</button></div>':''}`;
  const play = ()=>sayAll(...o.voice); play(); $('#again').onclick = play; bindHint();
  bindNums(o.ans, async ()=>{ await sayAll(...o.done); await wait(400); next(); });
}
const qGather = (a,b) => ({face:'🐻', say:'모두 몇 개일까요?', voice:[numKo(a), opClip('+',b,true)], done:[numKo(a), opClip('+',b,false), numKo(a+b)],
  body:eqHtml(a,'+',b,Q), ans:a+b, lo:1, hi:10, hint:`<div class="row"><div class="zone">${'🍬'.repeat(a)}</div><div class="zone">${'🍭'.repeat(b)}</div></div>`});
function qSplit(T,a){ const b=T-a, left=Math.random()<.5, ans=left?a:b;
  return {face:'🐿️', say:'빈칸에 들어갈 수는 무엇일까요?', voice:['빈칸에 들어갈 수는 무엇일까요?'], done:[numKo(ans)],
    body:splitDia(T, left?'?':a, left?b:'?'), ans, lo:0, hi:10, hint:`<div class="row"><div class="zone">${'🌰'.repeat(a)}</div><div class="zone">${'🌰'.repeat(b)}</div></div>`}; }
const qPM = (a,op,b) => { const c = op==='+'?a+b:a-b; return {face:op==='+'?'🐸':'🦖', say:op==='+'?'더하면 얼마일까요?':'빼면 얼마일까요?',
  voice:[numKo(a), opClip(op,b,true)], done:[numKo(a), opClip(op,b,false), numKo(c)], body:eqHtml(a, op==='+'?'+':'−', b, Q), ans:c, lo:0, hi:100,
  hint: a<=10 ? `<div class="zone">${'🍪'.repeat(a)}</div>` : ''}; };
const qTen = a => ({face:'🐣', say:'빈칸에 들어갈 수는 무엇일까요?', voice:['빈칸에 들어갈 수는 무엇일까요?'], done:[pairClip(a)],
  body:eqHtml(a,'+',Q,10), ans:10-a, lo:1, hi:9, hint:carton(a,'sm')});

/* 1. 모으기 — rounds 1-4 tap candies into the basket (counted aloud); 5-8 number sentence with 💡 */
function maGather(){
  let i=0;
  const next = ()=>{ i++; i<N_ROUNDS ? show() : maReward('gather'); };
  function pickAB(){ const s=rint(2,10), a=rint(1,s-1); return [a, s-a]; }
  function show(){
    const [a,b] = pickAB(), sum=a+b, label=`${i+1} / ${N_ROUNDS}`;
    if(i>=4) return eqRound(qGather(a,b), label, next);
    stage.innerHTML = `
      <div class="progress">${label}</div>
      ${chefRow('🐻','사탕을 눌러서 바구니에 모아요!')}
      <div class="row"><div class="zone" id="za"><span class="lab">${a}</span>${objs('🍬',a,'za')}</div><div class="zone" id="zb"><span class="lab">${b}</span>${objs('🍭',b,'zb')}</div></div>
      <div class="zone basket" id="bk"><span class="lab">🧺</span></div>
      <div id="ask" class="ask"></div>`;
    const play = ()=>sayOne('사탕을 눌러서 바구니에 모아요!'); play(); $('#again').onclick = play;
    let done=false;
    stage.querySelectorAll('.obj').forEach(o=>o.onclick=()=>{
      if(done) return;
      if(o.parentElement.id==='bk'){ $('#'+o.dataset.h).appendChild(o); return; }
      $('#bk').appendChild(o); tick();
      const n = $('#bk').querySelectorAll('.obj').length; sayOne(numKo(n));
      if(n===sum){
        done=true;
        setTimeout(()=>{
          $('#ask').innerHTML = eqHtml(a,'+',b,Q) + numCards(numOpts(sum,1,10));
          $('#again').onclick = ()=>sayOne('모두 몇 개일까요?'); sayOne('모두 몇 개일까요?');
          bindNums(sum, async ()=>{ await sayAll(numKo(a), opClip('+',b,false), numKo(sum)); await wait(400); next(); });
        }, 600);
      }
    });
  }
  show();
}

/* 2. 가르기 — rounds 1-4 give acorns to squirrel 1, the rest go to squirrel 2 → how many?; 5-8 split diagram */
function maSplit(){
  let i=0;
  const next = ()=>{ i++; i<N_ROUNDS ? show() : maReward('split'); };
  function show(){
    const T=rint(3,10), a=rint(1,T-1), b=T-a, label=`${i+1} / ${N_ROUNDS}`;
    if(i>=4) return eqRound(qSplit(T,a), label, next);
    stage.innerHTML = `
      <div class="progress">${label}</div>
      ${chefRow('🐿️','도토리를 눌러서 다람쥐에게 주세요!')}
      <div class="zone" id="pile"><span class="lab">${T}</span>${objs('🌰',T,'pile')}</div>
      <div class="row"><div class="zone sq" id="sa"><span class="lab">🐿️ ${a}</span></div><div class="zone sq" id="sb"><span class="lab">🐿️ <span id="bq">?</span></span></div></div>
      <div id="ask" class="ask"></div>`;
    const play = ()=>sayOne('도토리를 눌러서 다람쥐에게 주세요!'); play(); $('#again').onclick = play;
    let done=false;
    stage.querySelectorAll('.obj').forEach(o=>o.onclick=async ()=>{
      if(done) return;
      if(o.parentElement.id==='sa'){ $('#pile').appendChild(o); return; }
      const have = $('#sa').querySelectorAll('.obj').length;
      if(have>=a){ bad(o); return; }
      $('#sa').appendChild(o); tick(); sayOne(numKo(have+1));
      if(have+1===a){
        done=true; await wait(500);
        for(const r of [...$('#pile').querySelectorAll('.obj')]){ $('#sb').appendChild(r); tick(); await wait(220); }
        $('#ask').innerHTML = numCards(numOpts(b,0,10));
        $('#again').onclick = ()=>sayOne('다른 다람쥐는 몇 개일까요?'); sayOne('다른 다람쥐는 몇 개일까요?');
        bindNums(b, async ()=>{ $('#bq').textContent=b; await sayOne(numKo(b)); await wait(500); next(); });
      }
    });
  }
  show();
}

/* frog on a number line window; tap the landing stone, frog hops b times */
function frogRound(a, op, b, label, next){
  const c = op==='+' ? a+b : a-b;
  const lo = Math.max(0, Math.min((op==='+' ? a : c) - 2, 93));
  const ns = Array.from({length:8}, (_,k)=>lo+k);
  stage.innerHTML = `
    <div class="progress">${label}</div>
    ${chefRow('🐸','개구리가 어디에 도착할까요?')}
    <div class="pond"><div class="stones">${ns.map(n=>`<button class="stone" data-n="${n}"><span>${n}</span>${n===a?'<span class="frog" id="frog">🐸</span>':''}</button>`).join('')}</div></div>
    ${eqHtml(a, op==='+'?'+':'−', b, Q)}`;
  const play = ()=>sayAll('개구리가 어디에 도착할까요?', numKo(a), opClip(op,b,true)); play(); $('#again').onclick = play;
  let locked=false;
  stage.querySelectorAll('.stone').forEach(s=>s.onclick=async ()=>{
    if(locked) return;
    if(+s.dataset.n===c){
      locked=true; stopVoice();
      for(let k=1;k<=b;k++){ await wait(150); const st=stage.querySelector(`.stone[data-n="${op==='+'?a+k:a-k}"]`); st.appendChild($('#frog')); tone([[523+k*120,.12]]); await wait(300); }
      s.classList.add('on'); const q=$('#qv'); q.textContent=c; q.classList.add('got'); good(s);
      await sayAll(numKo(a), opClip(op,b,false), numKo(c)); await wait(400); next();
    }else bad(s);
  });
}

/* 3. 더하기 1, 2 — up to 100; last rounds cross a ten (39 + 1, 48 + 2) */
function maPlus(){
  let i=0;
  const next = ()=>{ i++; i<N_ROUNDS ? show() : maReward('plus'); };
  function show(){
    let a, b=rint(1,2);
    if(i<3) a=rint(0,8);
    else if(i<6) a=rint(10,48);
    else { const t=rint(1,9)*10; a=t-rint(1,2); b = (t-a===2) ? 2 : b; }
    frogRound(a, '+', b, `${i+1} / ${N_ROUNDS}`, next);
  }
  show();
}

/* 4. 빼기 1, 2 — rounds 1-4 feed cookies to the monster; 5-8 frog jumps back (up to 100, crossing tens) */
function maMinus(){
  let i=0;
  const next = ()=>{ i++; i<N_ROUNDS ? show() : maReward('minus'); };
  function show(){
    const label=`${i+1} / ${N_ROUNDS}`;
    if(i>=4){
      let a, b=rint(1,2);
      if(i<6) a=rint(12,60); else { const t=rint(1,10)*10; a = t + rint(0,1); if(a===t+1) b=2; if(a>100){ a=100; } }
      return frogRound(a, '-', b, label, next);
    }
    const a=rint(3,10), b=rint(1,2), c=a-b;
    stage.innerHTML = `
      <div class="progress">${label}</div>
      ${chefRow('🦖','냠냠! 쿠키를 먹여 주세요!')}
      <div class="row"><div class="zone mon" id="mon"><span class="lab">🦖 <b>−${b}</b></span></div></div>
      <div class="zone" id="plate"><span class="lab">${a}</span>${objs('🍪',a,'plate')}</div>
      <div id="ask" class="ask"></div>`;
    const play = ()=>sayOne('냠냠! 쿠키를 먹여 주세요!'); play(); $('#again').onclick = play;
    let eaten=0, done=false;
    stage.querySelectorAll('.obj').forEach(o=>o.onclick=()=>{
      if(done || o.parentElement.id==='mon') return;
      if(eaten>=b){ bad(o); return; }
      $('#mon').appendChild(o); o.classList.add('eaten'); eaten++; tone([[330,.1],[262,.12]]);
      if(eaten===b){
        done=true;
        setTimeout(()=>{
          $('#ask').innerHTML = eqHtml(a,'−',b,Q) + numCards(numOpts(c,0,10));
          $('#again').onclick = ()=>sayOne('남은 쿠키는 몇 개일까요?'); sayOne('남은 쿠키는 몇 개일까요?');
          bindNums(c, async ()=>{ await sayAll(numKo(a), opClip('-',b,false), numKo(c)); await wait(400); next(); });
        }, 600);
      }
    });
  }
  show();
}

/* 5. 10 짝꿍수 — egg carton: how many more to fill? rounds 5-8 number sentence a + ? = 10 with 💡 */
function maTen(){
  const as = shuffle([1,2,3,4,5,6,7,8,9]).slice(0,8); let i=0;
  const next = ()=>{ i++; i<as.length ? show() : maReward('ten'); };
  function show(){
    const a=as[i], b=10-a, label=`${i+1} / ${as.length}`;
    if(i>=4) return eqRound(qTen(a), label, next);
    stage.innerHTML = `
      <div class="progress">${label}</div>
      ${chefRow('🐣','몇 개 더 넣으면 꽉 찰까요?')}
      ${carton(a)}
      ${eqHtml(a,'+',Q,10)}
      ${numCards(numOpts(b,1,9))}`;
    const play = ()=>sayOne('몇 개 더 넣으면 꽉 찰까요?'); play(); $('#again').onclick = play;
    bindNums(b, async ()=>{
      const cells=[...stage.querySelectorAll('.carton .cell')];
      for(let k=a;k<10;k++){ cells[k].textContent='🥚'; cells[k].classList.add('popin','new'); tick(); await wait(200); }
      await sayOne(pairClip(a)); await wait(400); next();
    });
  }
  show();
}

/* 6. 짝꿍 카드 — flip cards, find two numbers that make 10; 2 rounds × 3 pairs */
function maPairs(){
  const P = shuffle([[1,9],[2,8],[3,7],[4,6],[5,5]]);
  const rounds = [P.slice(0,3), [P[3], P[4], P[rint(0,2)]]]; let round=0;
  const face = n => `<span class="mnum">${n}</span><span class="mdots">${'●'.repeat(n)}</span>`;
  function show(){
    const ps = rounds[round];
    const cards = shuffle(ps.flatMap((p,n)=>[{n,v:p[0]},{n,v:p[1]}]));
    let first=null, lock=false, matched=0;
    stage.innerHTML = `
      <div class="progress">${round+1}라운드 / 2 · 더해서 10이 되는 짝을 찾아요!</div>
      <div class="mgrid three">${cards.map((c,k)=>`
        <button class="mcard" data-k="${k}" aria-label="card"><span class="back" aria-hidden="true">🥚</span><span class="front mfront">${face(c.v)}</span></button>`).join('')}</div>`;
    if(round===0) sayOne('십이 되는 짝꿍을 찾아요!');
    stage.querySelectorAll('.mcard').forEach(el=>el.onclick=async ()=>{
      const c = cards[+el.dataset.k];
      if(lock || el.classList.contains('open')) return;
      el.classList.add('open'); sayOne(numKo(c.v));
      if(!first){ first={c,el}; return; }
      const a = first; first = null;
      if(a.c.n===c.n){
        a.el.classList.add('matched'); el.classList.add('matched'); good(el); matched++;
        lock=true; await wait(300); await sayOne(pairClip(Math.min(a.c.v,c.v))); lock=false;
        if(matched===ps.length){
          await wait(400); round++;
          if(round<2){ fanfare(); burst(innerWidth/2, innerHeight/2);
            stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🃏</div><h2>1라운드 성공!</h2></div><div class="row"><button class="big go" id="nextR">2라운드 ➜</button></div>`;
            $('#nextR').onclick = show; }
          else maReward('pairs');
        }
      }else{ lock=true; await wait(900); a.el.classList.remove('open'); el.classList.remove('open'); lock=false; }
    });
  }
  show();
}

/* 7. 숫자 기차 — 8 mixed number questions; each right answer adds a car, then the train leaves */
function maTrain(){
  const kinds = shuffle(['g','s','p','m','t','p','m','s']); let i=0;
  function build(k){
    if(k==='g'){ const s=rint(2,10), a=rint(1,s-1); return qGather(a,s-a); }
    if(k==='s'){ const T=rint(3,10); return qSplit(T, rint(1,T-1)); }
    if(k==='p'){ const a=rint(0,98); return qPM(a,'+',rint(1,Math.min(2,100-a))); }
    if(k==='m'){ const a=rint(2,100); return qPM(a,'-',rint(1,2)); }
    return qTen(rint(1,9));
  }
  const trainRow = n => `<div class="trainrow"><span class="train" id="train">🚂${'🚃'.repeat(n)}</span></div>`;
  async function next(){
    i++;
    if(i<kinds.length) return show();
    stage.innerHTML = `<div class="reward">${trainRow(kinds.length)}<h2>칙칙폭폭!</h2></div>`;
    fanfare(); const done = sayOne('칙칙폭폭! 기차가 출발해요!');
    await wait(300); $('#train').classList.add('go'); await done; await wait(900);
    maReward('train');
  }
  function show(){ const o=build(kinds[i]); delete o.hint; eqRound(o, `🚂 ${i+1} / ${kinds.length}`, next, trainRow(i)); }
  show();
}

const MGAME = {gather:maGather, split:maSplit, plus:maPlus, minus:maMinus, ten:maTen, pairs:maPairs, train:maTrain};
