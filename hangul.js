/* ===== 한글 놀이터 (uses helpers from the main page script) ===== */
const KO = window.KODATA || {themes:[]};
const koTheme = id => KO.themes.find(t=>t.id===id);
const KG = [
  {id:'learn',    t:'새 낱말 카드', k:'그림 보고 뜻 알아보기',        e:'📖'},
  {id:'memory',   t:'짝꿍 찾기',   k:'그림과 낱말 짝 맞추기',        e:'🃏'},
  {id:'balloon',  t:'빈칸 풍선',   k:'빈칸에 맞는 글자 풍선 터뜨리기', e:'🎈'},
  {id:'poke',     t:'글자 콕!',    k:'들리는 글자를 찾아 콕',        e:'👆'},
  {id:'trace',    t:'따라 쓰기',   k:'손가락으로 낱말 따라 쓰기',     e:'✏️'},
  {id:'riddle',   t:'수수께끼',    k:'뜻 듣고 낱말 맞히기',          e:'❓'},
  {id:'sentence', t:'문장 빈칸',   k:'문장에 알맞은 낱말 고르기',     e:'📝'}
];
const koDone = (th,g) => !!koState().done[th.id+':'+g];
const koCount = th => KG.filter(g=>koDone(th,g.id)).length;
function collect(w){ koState().words[w.w] = true; save(); }

/* ---------- Hangul syllable helpers ---------- */
const HB = 0xAC00;
function dec(ch){ const c = ch.charCodeAt(0) - HB; if(c<0 || c>11171) return null; return [Math.floor(c/588), Math.floor((c%588)/28), c%28]; }
const com = (a,b,c) => String.fromCharCode(HB + a*588 + b*28 + c);
/* vowel look-alikes (ㅏ↔ㅓ, ㅗ↔ㅜ, ㅡ↔ㅣ …) and consonant families (ㄱㄲㅋ, ㄷㄸㅌ, ㅂㅃㅍ …) */
const JUNG_SW = {0:[4,8],4:[0,13],8:[13,4],13:[8,18],18:[20,13],20:[18,4],1:[5,0],5:[1,4],2:[6,0],6:[2,4],12:[17,8],17:[12,13],9:[14,8],14:[9,13],10:[15],15:[10],11:[16],16:[11],19:[20,18],3:[7],7:[3]};
const CHO_G = [[0,1,15],[3,4,16],[7,8,17],[9,10],[12,13,14],[2,5],[6,7],[11,18]];
function confusers(s){
  const d = dec(s); if(!d) return [];
  const [a,b,c] = d;
  const vowel = (JUNG_SW[b]||[]).map(v=>com(a,v,c)).filter(x=>x!==s);
  const other = new Set();
  CHO_G.filter(g=>g.includes(a)).forEach(g=>g.forEach(v=>{ if(v!==a) other.add(com(v,b,c)); }));
  if(c){ other.add(com(a,b,0)); [4,21,8,16,1].forEach(j=>{ if(j!==c) other.add(com(a,b,j)); }); }
  else { other.add(com(a,b,4)); other.add(com(a,b,21)); }
  const pick = [];
  if(vowel.length) pick.push(shuffle(vowel)[0]);
  for(const o of shuffle([...other])){ if(pick.length>=2) break; if(o!==s && !pick.includes(o)) pick.push(o); }
  return pick;
}
function bclass(w){ const d = dec(w[w.length-1]); if(!d || !d[2]) return 0; return d[2]===8 ? 2 : 1; }   // no 받침 / ㄹ / other
/* easy & hard words interleaved so a quick win comes every couple of turns */
function koRounds(th, n, filt){
  const ok = w => !filt || filt(w);
  const e = shuffle(th.words.filter(w=>!w.h && ok(w))), h = shuffle(th.words.filter(w=>w.h && ok(w)));
  const pat = ['h','e','h','h','e','h','e','h','h','e','h','e'], out = [];
  for(const p of pat){ if(out.length>=n) break; const src = p==='e' ? (e.length?e:h) : (h.length?h:e); if(src.length) out.push(src.shift()); }
  return out;
}
const qWord = th => th.who ? '누구일까요?' : '무엇일까요?';
async function koPraise(){ const n=(state.name||'').trim().toLowerCase(); if(n==='daisy'||n==='데이지') return say('데이지, 잘했어요!'); return say('잘했어요!'); }

