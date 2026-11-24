/* ===== 한글 3단계 · 짧은 글 읽기 (uses helpers from the main page, hangul.js, vocab.js) ===== */
const K3 = window.KO3DATA || {units:[], retell:{}};
function r3State(){ const ks = koState(); if(!ks.r3) ks.r3 = {done:{}, clue:0}; return ks.r3; }
const STEPS = ['들어요','같이 읽어요','혼자 읽어요','질문','다시 말해요'];

function r3Home(){
  curLang='ko'; updateBar(); nav('3단계 · 짧은 글 읽기', koHome);
  const r = r3State();
  stage.innerHTML = `
    <div class="hero"><h1>짧은 글 읽기 📖</h1><p>당연한 것을 당연하게 읽어요 · 단원을 골라요</p></div>
    <div class="grid2">${K3.units.map((u,i)=> u.id ? `
      <button class="weekbtn" data-u="${i}"><span class="wem" aria-hidden="true">🔎</span>
        <span style="min-width:0"><span class="lbl-s">${u.n} 단원</span><span class="t">${esc(u.t)}</span><span class="k">${esc(u.k)}</span></span>
        <span class="meter"><b>⭐</b>${u.texts.filter(x=>r.done[x.id]).length}/${u.texts.length}</span></button>` : `
      <button class="weekbtn soon" disabled><span class="wem" aria-hidden="true">🔒</span>
        <span style="min-width:0"><span class="lbl-s">${u.n} 단원</span><span class="t">${esc(u.t)}</span><span class="k">준비 중이에요</span></span></button>`).join('')}
    </div>`;
  stage.querySelectorAll('.weekbtn[data-u]').forEach(b=>b.onclick=()=>r3Unit(K3.units[+b.dataset.u]));
}

