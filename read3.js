/* ===== 한글 3단계 · 짧은 글 읽기 (uses helpers from the main page, hangul.js, vocab.js) ===== */
const K3 = window.KO3DATA || {units:[], retell:{}};
function r3State(){ const ks = koState(); if(!ks.r3) ks.r3 = {done:{}, clue:0}; return ks.r3; }
const STEPS = ['들어요','같이 읽어요','혼자 읽어요','질문','다시 말해요'];
const R3INTRO = {'써 있는 것':'글에 써 있는 것을 찾아봐요!', '짐작하는 것':'짐작해 봐요!'};
const r3Count = u => u.texts.filter(x=>r3State().done[x.id]).length;

function r3Home(){
  curLang='ko'; updateBar(); nav('3단계 · 짧은 글 읽기', koHome);
  stage.innerHTML = `
    <div class="hero"><h1>짧은 글 읽기 📖</h1><p>당연한 것을 당연하게 읽어요 · 단원을 골라요</p></div>
    <div class="grid2">${K3.units.map((u,i)=>`
      <button class="weekbtn" data-u="${i}"><span class="wem r3num" aria-hidden="true">${u.n}</span>
        <span style="min-width:0"><span class="lbl-s">${u.n} 단원</span><span class="t">${esc(u.t)}</span><span class="k">${esc(u.k)}</span></span>
        <span class="meter">${r3Count(u)===u.texts.length?'🏆':'<b>⭐</b>'}${r3Count(u)}/${u.texts.length}</span></button>`).join('')}
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
    <div class="hero"><div class="plates r3num" aria-hidden="true">${u.n}</div><h1>${esc(u.t)}</h1><p>${esc(u.k)} · 글 ${u.texts.length}편</p></div>
    <div class="grid2">
      ${u.clues ? `<button class="stagebtn ${r.clue?'done':''}" id="clueBtn"><span class="num">🕵️</span>
        <span style="min-width:0"><span class="t">몸풀기 · 단서 탐정</span><span class="k">한 문장 보고 짐작하기</span></span><span class="stk" aria-hidden="true">${r.clue?'⭐':''}</span></button>` : ''}
      ${u.texts.map((x,i)=>`
        <button class="stagebtn ${r.done[x.id]?'done':''}" data-t="${i}"><span class="num">${x.e}</span>
          <span style="min-width:0"><span class="t">${i+1}. ${esc(x.t)}</span><span class="k">${x.kind==='이야기'?'📖 이야기글':'🔎 지식글'}</span></span>
          <span class="stk" aria-hidden="true">${r.done[x.id]?'⭐':''}</span></button>`).join('')}
    </div>`;
  if(u.clues) $('#clueBtn').onclick = ()=>r3Clue(u);
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
      if(c.dataset.k===a){ locked=true; c.classList.add('right'); good(c); await sayOne(a); await wait(450); i++; i<rounds.length ? show() : r3Done(u, null); }
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
    $('#ok').onclick = ()=>{ good($('#ok')); step++; ask(0); };
  }
  /* 4. 질문 — runs x.qs in order, then 내 생각 */
  function ask(n){
    if(n >= x.qs.length) return mine();
    const q = x.qs[n], next = ()=>ask(n+1);
    ({choice:qChoice, clue:qClue, order:qOrder, fill:qFill, punct:qPunct})[q.k](q, next);
  }
  const tag = t => `<div class="r3q"><span class="tag3">${esc(t)}</span></div>`;
  function cardsFor(opts, ans, onRight, onSay){
    let locked=false;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.k===ans){ locked=true; c.classList.add('right'); good(c); await onSay(c); await wait(400); onRight(); }
      else { c.classList.add('wrong'); bad(c); }
    });
  }
  function qChoice(q, next){
    const order = shuffle(q.o.map((o,k)=>[o, q.oe ? q.oe[k] : '']));
    stage.innerHTML = `${bar()}${textBox('mini')}${tag(q.lab)}${bear(esc(q.q))}
      <div class="cards three">${order.map(([o,e])=>`<button class="card wordonly" data-k="${esc(o)}">${e?`<span class="tface" aria-hidden="true">${e}</span>`:''}<span class="tw ko-w r3opt">${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=> R3INTRO[q.lab] ? sayAll(R3INTRO[q.lab], q.q) : sayAll(q.q); play(); $('#again').onclick = play;
    cardsFor(q.o, q.a, next, ()=>sayOne(q.a));
  }
  /* tap the sentence that holds the clue / reason / feeling */
  function qClue(q, next){
    stage.innerHTML = `${bar()}${tag('콕 짚기')}${bear(esc(q.q))}${textBox('tap')}
      <div class="r3why" id="why" hidden></div>
      <div class="row"><button class="big go" id="nx" hidden>다음 ➜</button></div>`;
    const play = ()=>sayOne(q.q); play(); $('#again').onclick = play;
    let done=false;
    stage.querySelectorAll('.r3s').forEach(e=>e.onclick=async ()=>{
      if(done) return;
      if(q.clue.includes(+e.dataset.i)){
        done=true; good(e);
        stage.querySelectorAll('.r3s').forEach(z=>z.classList.toggle('clue', q.clue.includes(+z.dataset.i)));
        $('#why').hidden=false; $('#why').innerHTML = `💡 ${esc(q.why)}`;
        await sayOne('맞아요!'); await wait(200); await say(q.why);
        $('#nx').hidden=false;
      }else{ bad(e); }
    });
    $('#nx').onclick = next;
  }
  /* put tiles in order: word blocks, sentences, or picture cards */
  function qOrder(q, next){
    const items = q.items.map((it,k)=>({k, e: Array.isArray(it)?it[0]:'', t: Array.isArray(it)?it[1]:it}));
    const words = items.every(it=>!it.e && it.t.length<=8);
    let at = 0;
    stage.innerHTML = `${bar()}${tag(words?'문장 만들기':'차례대로')}${bear(esc(q.q))}
      <div class="r3slots ${words?'words':''}">${items.map((_,k)=>`<div class="r3slot" id="sl${k}"><span class="sn">${k+1}</span></div>`).join('')}</div>
      <div class="r3tiles ${words?'words':''}">${shuffle(items).map(it=>`<button class="r3tile" data-k="${it.k}">${it.e?`<span class="te">${it.e}</span>`:''}<span>${esc(it.t)}</span></button>`).join('')}</div>`;
    const play = ()=>sayOne(q.q); play(); $('#again').onclick = play;
    stage.querySelectorAll('.r3tile').forEach(b=>b.onclick=async ()=>{
      if(b.disabled) return;
      const it = items[+b.dataset.k];
      if(it.k===at){
        b.disabled = true; b.classList.add('used'); good(b);
        const sl = $('#sl'+at); sl.classList.add('on'); sl.innerHTML = `${it.e?`<span class="te">${it.e}</span>`:''}<span>${esc(it.t)}</span>`;
        at++;
        if(at===items.length){ await wait(200); if(q.full){ await sayOne(q.full); } else { await sayOne('잘 만들었어요!'); } await wait(400); next(); }
        else sayOne(it.t);
      }else bad(b);
    });
  }
  /* choose the joining word between two sentences (text hidden) */
  function qFill(q, next){
    stage.innerHTML = `${bar()}${tag('이어 주는 말')}${bear(esc(q.q))}
      <div class="r3text one"><span class="r3s">${esc(q.before)}</span> <span class="blank-w" id="bw">　　</span> <span class="r3s">${esc(q.after)}</span></div>
      <div class="cards three">${shuffle(q.o).map(o=>`<button class="card wordonly" data-k="${esc(o)}"><span class="tw ko-w r3opt">${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayOne(q.q); play(); $('#again').onclick = play;
    cardsFor(q.o, q.a, next, async ()=>{ $('#bw').textContent=q.a; $('#bw').classList.add('got'); await sayOne(q.full); });
  }
  /* pick . ? ! for a sentence (text hidden so the mark isn't given away) */
  function qPunct(q, next){
    const P = [['.','마침표'],['?','물음표'],['!','느낌표']];
    stage.innerHTML = `${bar()}${tag('문장 부호')}${bear(esc(q.q))}
      <div class="r3text one"><span class="r3s">${esc(q.sent)}</span><span class="blank-w pm" id="bw">　</span></div>
      <div class="cards three">${P.map(([m,n])=>`<button class="card wordonly" data-k="${m}"><span class="pmk">${m}</span><span class="tw ko-w r3opt">${n}</span></button>`).join('')}</div>`;
    const play = ()=>sayOne(q.q); play(); $('#again').onclick = play;
    cardsFor(P.map(p=>p[0]), q.a, next, async ()=>{ $('#bw').textContent=q.a; $('#bw').classList.add('got'); await sayOne(q.full); });
  }
  function mine(){
    stage.innerHTML = `${bar()}${tag('내 생각')}
      <div class="plates" aria-hidden="true">👩‍👧 💬</div>${bear(esc(x.q3))}
      <p class="guide">정답은 없어요. 엄마랑 이야기를 나눈 다음 눌러요</p>
      <div class="row"><button class="big go" id="nx">다 말했어요 ➜</button></div>`;
    const play = ()=>sayAll('엄마랑 이야기해 봐요!', x.q3); play(); $('#again').onclick = play;
    $('#nx').onclick = ()=>{ addStar(); go(s5); };
  }
  /* 5. 다시 말해요 — text hidden; mom ticks each point the child covered */
  function s5(){
    const pts = (u.retell || K3.retell)[x.kind];
    stage.innerHTML = `${bar()}<div class="plates" aria-hidden="true">${x.e} 🗣️</div>
      ${bear('엄마한테 이 글을 다시 말해 줘요!')}
      <div class="r3retell">${pts.map((p,k)=>`<button class="r3pt" data-k="${k}"><span class="ck">○</span>${esc(p)}</button>`).join('')}</div>
      <p class="guide">아이가 말한 것을 엄마가 눌러 주세요 · <button class="small" id="peek">📄 글 보기</button></p>
      <div id="peekBox" hidden>${textBox('mini')}</div>
      <div class="row"><button class="big go" id="fin">끝! 🎉</button></div>`;
    const play = ()=>sayAll('엄마한테 이 글을 다시 말해 줘요!'); play(); $('#again').onclick = play;
    stage.querySelectorAll('.r3pt').forEach(b=>b.onclick=()=>{ if(b.classList.contains('on')) return; b.classList.add('on'); b.querySelector('.ck').textContent='✔'; ding(); sayOne(pts[+b.dataset.k]); });
    $('#peek').onclick = ()=>{ $('#peekBox').hidden = !$('#peekBox').hidden; };
    $('#fin').onclick = ()=>r3Done(u, x);
  }
  s1();
}

function r3Done(u, x){
  const r = r3State(); if(x) r.done[x.id] = true; else r.clue = (r.clue||0) + 1; addStar(3); save();
  const all = x && u.texts.every(t=>r.done[t.id]);
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${all?'🏆':(x?x.e:'🕵️')}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${all?`“${esc(u.t)}” 단원의 글을 모두 읽어서 트로피를 받았어요!`:x?`“${esc(x.t)}” 글을 다섯 걸음으로 다 읽었어요!`:'단서 탐정 끝! 당연한 것을 당연하게 읽었어요.'}</p></div>
    <div class="row"><button class="big alt" id="toU">⬅️ ${esc(u.t)}</button>${x && !all ? `<button class="big go" id="nextT">다음 글 ➜</button>` : ''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉🔎📖');
  koPraise(); $('#toU').onclick = ()=>r3Unit(u);
  if($('#nextT')){ const nx = u.texts.find(t=>!r.done[t.id]) || u.texts[(u.texts.indexOf(x)+1)%u.texts.length]; $('#nextT').onclick = ()=>r3Lesson(u, nx); }
}

(()=>{ const st = document.createElement('style'); st.textContent = `
.r3num{font-family:var(--f-ko);font-weight:700;color:var(--berry)}
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
.r3opt{font-size:clamp(19px,3.2vmin,27px)!important;word-break:keep-all}
.pmk{font-family:var(--f-display);font-weight:700;font-size:clamp(44px,8vmin,64px);line-height:1;color:var(--berry)}
.blank-w.pm{min-width:1.2em}
.r3why{font-family:var(--f-ko);font-size:clamp(20px,3.4vmin,28px);background:#FFF4CC;border-radius:20px;padding:14px 22px;max-width:min(760px,100%)}
.r3retell{display:flex;flex-direction:column;gap:12px;width:min(620px,100%)}
.r3pt{background:var(--card);border-radius:22px;box-shadow:var(--shadow);padding:18px 22px;font-family:var(--f-ko);font-size:clamp(22px,3.6vmin,30px);text-align:left;display:flex;gap:14px;align-items:center}
.r3pt .ck{font-size:1.2em;color:var(--ink-soft)}
.r3pt.on{background:#DDF6E7}.r3pt.on .ck{color:#1E7547}
.r3slots{display:flex;flex-direction:column;gap:10px;width:min(760px,100%)}
.r3slots.words{flex-direction:row;flex-wrap:wrap;justify-content:center}
.r3slot{min-height:58px;border:3px dashed var(--ink-soft);border-radius:18px;display:flex;align-items:center;gap:12px;padding:8px 16px;font-family:var(--f-ko);font-size:clamp(19px,3.2vmin,26px);background:rgba(255,253,247,.45);text-align:left;word-break:keep-all}
.r3slots.words .r3slot{min-width:92px;justify-content:center}
.r3slot .sn{font-family:var(--f-display);font-weight:700;color:var(--ink-soft)}
.r3slot.on{border-style:solid;border-color:var(--good);background:#DDF6E7}
.r3tiles{display:flex;flex-direction:column;gap:10px;width:min(760px,100%)}
.r3tiles.words{flex-direction:row;flex-wrap:wrap;justify-content:center}
.r3tile{background:var(--card);border-radius:18px;box-shadow:var(--shadow);padding:12px 18px;font-family:var(--f-ko);font-size:clamp(19px,3.2vmin,26px);display:flex;align-items:center;gap:12px;text-align:left;word-break:keep-all}
.r3tile.used{opacity:.25}
.te{font-size:1.5em;line-height:1}
`; document.head.appendChild(st); })();
