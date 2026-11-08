/* ===== 한자 놀이터 Level 2 · 천자문 — goal: see the character, know its 음 ===== */
const hjL2 = () => HJ.levels.find(l=>l.id==='L2');
const hjHun = ch => ch.h.split(' ').slice(0,-1).join(' ');            /* "하늘 천" → "하늘" */
const hjYs = ch => ch.y2 ? `${ch.y}(${ch.y2})` : ch.y;                  /* display of the 음, with 두음 form */
const hjSyls = ch => [ch.y, ch.y2].filter(Boolean);
const hjVerseOf = (u, ch) => u.vs.find(v=>v.c.includes(ch.c));
/* a word with the 음 syllable underlined in red */
const hjWordHtml = (w, k, on=true) => [...w].map((s,j)=> j===k && on ? `<span class="ys">${esc(s)}</span>` : esc(s)).join('');
/* every word in Level 2 (targets and look-alikes), used as decoys */
const hjAllWords = () => { const m = new Map(); hjL2().units.forEach(u=>u.chars.forEach(ch=>[...ch.wd, ...ch.tr].forEach(([w,,e])=>{ if(!m.has(w)) m.set(w,{w,e}); }))); return [...m.values()]; };
/* up to n other characters whose 음 differs from ch (so no two options sound alike) */
function hjOtherEum(ch, pool, n){
  const seen = new Set(hjSyls(ch)), out = [];
  for(const x of shuffle(pool)){ if(x===ch || hjSyls(x).some(s=>seen.has(s))) continue; hjSyls(x).forEach(s=>seen.add(s)); out.push(x); if(out.length===n) break; }
  return out;
}
const hjNextBtn = (label='다음 ➜') => `<div class="row"><button class="big go" id="next">${label}</button></div>`;

/* 1. 음 카드 — the verse on top, the character big, the 음 bigger than the 훈 */
function hjEcard(u){
  hjNav(u,'ecard'); const list = u.chars; let i=0;
  function show(){
    const ch = list[i], v = hjVerseOf(u, ch); hjCollect(ch);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${list.length}</div>
      <div class="vstrip" aria-label="${esc(v.r)}">${[...v.c].map(c=>`<span class="vc ${c===ch.c?'on':''}">${c}</span>`).join('')}</div>
      <button class="eumcard" id="ec" aria-label="다시 듣기"><span class="hjc ehj">${ch.c}</span>
        <span class="eumline"><span class="hun">${esc(hjHun(ch))}</span><span class="eum">${esc(ch.y)}</span></span></button>
      ${ch.note ? `<div class="bubble wrap ko-s">💡 ${esc(ch.note)}</div>` : ''}
      ${ch.wd.length ? `<div class="chips">${ch.wd.map(([w,k,e])=>`<button class="chip2" data-w="${esc(w)}"><span aria-hidden="true">${e}</span><span>${hjWordHtml(w,k)}</span></button>`).join('')}</div>`
        : `<div class="guide">쉬운 낱말이 없는 글자예요. 구절 "${esc(v.r)}" 속에서 기억해요!</div>`}
      <div class="row"><button class="big alt" id="again">🔊 다시 듣기</button><button class="big go" id="next">${i<list.length-1?'다음 ➜':'끝! 🎉'}</button></div>`;
    const play = ()=>sayOne(ch.h);
    play(); $('#again').onclick = play; $('#ec').onclick = play;
    stage.querySelectorAll('.chip2').forEach(b=>b.onclick=()=>sayOne(b.dataset.w));
    $('#next').onclick = ()=>{ addStar(); i++; i<list.length ? show() : hjReward(u,'ecard'); };
  }
  show();
}

/* 2. 음 맞히기 — the character only; options are full 훈음 ("넓을 홍").
   💡 힌트 shows the 훈 ("넓을") under the character. A character answered wrong comes back once more at the end. */
function hjEum(u){
  hjNav(u,'eum'); const Q = shuffle(u.chars), again = new Set(); let i=0;
  function show(){
    const ch = Q[i]; let locked=false, missed=false;
    const opts = shuffle([ch, ...hjOtherEum(ch, u.chars, 3)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${Q.length}</div>
      <div class="eumcard"><span class="hjc ehj">${ch.c}</span>
        <span class="eumline"><span class="hun" id="hun" hidden>${esc(hjHun(ch))}</span><span class="eum q" id="ans">?</span></span></div>
      <button class="big alt" id="hintBtn">💡 힌트</button>
      <div class="cards">${opts.map(o=>`<button class="card wordonly" data-c="${o.c}"><span class="tw ko-w hunopt">${esc(o.h)}</span></button>`).join('')}</div>
      <div class="hint ko-s" id="hint"></div>`;
    $('#hintBtn').onclick = ()=>{ $('#hun').hidden = false; $('#hintBtn').disabled = true; };
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c===ch.c){
        locked=true; c.classList.add('right'); good(c); hjCollect(ch);
        const a=$('#ans'); a.textContent=ch.y; a.classList.remove('q'); $('#hun').hidden=false; $('#hintBtn').disabled=true;
        $('#hint').textContent = ch.h;
        await say(ch.h); await wait(450); i++; i<Q.length ? show() : hjReward(u,'eum');
      }else{
        c.classList.add('wrong'); bad(c);
        if(!missed && !again.has(ch.c)){ missed=true; again.add(ch.c); Q.push(ch); $('.progress').textContent = `${i+1} / ${Q.length} · 틀린 글자는 한 번 더 나와요`; }
      }
    });
  }
  show();
}