async function r3Unit(u){
  curLang='ko'; updateBar(); nav(`${u.n} ${u.t}`, r3Home);
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio('r-shared'), loadAudio(u.id)]);
  if($('#barName').textContent !== `${u.n} ${u.t}`) return;
  const r = r3State();
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">🔎</div><h1>${esc(u.t)}</h1><p>글에 써 있지 않은 것도 단서로 짐작해요</p></div>
    <div class="grid2">
      <button class="stagebtn ${r.clue?'done':''}" id="clueBtn"><span class="num">🕵️</span>
        <span style="min-width:0"><span class="t">몸풀기 · 단서 탐정</span><span class="k">한 문장 보고 짐작하기</span></span><span class="stk" aria-hidden="true">${r.clue?'⭐':''}</span></button>
      ${u.texts.map((x,i)=>`
        <button class="stagebtn ${r.done[x.id]?'done':''}" data-t="${i}"><span class="num">${x.e}</span>
          <span style="min-width:0"><span class="t">${i+1}. ${esc(x.t)}</span><span class="k">${x.kind==='이야기'?'📖 이야기글':'🔎 지식글'}</span></span>
          <span class="stk" aria-hidden="true">${r.done[x.id]?'⭐':''}</span></button>`).join('')}
    </div>`;
  $('#clueBtn').onclick = ()=>r3Clue(u);
  stage.querySelectorAll('.stagebtn[data-t]').forEach(b=>b.onclick=()=>r3Lesson(u, u.texts[+b.dataset.t]));
}

/* ---------- 단서 탐정: one clue sentence -> pick the guess ---------- */
function r3Clue(u){
  nav(`${u.t} · 단서 탐정`, ()=>r3Unit(u));
  const rounds = shuffle(u.clues).slice(0,8); let i=0;
  function show(){
    const [s, e, a, d1, d2] = rounds[i]; let locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="plates" aria-hidden="true">🕵️ ${e}</div>
      <div class="r3text one"><span class="r3s">${esc(s)}</span></div>
      ${bear('단서를 보고 짐작해 봐요!')}
      <div class="cards three">${shuffle([a,d1,d2]).map(o=>`<button class="card wordonly" data-k="${esc(o)}"><span class="tw ko-w r3opt">${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayAll(s, '단서를 보고 짐작해 봐요!'); play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.k===a){ locked=true; c.classList.add('right'); good(c); await sayOne(a); await wait(450); i++; i<rounds.length ? show() : r3Done(u, null, '단서 탐정'); }
      else { c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

/* ---------- one text, five steps ---------- */
function r3Lesson(u, x){
  const back = ()=>r3Unit(u);
  let step = 0;
  const bar = () => `<div class="r3steps">${STEPS.map((s,k)=>`<span class="${k<step?'ok':k===step?'on':''}">${k+1} ${s}</span>`).join('')}</div>`;
  const textBox = (cls='') => `<div class="r3text ${cls}" id="txt"><div class="r3title">${x.e} ${esc(x.t)} <span class="r3kind">${x.kind}글</span></div>${x.s.map((s,k)=>`<span class="r3s" data-i="${k}">${esc(s)}</span>`).join(' ')}</div>`;
  const hl = k => stage.querySelectorAll('.r3s').forEach(e=>e.classList.toggle('on', +e.dataset.i===k));
  async function readAll(){ const my=++speakToken; for(let k=0;k<x.s.length;k++){ if(my!==speakToken) return; hl(k); await say(x.s[k]); if(my!==speakToken) return; await wait(300); } hl(-1); }
  const go = fn => { step++; fn(); };
  nav(`${x.t}`, back);

  /* 1. 들어요 */
  function s1(){
    stage.innerHTML = `${bar()}${textBox()}${bear('글을 잘 들어 봐요!')}
      <div class="row"><button class="big alt" id="re">🔊 다시 듣기</button><button class="big go" id="nx">다음 ➜</button></div>`;
    const play = async()=>{ await sayOne('글을 잘 들어 봐요!'); await readAll(); };
    play(); $('#again').onclick = play; $('#re').onclick = readAll;
    $('#nx').onclick = ()=>{ addStar(); go(s2); };
  }
  /* 2. 같이 읽어요: one sentence at a time, child first */
  function s2(){
    let k = 0;
    function one(){
      stage.innerHTML = `${bar()}${textBox('focus')}${bear('이 문장을 소리 내어 읽어 봐요!')}
        <div class="row"><button class="big alt" id="hear">🔊 들어 보기</button><button class="big go" id="nx">${k<x.s.length-1?'다음 문장 ➜':'다 읽었어요 ➜'}</button></div>`;
      hl(k); const play = ()=>sayOne('이 문장을 소리 내어 읽어 봐요!'); if(k===0) play(); $('#again').onclick = play;
      $('#hear').onclick = ()=>sayOne(x.s[k]);
      $('#nx').onclick = ()=>{ addStar(); k++; k<x.s.length ? one() : go(s3); };
    }
    one();
  }
  /* 3. 혼자 읽어요: read first, then check */
  function s3(){
    stage.innerHTML = `${bar()}${textBox()}${bear('이제 혼자 읽어 봐요!')}
      <div class="row" id="a"><button class="big go" id="chk">🔊 다 읽었어요, 확인!</button></div>
      <div class="row" id="b" hidden><button class="big alt" id="more">🔁 한 번 더</button><button class="big go" id="ok">⭕ 잘 읽었어요!</button></div>`;
    const play = ()=>sayOne('이제 혼자 읽어 봐요!'); play(); $('#again').onclick = play;
    $('#chk').onclick = async ()=>{ $('#a').hidden = true; $('#b').hidden = false; await readAll(); };
    $('#more').onclick = s3;
    $('#ok').onclick = ()=>{ good($('#ok')); go(q1); };
  }
  /* 4. 질문 3층 */
  function choice(q, label, onRight){
    stage.innerHTML = `${bar()}${textBox('mini')}
      <div class="r3q"><span class="tag3">${label}</span></div>${bear(esc(q.q))}
      <div class="cards three">${shuffle(q.o).map(o=>`<button class="card wordonly" data-k="${esc(o)}"><span class="tw ko-w r3opt">${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayAll(label==='써 있는 것' ? '글에 써 있는 것을 찾아봐요!' : '짐작해 봐요!', q.q); play(); $('#again').onclick = play;
    let locked=false;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.k===q.a){ locked=true; c.classList.add('right'); good(c); await sayOne(q.a); await wait(400); onRight(); }
      else { c.classList.add('wrong'); bad(c); }
    });
  }
  function q1(){ choice(x.q1, '써 있는 것', ()=>{ step=3; q2(); }); }
  function q2(){ choice(x.q2, '짐작하는 것', clue); }
  /* how did you know? tap a clue sentence */
  function clue(){
    stage.innerHTML = `${bar()}<div class="r3q"><span class="tag3">어떻게 알았어?</span></div>
      ${bear('어떻게 알았어? 단서 문장을 콕 짚어 봐요!')}
      ${textBox('tap')}
      <div class="r3why" id="why" hidden></div>
      <div class="row"><button class="big go" id="nx" hidden>다음 ➜</button></div>`;
    const play = ()=>sayOne('어떻게 알았어? 단서 문장을 콕 짚어 봐요!'); play(); $('#again').onclick = play;
    let done=false;
    stage.querySelectorAll('.r3s').forEach(e=>e.onclick=async ()=>{
      if(done) return;
      if(x.q2.clue.includes(+e.dataset.i)){
        done=true; good(e);
        stage.querySelectorAll('.r3s').forEach(z=>z.classList.toggle('clue', x.q2.clue.includes(+z.dataset.i)));
        $('#why').hidden=false; $('#why').innerHTML = `💡 ${esc(x.q2.why)}`;
        await sayOne('맞아요!'); await wait(200); await say(x.q2.why);
        $('#nx').hidden=false;
      }else{ bad(e); }
    });
    $('#nx').onclick = ()=>q3();
  }
  function q3(){
    stage.innerHTML = `${bar()}<div class="r3q"><span class="tag3">내 생각</span></div>
      <div class="plates" aria-hidden="true">👩‍👧 💬</div>${bear(esc(x.q3))}
      <p class="guide">정답은 없어요. 엄마랑 이야기를 나눈 다음 눌러요</p>
      <div class="row"><button class="big go" id="nx">다 말했어요 ➜</button></div>`;
    const play = ()=>sayAll('엄마랑 이야기해 봐요!', x.q3); play(); $('#again').onclick = play;
    $('#nx').onclick = ()=>{ addStar(); go(s5); };
  }
  /* 5. 다시 말해요 — text hidden; mom ticks each point the child covered */
  function s5(){
    const pts = K3.retell[x.kind];
    stage.innerHTML = `${bar()}<div class="plates" aria-hidden="true">${x.e} 🗣️</div>
      ${bear('엄마한테 이 글을 다시 말해 줘요!')}
      <div class="r3retell">${pts.map((p,k)=>`<button class="r3pt" data-k="${k}"><span class="ck">○</span>${esc(p)}</button>`).join('')}</div>
      <p class="guide">아이가 말한 것을 엄마가 눌러 주세요 · 글을 다시 보려면 <button class="small" id="peek">📄 글 보기</button></p>
      <div id="peekBox" hidden>${textBox('mini')}</div>
      <div class="row"><button class="big go" id="fin">끝! 🎉</button></div>`;
    const play = ()=>sayAll('엄마한테 이 글을 다시 말해 줘요!'); play(); $('#again').onclick = play;
    stage.querySelectorAll('.r3pt').forEach(b=>b.onclick=()=>{ if(b.classList.contains('on')) return; b.classList.add('on'); b.querySelector('.ck').textContent='✔'; ding(); sayOne(pts[+b.dataset.k]); });
    $('#peek').onclick = ()=>{ $('#peekBox').hidden = !$('#peekBox').hidden; };
    $('#fin').onclick = ()=>r3Done(u, x, x.t);
  }
  s1();
}