/* ---------- screens ---------- */
function koHome(){
  curLang = 'ko'; updateBar();
  nav('한글 놀이터', landing);
  const ks = koState(), total = KO.themes.reduce((a,t)=>a+t.words.length,0), got = Object.keys(ks.words).length;
  stage.innerHTML = `
    <div class="hero"><h1>한글 놀이터</h1><p>주제를 골라요</p></div>
    <div class="grid2">
      ${KO.themes.map(t=>`
        <button class="weekbtn" data-t="${t.id}">
          <span class="wem" aria-hidden="true">${t.e}</span>
          <span style="min-width:0"><span class="t">${esc(t.t)}</span><span class="k">낱말 ${t.words.length}개</span></span>
          <span class="meter">${ks.trophies[t.id]?'🏆':'<b>⭐</b>'}${koCount(t)}/${KG.length}</span>
        </button>`).join('')}
      <button class="weekbtn review" id="dogamBtn">
        <span class="wem" aria-hidden="true">📚</span>
        <span style="min-width:0"><span class="t">단어 도감</span><span class="k">모은 낱말 카드 보기</span></span>
        <span class="meter"><b>${got}</b>/${total}</span>
      </button>
    </div>`;
  stage.querySelectorAll('.weekbtn[data-t]').forEach(b=>b.onclick=()=>koMenu(b.dataset.t));
  $('#dogamBtn').onclick = dogam;
}

async function koMenu(id){
  const th = koTheme(id);
  curLang = 'ko'; updateBar();
  nav(th.t, koHome);
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await loadAudio(id);
  if($('#barName').textContent !== th.t) return;
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">${th.e}</div><h1>${esc(th.t)}</h1><p>하고 싶은 놀이를 골라요</p></div>
    <div class="grid2">
      ${KG.map(g=>`
        <button class="stagebtn ${koDone(th,g.id)?'done':''}" data-g="${g.id}">
          <span class="num">${g.e}</span>
          <span style="min-width:0"><span class="t">${g.t}</span><span class="k">${g.k}</span></span>
          <span class="stk" aria-hidden="true">${koDone(th,g.id)?'⭐':''}</span>
        </button>`).join('')}
    </div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>KGAME[b.dataset.g](th));
}
function koNav(th, gid){ const g=KG.find(x=>x.id===gid); nav(`${th.t} · ${g.t}`, ()=>koMenu(th.id)); }

function koReward(th, gid, words){
  const ks = koState(); ks.done[th.id+':'+gid] = true;
  const all = KG.every(g=>ks.done[th.id+':'+g.id]); const newTrophy = all && !ks.trophies[th.id];
  if(all) ks.trophies[th.id] = true;
  save();
  const i = KG.findIndex(g=>g.id===gid), sticker = (words && words.length ? shuffle(words)[0].e : th.e);
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':sticker}</div>
      <h2>잘했어요, <span id="rwName"></span>!</h2>
      <p class="guide">${newTrophy?`"${esc(th.t)}" 놀이를 모두 끝내서 트로피를 받았어요!`:`스티커 ${sticker} 를 받았어요! (${KG[i].t})`}</p></div>
    <div class="row"><button class="big alt" id="toMenu">⬅️ ${esc(th.t)}</button>${i<KG.length-1?`<button class="big go" id="nextG">다음: ${KG[i+1].t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨'+sticker);
  (async()=>{ const my=++speakToken; await koPraise(); if(my!==speakToken) return; await wait(200); say(newTrophy?'트로피를 받았어요!':'스티커를 받았어요!'); })();
  $('#toMenu').onclick = ()=>koMenu(th.id);
  if(i<KG.length-1) $('#nextG').onclick = ()=>KGAME[KG[i+1].id](th);
}
const good = (el)=>{ ding(); addStar(); if(el) burstAt(el); };
const bad  = (el)=>{ boop(); if(el) shake(el); };
const koWord = (w, cls='') => `<div class="koword ${cls}">${esc(w)}</div>`;

/* 0. 새 낱말 카드 — the hard words, with sound and meaning */
function koLearn(th){
  koNav(th,'learn'); const list = shuffle(th.words.filter(w=>w.h)); let i=0;
  function show(){
    const w = list[i]; collect(w);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${list.length}</div>
      <button id="picBtn" aria-label="다시 듣기">${pic(w.e,'','md')}</button>
      <div class="wordcard">${koWord(w.w,'mainw')}</div>
      <div class="bubble wrap ko-s">${esc(w.m)}</div>
      <div class="row"><button class="big alt" id="again">🔊 다시 듣기</button><button class="big go" id="next">${i<list.length-1?'다음 ➜':'끝! 🎉'}</button></div>`;
    const play = ()=>sayAll(w.w, w.m);
    play(); $('#again').onclick = play; $('#picBtn').onclick = play;
    $('#next').onclick = ()=>{ addStar(); i++; i<list.length ? show() : koReward(th,'learn',list); };
  }
  show();
}