/* 3. 낱말 사냥 — "천" 소리가 들어간 낱말을 모두 찾기; then show each word's 한자 */
function hjHunt(u){
  hjNav(u,'hunt');
  const R = shuffle(u.chars.filter(c=>c.wd.length)).slice(0,5), all = hjAllWords(); let i=0;
  function show(){
    const ch = R[i], syls = hjSyls(ch);
    const T = ch.wd.slice(0,3).map(([w,k,e,hz])=>({w,k,e,hz,t:true}));
    const n = T.length>=2 ? 6 : 4;
    const D = shuffle(all.filter(x=>!syls.some(s=>x.w.includes(s)))).slice(0, n-T.length).map(x=>({...x,k:-1}));
    const cards = shuffle([...T, ...D]); let found=0, locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${R.length}</div>
      <div class="huntq"><span class="hjc qhj">${ch.c}</span><span class="eum">${esc(hjYs(ch))}</span></div>
      <div class="bubble wrap ko-s">"<b>${esc(syls.join('" 또는 "'))}</b>" 소리가 들어간 낱말을 모두 찾아요! <span id="cnt">(0 / ${T.length})</span></div>
      <div class="cards three">${cards.map((c,j)=>`<button class="card" data-j="${j}"><span class="tface" aria-hidden="true">${c.e}</span><span class="tw ko-w">${esc(c.w)}</span></button>`).join('')}</div>
      <div id="rv"></div>`;
    sayOne(ch.h);
    stage.querySelectorAll('.card').forEach(el=>el.onclick=async ()=>{
      const c = cards[+el.dataset.j];
      if(locked || el.classList.contains('wrong') || el.classList.contains('right')) return;
      if(!c.t){ el.classList.add('wrong'); bad(el); return; }
      el.classList.add('right'); good(el); el.querySelector('.tw').innerHTML = hjWordHtml(c.w, c.k);
      found++; $('#cnt').textContent = `(${found} / ${T.length})`;
      if(found<T.length){ sayOne(c.w); return; }
      locked = true; hjCollect(ch); await sayOne(c.w); await wait(300);
      $('#rv').innerHTML = `<div class="reveal">${T.map(t=>`<div class="rvline"><span class="ko-w">${hjWordHtml(t.w,t.k)}</span><span class="hjc rvhz">${esc(t.hz)}</span></div>`).join('')}
        <div class="guide">모두 ${ch.c} (${esc(ch.h)})가 들어 있어요!</div></div>${hjNextBtn(i<R.length-1?'다음 ➜':'끝! 🎉')}`;
      $('#next').onclick = ()=>{ i++; i<R.length ? show() : hjReward(u,'hunt'); };
      $('#rv').scrollIntoView({behavior:'smooth', block:'nearest'});
      await say(ch.h);
    });
  }
  show();
}

/* 4. 진짜 친구 — same sound, different character: which word really has 天? */
function hjFriend(u){
  hjNav(u,'friend');
  const R = shuffle(u.chars.filter(c=>c.wd.length && c.tr.length)).slice(0,5); let i=0;
  function show(){
    const ch = R[i]; let locked=false;
    const [w,k,e,hz] = shuffle(ch.wd)[0];
    const opts = shuffle([{w,k,e,hz,t:true}, ...shuffle(ch.tr).slice(0,2).map(([w,k,e,hz])=>({w,k,e,hz}))]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${R.length}</div>
      <div class="huntq"><span class="hjc qhj">${ch.c}</span><span class="hunum">${esc(ch.h)}</span></div>
      <div class="bubble wrap ko-s">소리는 다 "<b>${esc(ch.y)}</b>"! 진짜 <b>${ch.c}</b> (${esc(hjHun(ch))})가 들어간 낱말은?</div>
      <div class="cards ${opts.length===3?'three':'two'}">${opts.map((o,j)=>`<button class="card" data-j="${j}"><span class="tface" aria-hidden="true">${o.e}</span><span class="tw ko-w">${hjWordHtml(o.w,o.k)}</span><span class="hz" hidden>${esc(o.hz)}</span></button>`).join('')}</div>
      <div class="hint ko-s" id="hint"></div>`;
    sayOne(ch.h);
    const reveal = el => el.querySelector('.hz').hidden = false;
    stage.querySelectorAll('.card').forEach(el=>el.onclick=async ()=>{
      const o = opts[+el.dataset.j];
      if(locked || el.classList.contains('wrong')) return;
      if(o.t){
        locked=true; el.classList.add('right'); good(el); hjCollect(ch);
        stage.querySelectorAll('.card').forEach(reveal);
        $('#hint').textContent = `${o.w} = ${o.hz}`;
        await say(o.w); await wait(250); await say(ch.h);
        stage.insertAdjacentHTML('beforeend', hjNextBtn(i<R.length-1?'다음 ➜':'끝! 🎉'));
        $('#next').onclick = ()=>{ i++; i<R.length ? show() : hjReward(u,'friend'); };
      }else{ el.classList.add('wrong'); reveal(el); bad(el); $('#hint').textContent = `${o.w}의 "${[...o.w][o.k]}"는 ${o.hz}`; }
    });
  }
  show();
}