function r3Done(u, x, title){
  const r = r3State(); if(x) r.done[x.id] = true; else r.clue = (r.clue||0) + 1; addStar(3); save();
  const all = u.texts.every(t=>r.done[t.id]);
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${all&&x?'🏆':(x?x.e:'🕵️')}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${x?`“${esc(title)}” 글을 다섯 걸음으로 다 읽었어요!`:'단서 탐정 끝! 당연한 것을 당연하게 읽었어요.'}</p></div>
    <div class="row"><button class="big go" id="toU">⬅️ ${esc(u.t)}</button></div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉🔎📖');
  koPraise(); $('#toU').onclick = ()=>r3Unit(u);
}

(()=>{ const st = document.createElement('style'); st.textContent = `
.r3steps{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font-family:var(--f-ko);font-size:15px}
.r3steps span{padding:5px 12px;border-radius:999px;background:rgba(255,253,247,.6);color:var(--ink-soft)}
.r3steps span.on{background:var(--berry);color:#fff}
.r3steps span.ok{background:#DDF6E7;color:#1E7547}
.r3text{background:var(--card);border-radius:28px;box-shadow:var(--shadow);padding:clamp(18px,3.4vmin,34px) clamp(20px,4vmin,40px);max-width:min(760px,100%);box-sizing:border-box;font-family:var(--f-ko);font-size:clamp(26px,4.6vmin,40px);line-height:1.75;text-align:left;word-break:keep-all}
.r3text.mini{font-size:clamp(20px,3.2vmin,28px);padding:16px 24px}
.r3text.one{text-align:center}
.r3title{font-size:clamp(17px,2.6vmin,22px);color:var(--ink-soft);margin-bottom:6px}
.r3kind{font-size:.85em;background:var(--tile);border-radius:999px;padding:2px 10px;margin-left:6px}
.r3s{border-radius:10px;padding:2px 2px;transition:background .25s}
.r3s.on{background:#FFE58A}
.r3text.focus .r3s:not(.on){opacity:.35}
.r3text.tap .r3s{cursor:pointer;background:rgba(91,184,255,.10);box-decoration-break:clone;-webkit-box-decoration-break:clone}
.r3s.clue{background:#FFE58A;outline:3px solid #F2B705}
.r3q{display:flex;justify-content:center}
.tag3{font-family:var(--f-ko);font-size:18px;font-weight:700;background:var(--ink);color:#fff;border-radius:999px;padding:6px 18px}
.r3opt{font-size:clamp(20px,3.4vmin,28px)!important;word-break:keep-all}
.r3why{font-family:var(--f-ko);font-size:clamp(20px,3.4vmin,28px);background:#FFF4CC;border-radius:20px;padding:14px 22px;max-width:min(760px,100%)}
.r3retell{display:flex;flex-direction:column;gap:12px;width:min(620px,100%)}
.r3pt{background:var(--card);border-radius:22px;box-shadow:var(--shadow);padding:18px 22px;font-family:var(--f-ko);font-size:clamp(22px,3.6vmin,30px);text-align:left;display:flex;gap:14px;align-items:center}
.r3pt .ck{font-size:1.2em;color:var(--ink-soft)}
.r3pt.on{background:#DDF6E7}.r3pt.on .ck{color:#1E7547}
`; document.head.appendChild(st); })();