/* 1. 짝꿍 찾기 — flip cards, match picture with word; 2 rounds × 3 pairs; sound only after a match */
function koMemory(th){
  koNav(th,'memory');
  const all = koRounds(th, 6), R = 2, per = 3;
  let round = 0;
  function show(){
  const words = all.slice(round*per, round*per+per);
  const cards = shuffle(words.flatMap((w,n)=>[{n,w,type:'pic'},{n,w,type:'word'}]));
  let first=null, lock=false, matched=0;
  stage.innerHTML = `
    <div class="progress">라운드 ${round+1} / ${R} · 그림과 낱말 짝을 찾아요!</div>
    <div class="mgrid three">${cards.map((c,k)=>`
      <button class="mcard" data-k="${k}" aria-label="card">
        <span class="back" aria-hidden="true">🐻</span>
        <span class="front">${c.type==='pic' ? `<span class="em">${c.w.e}</span>` : `<span class="mw ${[...c.w.w].length>=5?'xs':[...c.w.w].length>=4?'s':''}">${esc(c.w.w)}</span>`}</span>
      </button>`).join('')}</div>`;
  stage.querySelectorAll('.mcard').forEach(el=>el.onclick=async ()=>{
    const c = cards[+el.dataset.k];
    if(lock || el.classList.contains('open')) return;
    el.classList.add('open');
    if(!first){ first={c,el}; return; }
    const a = first; first = null;
    if(a.c.n===c.n && a.c.type!==c.type){
      a.el.classList.add('matched'); el.classList.add('matched'); good(el); collect(c.w); matched++;
      lock = true; await say(c.w.w); lock = false;
      if(matched===words.length){
        await wait(500); round++;
        if(round<R){ fanfare(); burst(innerWidth/2, innerHeight/2); stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🃏</div><h2>라운드 ${round} 성공!</h2></div><div class="row"><button class="big go" id="nextR">라운드 ${round+1} ➜</button></div>`; $('#nextR').onclick = show; }
        else koReward(th,'memory',all);
      }
    }else{
      lock = true; await wait(900); a.el.classList.remove('open'); el.classList.remove('open'); lock = false;
    }
  });
  }
  show();
}

/* 2. 빈칸 풍선 — one syllable hidden; pop the right balloon (look-alike decoys) */
function koBalloon(th){
  koNav(th,'balloon'); const rounds = koRounds(th, 8); let i=0;
  function show(){
    const w = rounds[i], syl = [...w.w], bi = Math.floor(Math.random()*syl.length), ans = syl[bi];
    const opts = shuffle([ans, ...confusers(ans)]);
    const cols = shuffle(['#FF7AA2','#5BB8FF','#FFC94D','#8BD17C','#B98CFF']);
    let locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="row">${pic(w.e,'','md')}<button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="sylrow">${syl.map((s,k)=>k===bi?`<span class="syl blank" id="bl">?</span>`:`<span class="syl">${esc(s)}</span>`).join('')}</div>
      <div class="balloons">${opts.map((o,k)=>`
        <button class="balloon" data-o="${esc(o)}" style="--bc:${cols[k]};--d:${k*0.4}s"><span>${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayOne(w.w);   /* say the word once so the child knows what to fill */
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.balloon').forEach(b=>b.onclick=async ()=>{
      if(locked || b.classList.contains('gone')) return;
      if(b.dataset.o===ans){
        locked=true; b.classList.add('pop'); $('#bl').textContent=ans; $('#bl').classList.remove('blank'); $('#bl').classList.add('got');
        good(b); collect(w); await say(w.w); await wait(450);
        i++; i<rounds.length ? show() : koReward(th,'balloon',rounds);
      }else{ b.classList.add('gone'); bad(null); }
    });
  }
  show();
}

/* 3. 글자 콕! — hear one syllable, find it inside the word (통나무 → 통) */
function koPoke(th){
  koNav(th,'poke');
  const rounds = koRounds(th, 8, w=>{ const s=[...w.w]; return s.length>=2 && s.some(x=>s.filter(y=>y===x).length===1); });
  let i=0;
  function show(){
    const w = rounds[i], syl = [...w.w];
    const uniq = syl.map((s,k)=>k).filter(k=>syl.filter(y=>y===syl[k]).length===1);
    const ti = uniq[Math.floor(Math.random()*uniq.length)], target = syl[ti];
    let locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble ko-s">이 글자를 찾아봐!</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      ${pic(w.e,'','md')}
      <div class="sylrow">${syl.map((s,k)=>`<button class="syl tap" data-k="${k}">${esc(s)}</button>`).join('')}</div>`;
    const play = ()=>sayAll('이 글자를 찾아봐!', target);
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.syl.tap').forEach(t=>t.onclick=async ()=>{
      if(locked) return;
      if(+t.dataset.k===ti){
        locked=true; t.classList.add('got'); good(t); collect(w);
        await say(target); await wait(200); await say(w.w); await wait(400);
        i++; i<rounds.length ? show() : koReward(th,'poke',rounds);
      }else{ bad(t); }
    });
  }
  show();
}

/* 4. 따라 쓰기 — trace the grey word with a finger; checks how much of it was covered */
function koTrace(th){
  koNav(th,'trace');
  const rounds = koRounds(th, 5, w=>[...w.w].length<=3); let i=0, color='#E4407A';
  async function show(){
    const w = rounds[i];
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      ${pic(w.e,'','md')}
      <div class="tracebox" id="tb"><canvas id="cg"></canvas><canvas id="cu"></canvas></div>
      <div class="row">
        ${['#E4407A','#2F74E0','#2FA866','#F29D1F'].map(c=>`<button class="pen ${c===color?'on':''}" data-c="${c}" style="--pc:${c}" aria-label="pen color"></button>`).join('')}
        <button class="big alt" id="clr">🧽 지우기</button><button class="big go" id="done">다 썼어요!</button>
      </div>
      <div class="hint ko-s" id="hint"></div>`;
    const tb=$('#tb'), cg=$('#cg'), cu=$('#cu'), dpr=Math.max(1, window.devicePixelRatio||1);
    const W=tb.clientWidth, H=tb.clientHeight;
    [cg,cu].forEach(c=>{ c.width=W*dpr; c.height=H*dpr; c.getContext('2d').scale(dpr,dpr); });
    const n=[...w.w].length, fs=Math.min(H*0.78, (W*0.88)/n);
    const font = `${fs}px "Gowun Dodum", "Apple SD Gothic Neo", sans-serif`;
    try{ await document.fonts.load(font, w.w); }catch(e){}
    const drawGuide = (ctx, col)=>{ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=fs*0.11; ctx.lineJoin='round'; ctx.strokeText(w.w,W/2,H/2+fs*0.04); ctx.fillText(w.w,W/2,H/2+fs*0.04); };
    drawGuide(cg.getContext('2d'), '#DCE2EC');
    const mask = document.createElement('canvas'); mask.width=cg.width; mask.height=cg.height;
    const mctx = mask.getContext('2d'); mctx.scale(dpr,dpr); drawGuide(mctx,'#000');
    const ux = cu.getContext('2d'); let drawing=false, last=null;
    const pt = e=>{ const r=cu.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
    cu.onpointerdown = e=>{ drawing=true; last=pt(e); cu.setPointerCapture(e.pointerId); ux.fillStyle=color; ux.beginPath(); ux.arc(last[0],last[1],fs*0.065,0,Math.PI*2); ux.fill(); };
    cu.onpointermove = e=>{ if(!drawing) return; const p=pt(e); ux.strokeStyle=color; ux.lineWidth=fs*0.13; ux.lineCap='round'; ux.lineJoin='round'; ux.beginPath(); ux.moveTo(last[0],last[1]); ux.lineTo(p[0],p[1]); ux.stroke(); last=p; };
    cu.onpointerup = cu.onpointercancel = ()=>{ drawing=false; };
    stage.querySelectorAll('.pen').forEach(p=>p.onclick=()=>{ color=p.dataset.c; stage.querySelectorAll('.pen').forEach(q=>q.classList.toggle('on', q===p)); });
    $('#clr').onclick = ()=>{ ux.clearRect(0,0,W,H); $('#hint').textContent=''; };
    $('#done').onclick = async ()=>{
      const g = mctx.getImageData(0,0,mask.width,mask.height).data, u = ux.getImageData(0,0,cu.width,cu.height).data;
      let gp=0, cov=0, up=0, out=0; const step=3*Math.round(dpr)*4, rowStep=3*Math.round(dpr);
      for(let y=0; y<mask.height; y+=rowStep){ for(let x=0; x<mask.width; x+=rowStep){ const k=(y*mask.width+x)*4+3; const gi=g[k]>40, ui=u[k]>40; if(gi){gp++; if(ui) cov++;} if(ui){up++; if(!gi) out++;} } }
      const c = gp ? cov/gp : 0, o = up ? out/up : 1;
      if(c>=0.55 && o<=0.55){
        good($('#tb')); collect(w); await say(w.w); await wait(500);
        i++; i<rounds.length ? show() : koReward(th,'trace',rounds);
      }else{ bad($('#tb')); $('#hint').textContent='회색 글자 위를 꼼꼼히 따라 써 볼까?'; say('조금 더 따라 써 볼까?'); }
    };
  }
  show();
}

/* 5. 수수께끼 — hear the meaning, pick the word */
function koRiddle(th){
  koNav(th,'riddle'); const rounds = koRounds(th, 8); let i=0;
  function show(){
    const w = rounds[i]; let locked=false;
    const opts = shuffle([w, ...shuffle(th.words.filter(x=>x!==w)).slice(0,2)]);
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble wrap ko-s">${esc(w.m)}<br><b>${qWord(th)}</b></div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="cards three">${opts.map(o=>`
        <button class="card wordonly" data-w="${esc(o.w)}"><span class="tface hintpic" aria-hidden="true" hidden>${o.e}</span><span class="tw ko-w">${esc(o.w)}</span></button>`).join('')}</div>
      <div class="row"><button class="big alt" id="hintBtn">💡 그림 힌트</button></div>`;
    const play = ()=>sayAll(w.m, qWord(th));
    play(); $('#again').onclick = play;
    let hintT = null;   /* pictures show for 1 s, then back to text only */
    $('#hintBtn').onclick = ()=>{
      const ps = stage.querySelectorAll('.hintpic'); ps.forEach(p=>p.hidden=false); clearTimeout(hintT);
      hintT = setTimeout(()=>ps.forEach(p=>p.hidden=true), 1000);
    };
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.w===w.w){ locked=true; c.classList.add('right'); good(c); collect(w); await say(w.w); await wait(450); i++; i<rounds.length ? show() : koReward(th,'riddle',rounds); }
      else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

/* 6. 문장 빈칸 — read the sentence, choose the word that makes sense (word cards only, no pictures) */
function koSentence(th){
  koNav(th,'sentence'); const rounds = koRounds(th, 8); let i=0;
  const others = KO.themes.filter(t=>t.id!==th.id).flatMap(t=>t.words);
  function show(){
    const w = rounds[i]; let locked=false;
    const same = shuffle(others.filter(o=>bclass(o.w)===bclass(w.w) && !w.x.includes(o.w))).slice(0,2);
    const opts = shuffle([w, ...same]);
    const k = w.x.indexOf(w.w);
    const sent = esc(w.x.slice(0,k)) + `<span class="blank-w" id="bw">　　</span>` + esc(w.x.slice(k+w.w.length));
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐻</div><div class="bubble wrap ko-s sent">${sent}</div><button class="iconbtn" id="again" aria-label="다시 듣기">🔊</button></div>
      <div class="cards three">${opts.map(o=>`<button class="card wordonly" data-w="${esc(o.w)}"><span class="tw ko-w">${esc(o.w)}</span></button>`).join('')}</div>`;
    const play = ()=>sayAll(w.x);   /* read the whole sentence incl. the answer word; child finds that word */
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.w===w.w){
        locked=true; c.classList.add('right'); $('#bw').textContent=w.w; $('#bw').classList.add('got');
        good(c); collect(w); await say(w.x); await wait(450); i++; i<rounds.length ? show() : koReward(th,'sentence',rounds);
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

const KGAME = {learn:koLearn, memory:koMemory, balloon:koBalloon, poke:koPoke, trace:koTrace, riddle:koRiddle, sentence:koSentence};

/* 단어 도감 — every word collected so far; tap a card to hear it */
function dogam(){
  curLang='ko'; updateBar();
  nav('단어 도감', koHome);
  const ks = koState();
  stage.innerHTML = `
    <div class="hero"><h1>단어 도감 📚</h1><p>놀이에서 맞힌 낱말이 여기에 모여요 · ${Object.keys(ks.words).length}개</p></div>
    ${KO.themes.map(t=>`
      <div class="dg-sec"><div class="dg-t">${t.e} ${esc(t.t)}</div>
        <div class="dgrid">${t.words.map(w=> ks.words[w.w]
          ? `<button class="dcard" data-t="${t.id}" data-w="${esc(w.w)}"><span class="em">${w.e}</span><span class="mw ${[...w.w].length>=5?'xs':[...w.w].length>=4?'s':''}">${esc(w.w)}</span></button>`
          : `<div class="dcard locked" aria-label="아직 못 모은 낱말"><span class="em">❔</span></div>`).join('')}</div></div>`).join('')}`;
  stage.querySelectorAll('.dcard[data-w]').forEach(b=>b.onclick=async ()=>{
    const t = koTheme(b.dataset.t), w = t.words.find(x=>x.w===b.dataset.w);
    await loadAudio(t.id); sayAll(w.w, w.m);
  });
}