/* 5. 구절 읽기 — per verse: tap the readings in order, then fill one blank; finish with 서당 낭독 */
function hjVerse(u){
  hjNav(u,'verse');
  const chOf = c => u.chars.find(x=>x.c===c);
  const steps = u.vs.flatMap(v=>[{t:'order',v},{t:'blank',v}]); let i=0;
  const prog = () => `<div class="progress">${i+1} / ${steps.length+1}</div>`;
  function show(){ const s = steps[i]; s.t==='order' ? order(s.v) : blank(s.v); }
  const next = () => { i++; i<steps.length ? show() : recite(); };
  function order(v){
    const rd = [...v.r], cs = [...v.c]; let pos=0;
    const extra = hjOtherEum(chOf(cs[0]), hjL2().units.flatMap(x=>x.chars).filter(x=>!rd.includes(x.y)), 1).map(x=>x.y);
    const tiles = shuffle([...rd, ...extra]);
    stage.innerHTML = `${prog()}
      <div class="bubble wrap ko-s">한자를 보고 <b>음</b>을 순서대로 눌러요!</div>
      <div class="vrow">${cs.map((c,j)=>`<div class="vcol"><span class="hjc vhj ${j===0?'cur':''}" id="vh${j}">${c}</span><span class="syl blank" id="sl${j}">?</span></div>`).join('')}</div>
      <div class="sylrow">${tiles.map((t,j)=>`<button class="syl tap" data-j="${j}">${esc(t)}</button>`).join('')}</div>
      <div id="rv"></div>`;
    stage.querySelectorAll('.sylrow .syl').forEach(b=>b.onclick=async ()=>{
      if(pos>=rd.length || b.disabled) return;
      if(tiles[+b.dataset.j]!==rd[pos]){ bad(b); return; }
      b.disabled = true; b.style.visibility='hidden';
      const sl=$('#sl'+pos); sl.textContent=rd[pos]; sl.classList.remove('blank'); sl.classList.add('got'); good(sl);
      $('#vh'+pos).classList.remove('cur'); hjCollect(chOf(cs[pos]));
      const h = chOf(cs[pos]).h; pos++;
      if(pos<rd.length){ $('#vh'+pos).classList.add('cur'); sayOne(h); return; }
      await sayOne(h); await wait(300);
      $('#rv').innerHTML = `<div class="reveal"><div class="rvline"><span class="ko-w">${esc(v.r)}</span></div><div class="guide">${esc(v.m)}</div></div>${hjNextBtn()}`;
      $('#next').onclick = next;
      await say(v.r); await wait(200); await say(v.m);
    });
  }
  function blank(v){
    const cs=[...v.c], k = Math.floor(Math.random()*4), ans = chOf(cs[k]); let locked=false;
    const opts = shuffle([ans, ...shuffle(u.chars.filter(x=>x!==ans)).slice(0,2)]);
    stage.innerHTML = `${prog()}
      <div class="bubble wrap ko-s">빈칸에 들어갈 한자는? <b>${esc(v.r)}</b></div>
      <div class="vrow">${cs.map((c,j)=>`<div class="vcol"><span class="hjc vhj ${j===k?'gap':''}" ${j===k?'id="gap"':''}>${j===k?'?':c}</span><span class="vread">${esc([...v.r][j])}</span></div>`).join('')}</div>
      <div class="cards three">${opts.map(o=>`<button class="card" data-c="${o.c}"><span class="hjc cardhj">${o.c}</span></button>`).join('')}</div>`;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c!==ans.c){ c.classList.add('wrong'); bad(c); return; }
      locked=true; c.classList.add('right'); good(c); hjCollect(ans);
      const g=$('#gap'); g.textContent=ans.c; g.classList.remove('gap'); g.classList.add('cur');
      await say(ans.h); await wait(250); await say(v.r); await wait(500); next();
    });
  }
  function recite(){
    stage.innerHTML = `<div class="progress">서당 낭독 📜</div>
      ${u.vs.map((v,a)=>`<div class="vrow">${[...v.c].map((c,j)=>`<div class="vcol"><span class="hjc vhj" id="rc${a}_${j}">${c}</span><span class="vread">${esc([...v.r][j])}</span></div>`).join('')}</div>`).join('')}
      <div class="guide">훈장님처럼 따라 읽어 봐요!</div>
      <div class="row"><button class="big alt" id="again">🔊 다시 듣기</button><button class="big go" id="fin">끝! 🎉</button></div>`;
    async function play(){
      const my = ++speakToken;
      for(let a=0;a<u.vs.length;a++){ const v=u.vs[a];
        for(let j=0;j<4;j++){ if(my!==speakToken) return; const el=$('#rc'+a+'_'+j); stage.querySelectorAll('.vhj').forEach(x=>x.classList.remove('cur')); el && el.classList.add('cur'); await say(chOf([...v.c][j]).h); await wait(120); }
        if(my!==speakToken) return; await wait(200); await say(v.r); await wait(400);
      }
      stage.querySelectorAll('.vhj').forEach(x=>x.classList.remove('cur'));
    }
    play(); $('#again').onclick = play;
    $('#fin').onclick = ()=>{ ++speakToken; hjReward(u,'verse'); };
  }
  show();
}

/* 6. 번개 읽기 — characters from this and earlier 천자문 units; a 4-second bar; list the slow/missed ones at the end */
async function hjFlash(u){
  hjNav(u,'flash');
  const us = hjL2().units, upto = us.slice(0, us.indexOf(u)+1);
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all(upto.map(x=>loadAudio(x.id)));
  const pool = upto.flatMap(x=>x.chars);
  let Q = []; while(Q.length<10) Q = Q.concat(shuffle(pool)); Q = Q.slice(0,10);
  const miss = new Map(); let i=0, fast=0;
  function show(){
    const ch = Q[i], t0 = performance.now(); let locked=false, wrong=false;
    const opts = shuffle([ch, ...hjOtherEum(ch, pool, 3)]);
    stage.innerHTML = `
      <div class="progress">⚡ ${i+1} / ${Q.length}</div>
      <div class="fbar"><i></i></div>
      <div class="wordcard"><span class="hjc mainhj">${ch.c}</span></div>
      <div class="cards">${opts.map(o=>`<button class="card wordonly" data-c="${o.c}"><span class="tw ko-w eumopt">${esc(hjYs(o))}</span></button>`).join('')}</div>`;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.c!==ch.c){ c.classList.add('wrong'); bad(c); wrong=true; miss.set(ch.c, ch); return; }
      locked=true; c.classList.add('right'); good(c); hjCollect(ch);
      if(!wrong && performance.now()-t0 <= 4000) fast++; else miss.set(ch.c, ch);
      await sayOne(ch.h); await wait(200); i++; i<Q.length ? show() : end();
    });
  }
  function end(){
    const M = [...miss.values()];
    stage.innerHTML = `
      <div class="reward"><div class="medal" aria-hidden="true">⚡</div><h2>번개 ${fast} / ${Q.length}!</h2>
        <p class="guide">${M.length ? '느렸거나 틀린 글자예요. 눌러서 한 번 더 들어요.' : '모두 번개처럼 읽었어요!'}</p></div>
      ${M.length ? `<div class="chips">${M.map(ch=>`<button class="chip2" data-c="${ch.c}"><span class="hjc">${ch.c}</span><span>${esc(ch.h)}</span></button>`).join('')}</div>` : ''}
      ${hjNextBtn('끝! 🎉')}`;
    stage.querySelectorAll('.chip2').forEach(b=>b.onclick=()=>sayOne(pool.find(x=>x.c===b.dataset.c).h));
    $('#next').onclick = ()=>hjReward(u,'flash');
  }
  show();
}

Object.assign(HGAME, {ecard:hjEcard, eum:hjEum, hunt:hjHunt, friend:hjFriend, verse:hjVerse, flash:hjFlash});
