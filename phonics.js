/* ===== Phonics (uses helpers from the main page script + hangul.js) ===== */
const PH = window.PHDATA || {levels:[]};
const phLevel = id => PH.levels.find(l=>l.id===id);
const PG = [
  {id:'flip',  t:'Card Flip',      k:'그림과 낱말 짝 맞추기 · 2라운드', e:'🃏'},
  {id:'props', t:"Bunny's Bag",    k:'토끼가 말한 소품 찾기',          e:'🐰'},
  {id:'hear',  t:'Which One?',     k:'듣고 둘 중 하나 고르기',          e:'👂'},
  {id:'blank', t:'Missing Letter', k:'빈칸에 들어갈 글자 찾기',         e:'🎈'},
  {id:'trace', t:'Trace It',       k:'손가락으로 따라 쓰기',            e:'✏️'},
  {id:'sent',  t:'Fill the Gap',   k:'문장 듣고 낱말 고르기',           e:'📝'}
];
const phDone = (lv,g) => !!phState().done[lv.id+':'+g];
const phCount = lv => PG.filter(g=>phDone(lv,g.id)).length;
const isAlpha = lv => lv.kind==='alpha';
const letterOf = (lv,L) => lv.words.find(x=>x.L===L);
const enSize = w => w.length>=7 ? 'xs' : w.length>=5 ? 's' : '';

function phHome(){
  curLang='ph'; updateBar(); nav('Phonics', enHome);
  const ps = phState();
  stage.innerHTML = `
    <div class="hero"><h1>Phonics</h1><p>단계를 골라요 · 알파벳부터 긴 모음까지</p></div>
    <div class="grid2">
      ${PH.levels.map((l,i)=>`
        <button class="weekbtn" data-l="${l.id}">
          <span class="wem" aria-hidden="true">${l.e}</span>
          <span style="min-width:0"><span class="lbl-s">LEVEL ${i+1}</span><span class="t">${esc(l.t)}</span><span class="k">${esc(l.k)}</span></span>
          <span class="meter">${ps.trophies[l.id]?'🏆':'<b>⭐</b>'}${phCount(l)}/${PG.length}</span>
        </button>`).join('')}
    </div>`;
  stage.querySelectorAll('.weekbtn[data-l]').forEach(b=>b.onclick=()=>phMenu(b.dataset.l));
}

async function phMenu(id){
  const lv = phLevel(id), n = PH.levels.indexOf(lv)+1;
  curLang='ph'; updateBar(); nav(`Level ${n} · ${lv.t}`, phHome);
  const title = $('#barName').textContent;
  stage.innerHTML = `<div class="progress">Loading…</div>`;
  await Promise.all([loadAudio('ph-shared'), loadAudio(id)]);
  if($('#barName').textContent !== title) return;
  stage.innerHTML = `
    <div class="hero"><div class="plates" aria-hidden="true">${lv.e}</div><h1>${esc(lv.t)}</h1><p>Level ${n} · ${esc(lv.k)}</p></div>
    <div class="grid2">
      ${PG.map((g,i)=>`
        <button class="stagebtn ${phDone(lv,g.id)?'done':''}" data-g="${g.id}">
          <span class="num">${i+1}</span>
          <span style="min-width:0"><span class="t">${g.e} ${g.t}</span><span class="k">${g.k}</span></span>
          <span class="stk" aria-hidden="true">${phDone(lv,g.id)?'⭐':''}</span>
        </button>`).join('')}
    </div>
    <div class="guide">엄마 가이드: 1번부터 차례로 하면 좋아요. 🐢 버튼을 누르면 천천히 말해요.</div>`;
  stage.querySelectorAll('.stagebtn').forEach(b=>b.onclick=()=>PGAME[b.dataset.g](lv));
}
function phNav(lv,gid){ const g=PG.find(x=>x.id===gid); nav(`${lv.t} · ${g.t}`, ()=>phMenu(lv.id)); }

function phReward(lv, gid, words){
  const ps = phState(); ps.done[lv.id+':'+gid] = true;
  const all = PG.every(g=>ps.done[lv.id+':'+g.id]); const newTrophy = all && !ps.trophies[lv.id];
  if(all) ps.trophies[lv.id] = true;
  save();
  const i = PG.findIndex(g=>g.id===gid);
  const withPic = (words||[]).filter(w=>w.e), sticker = withPic.length ? shuffle(withPic)[0].e : lv.e;
  stage.innerHTML = `
    <div class="reward"><div class="medal" aria-hidden="true">${newTrophy?'🏆':sticker}</div>
      <h2>Great job, <span id="rwName"></span>!</h2>
      <p class="guide">${newTrophy?`"${esc(lv.t)}" 놀이를 모두 끝내서 트로피를 받았어요!`:`스티커 ${sticker} 를 받았어요! (${PG[i].t})`}</p></div>
    <div class="row"><button class="big alt" id="toMenu">⬅️ ${esc(lv.t)}</button>${i<PG.length-1?`<button class="big go" id="nextG">Next: ${PG[i+1].t} ➜</button>`:''}</div>`;
  $('#rwName').textContent = state.name;
  fanfare(); burst(innerWidth/2, innerHeight/2, '⭐🎉✨'+sticker);
  (async()=>{ await praise('Great job!', n=>`Great job, ${n}!`); await wait(200); say(newTrophy?'You got a trophy!':'You got a sticker!'); })();
  $('#toMenu').onclick = ()=>phMenu(lv.id);
  if(i<PG.length-1) $('#nextG').onclick = ()=>PGAME[PG[i+1].id](lv);
}

/* decoy picker for word cards: similar spellings (hat → hot, hit) */
function nearOpts(lv, w){
  const pool = isAlpha(lv) ? shuffle(lv.words.filter(x=>x!==w).map(x=>x.w)) : shuffle((w.near||[]).slice(0,4));
  return shuffle([w.w, ...pool.slice(0,2)]);
}

/* 1. Card Flip — 2 rounds × 3 pairs; picture ↔ word (alphabet: picture ↔ letter); sound only after a match */
function phFlip(lv){
  phNav(lv,'flip');
  const all = koRounds(lv, 6, w=>!!w.e), R = 2, per = 3; let round = 0;
  const face = w => isAlpha(lv) ? w.L.toUpperCase()+w.L : w.w;
  function show(){
    const words = all.slice(round*per, round*per+per);
    const cards = shuffle(words.flatMap((w,n)=>[{n,w,type:'pic'},{n,w,type:'word'}]));
    let first=null, lock=false, matched=0;
    stage.innerHTML = `
      <div class="progress">Round ${round+1} / ${R} · 그림과 낱말 짝을 찾아요!</div>
      <div class="mgrid three">${cards.map((c,k)=>`
        <button class="mcard" data-k="${k}" aria-label="card">
          <span class="back" aria-hidden="true">🐰</span>
          <span class="front">${c.type==='pic' ? `<span class="em">${c.w.e}</span>` : `<span class="mw en ${enSize(face(c.w))}">${esc(face(c.w))}</span>`}</span>
        </button>`).join('')}</div>`;
    stage.querySelectorAll('.mcard').forEach(el=>el.onclick=async ()=>{
      const c = cards[+el.dataset.k];
      if(lock || el.classList.contains('open')) return;
      el.classList.add('open');
      if(!first){ first={c,el}; return; }
      const a = first; first = null;
      if(a.c.n===c.n && a.c.type!==c.type){
        a.el.classList.add('matched'); el.classList.add('matched'); good(el); matched++;
        lock = true; await say(isAlpha(lv) ? c.w.line : c.w.w); lock = false;
        if(matched===words.length){
          await wait(500); round++;
          if(round<R){ fanfare(); burst(innerWidth/2, innerHeight/2);
            stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🃏</div><h2>Round ${round} clear!</h2></div><div class="row"><button class="big go" id="nextR">Round ${round+1} ➜</button></div>`;
            $('#nextR').onclick = show; }
          else phReward(lv,'flip',all);
        }
      }else{ lock = true; await wait(900); a.el.classList.remove('open'); el.classList.remove('open'); lock = false; }
    });
  }
  show();
}

/* 2. Bunny's Bag — bunny says "I need a hat!"; pick the word card, it turns into the picture and goes in the bag */
function phProps(lv){
  phNav(lv,'props');
  const rounds = koRounds(lv, 6, w=>!!w.e); let i=0; const bag=[];
  function show(){
    const w = rounds[i], opts = nearOpts(lv, w); let locked=false;
    const blankLine = esc(w.need).replace(esc(w.w), '<span class="blank-w" id="bw">　　</span>');
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐰</div><div class="bubble">${blankLine}</div><button class="iconbtn" id="again" aria-label="Listen again">🔊</button></div>
      <div class="cards three">${opts.map(o=>`<button class="card wordonly" data-w="${esc(o)}"><span class="tface hintpic" aria-hidden="true" hidden></span><span class="tw en-w">${esc(o)}</span></button>`).join('')}</div>
      <div class="bagrow" aria-label="Bunny's bag"><span aria-hidden="true">🎒</span>${bag.map(e=>`<span class="got-e">${e}</span>`).join('')}</div>`;
    const play = ()=>sayAll(w.need);
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.w===w.w){
        locked=true; c.classList.add('right');
        const p=c.querySelector('.hintpic'); p.textContent=w.e; p.hidden=false; p.classList.add('popin');
        $('#bw').textContent=w.w; $('#bw').classList.add('got');
        good(c); bag.push(w.e); await say(w.w); await wait(700);
        i++;
        if(i<rounds.length) show();
        else{
          stage.innerHTML = `<div class="reward"><div class="medal" aria-hidden="true">🐰</div><div class="bagrow big-bag">🎒${bag.map(e=>`<span>${e}</span>`).join('')}</div></div>`;
          await sayAll("Thank you! Let's go on a picnic!"); await wait(300); phReward(lv,'props',rounds);
        }
      }else{ c.classList.add('wrong'); bad(c); sayOne(c.dataset.w); }
    });
  }
  show();
}

/* 3. Which One? — hear one of a pair (cap / cape, b / d), tap it */
function phHear(lv){
  phNav(lv,'hear');
  let pairs = shuffle(lv.pairs); while(pairs.length<8) pairs = pairs.concat(shuffle(lv.pairs));
  const rounds = pairs.slice(0,8).map(p=>({p, t: p[Math.random()<.5?0:1]})); let i=0;
  const voice = x => isAlpha(lv) ? letterOf(lv,x).line : x;
  function show(){
    const {p,t} = rounds[i]; let locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐰</div><div class="bubble">Which one did you hear?</div><button class="iconbtn" id="again" aria-label="Listen again">🔊</button></div>
      <div class="cards two">${shuffle(p).map(o=>`<button class="card wordonly huge" data-w="${esc(o)}"><span class="tw en-w">${esc(o)}</span></button>`).join('')}</div>
      <div class="hint morph" id="hint"></div>`;
    const play = ()=>sayAll('Which one did you hear?', voice(t));
    play(); $('#again').onclick = ()=>sayOne(voice(t));
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.w===t){
        locked=true; c.classList.add('right'); good(c);
        if(lv.kind==='magic'){ const [s,l] = [...p].sort((a,b)=>a.length-b.length); $('#hint').innerHTML = `${esc(s)} + <b class="w-taste">e</b> 🪄 = ${esc(l)}`; }
        else if(isAlpha(lv)){ const x=letterOf(lv,t); $('#hint').innerHTML = `${x.e} ${esc(x.w)}`; }
        await say(voice(t)); await wait(600);
        i++; i<rounds.length ? show() : phReward(lv,'hear',[]);
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

/* 4. Missing Letter — hear the word, pop the balloon that fills the gap (vowel / sh / ai …) */
const PH_CONS = {b:'dp',d:'bt',p:'bd',m:'nw',n:'mh',f:'vt',v:'fw',s:'zf',z:'sv',t:'df',g:'jy',j:'gy',h:'nb',k:'ht',l:'rt',r:'ln',w:'vm',y:'vj',c:'gs',q:'pg',x:'sz'};
const PH_SETS = [['sh','ch','th','wh'],['fr','cr','dr','gr','tr','br'],['fl','cl','pl','sl','gl','bl'],['st','sp','sn','sw','sk']];
const PH_TEAMS = [['ai','ay'],['ee','ea'],['oa','ow']];
function phDecoys(f){
  if(f.length===1 && 'aeiou'.includes(f)) return shuffle([...'aeiou'].filter(v=>v!==f)).slice(0,2);
  if(f.length===1) return [...(PH_CONS[f]||'ab')];
  if(f==='ck') return ['ch','sh'];
  const tg = PH_TEAMS.find(g=>g.includes(f));
  if(tg) return PH_TEAMS.filter(g=>g!==tg).map(g=>shuffle(g)[0]);
  const sg = PH_SETS.find(g=>g.includes(f)) || PH_SETS[0];
  return shuffle(sg.filter(x=>x!==f)).slice(0,2);
}
function phBlank(lv){
  phNav(lv,'blank'); const rounds = koRounds(lv, 8); let i=0;
  function show(){
    const w = rounds[i], at = (w.w==='fox') ? 2 : w.w.indexOf(w.f);
    const pre = [...w.w.slice(0,at)], post = [...w.w.slice(at+w.f.length)];
    const opts = shuffle([w.f, ...phDecoys(w.f)]);
    const cols = shuffle(['#FF7AA2','#5BB8FF','#FFC94D','#8BD17C','#B98CFF']);
    let locked=false;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐰</div><div class="bubble">Find the missing letter!</div><button class="iconbtn" id="again" aria-label="Listen again">🔊</button></div>
      <div class="sylrow en">${pre.map(s=>`<span class="syl">${esc(s)}</span>`).join('')}<span class="syl blank ${w.f.length>1?'wide':''}" id="bl">?</span>${post.map(s=>`<span class="syl">${esc(s)}</span>`).join('')}</div>
      <div class="balloons en">${opts.map((o,k)=>`
        <button class="balloon" data-o="${esc(o)}" style="--bc:${cols[k]};--d:${k*0.4}s"><span>${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayAll('Find the missing letter!', w.w);
    play(); $('#again').onclick = ()=>sayOne(w.w);
    stage.querySelectorAll('.balloon').forEach(b=>b.onclick=async ()=>{
      if(locked || b.classList.contains('gone')) return;
      if(b.dataset.o===w.f){
        locked=true; b.classList.add('pop'); const bl=$('#bl'); bl.textContent=w.f; bl.classList.remove('blank'); bl.classList.add('got');
        good(b); await say(w.w); await wait(450);
        i++; i<rounds.length ? show() : phReward(lv,'blank',rounds);
      }else{ b.classList.add('gone'); bad(null); }
    });
  }
  show();
}

/* 5. Trace It — trace the grey letters (alphabet: Bb) on 4-line paper; coverage check like 한글 따라 쓰기 */
function phTrace(lv){
  phNav(lv,'trace');
  const rounds = isAlpha(lv) ? koRounds(lv,5) : koRounds(lv, 5, w=>w.w.length<=5);
  let i=0, color='#E4407A';
  async function show(){
    const w = rounds[i], text = isAlpha(lv) ? w.L.toUpperCase()+w.L : w.w;
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐰</div><div class="bubble">${isAlpha(lv)?'Trace the letter!':'Trace the word!'}</div><button class="iconbtn" id="again" aria-label="Listen again">🔊</button></div>
      <div class="tracebox en" id="tb"><canvas id="cg"></canvas><canvas id="cu"></canvas></div>
      <div class="row">
        ${['#E4407A','#2F74E0','#2FA866','#F29D1F'].map(c=>`<button class="pen ${c===color?'on':''}" data-c="${c}" style="--pc:${c}" aria-label="pen color"></button>`).join('')}
      </div>
      <div class="row tracebtns">
        <button class="big alt" id="undo">↩️ 한 획 지우기</button><button class="big alt" id="clr">🧽 다 지우기</button><button class="big go" id="done">다 썼어요!</button>
      </div>
      <div class="hint ko-s" id="hint"></div>`;
    const voice = isAlpha(lv) ? w.line : w.w;
    sayAll(isAlpha(lv)?'Trace the letter!':'Trace the word!', voice); $('#again').onclick = ()=>sayOne(voice);
    const tb=$('#tb'), cg=$('#cg'), cu=$('#cu'), dpr=Math.max(1, window.devicePixelRatio||1);
    const W=tb.clientWidth, H=tb.clientHeight;
    [cg,cu].forEach(c=>{ c.width=W*dpr; c.height=H*dpr; c.getContext('2d').scale(dpr,dpr); });
    const fam = '"Andika", "Gowun Dodum", sans-serif';
    try{ await document.fonts.load(`100px ${fam}`, text); }catch(e){}
    const m = document.createElement('canvas').getContext('2d'); m.font = `100px ${fam}`;
    const fs = Math.min(H*0.62, 100 * (W*0.86) / Math.max(1, m.measureText(text).width));
    const font = `${fs}px ${fam}`, base = H*0.5 + fs*0.3;
    const drawGuide = (ctx, col)=>{ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=fs*0.09; ctx.lineJoin='round'; ctx.strokeText(text,W/2,base); ctx.fillText(text,W/2,base); };
    const g = cg.getContext('2d');
    [[base-fs*0.72,'rgba(90,101,144,.25)',[]],[base-fs*0.36,'rgba(90,101,144,.25)',[8,8]],[base,'rgba(228,64,122,.45)',[]],[base+fs*0.24,'rgba(90,101,144,.18)',[]]].forEach(([y,c,d])=>{
      g.save(); g.strokeStyle=c; g.lineWidth=2; g.setLineDash(d); g.beginPath(); g.moveTo(12,y); g.lineTo(W-12,y); g.stroke(); g.restore(); });
    drawGuide(g, '#DCE2EC');
    const mask = document.createElement('canvas'); mask.width=cg.width; mask.height=cg.height;
    const mctx = mask.getContext('2d'); mctx.scale(dpr,dpr); drawGuide(mctx,'#000');
    const ux = cu.getContext('2d'); let drawing=false, last=null;
    const pt = e=>{ const r=cu.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
    const hist=[]; cu.onpointerdown = e=>{ hist.push(ux.getImageData(0,0,cu.width,cu.height)); if(hist.length>40) hist.shift(); drawing=true; last=pt(e); cu.setPointerCapture(e.pointerId); ux.fillStyle=color; ux.beginPath(); ux.arc(last[0],last[1],fs*0.055,0,Math.PI*2); ux.fill(); };
    cu.onpointermove = e=>{ if(!drawing) return; const p=pt(e); ux.strokeStyle=color; ux.lineWidth=fs*0.11; ux.lineCap='round'; ux.lineJoin='round'; ux.beginPath(); ux.moveTo(last[0],last[1]); ux.lineTo(p[0],p[1]); ux.stroke(); last=p; };
    cu.onpointerup = cu.onpointercancel = ()=>{ drawing=false; };
    stage.querySelectorAll('.pen').forEach(p=>p.onclick=()=>{ color=p.dataset.c; stage.querySelectorAll('.pen').forEach(q=>q.classList.toggle('on', q===p)); });
    $('#clr').onclick = ()=>{ hist.push(ux.getImageData(0,0,cu.width,cu.height)); ux.clearRect(0,0,W,H); $('#hint').textContent=''; };
    $('#undo').onclick = ()=>{ if(!hist.length){ boop(); return; } ux.putImageData(hist.pop(),0,0); $('#hint').textContent=''; };
    $('#done').onclick = async ()=>{
      const gd = mctx.getImageData(0,0,mask.width,mask.height).data, u = ux.getImageData(0,0,cu.width,cu.height).data;
      let gp=0, cov=0, up=0, out=0; const st=3*Math.round(dpr);
      for(let y=0; y<mask.height; y+=st){ for(let x=0; x<mask.width; x+=st){ const k=(y*mask.width+x)*4+3; const gi=gd[k]>40, ui=u[k]>40; if(gi){gp++; if(ui) cov++;} if(ui){up++; if(!gi) out++;} } }
      const c = gp ? cov/gp : 0, o = up ? out/up : 1;
      if(c>=0.5 && o<=0.6){
        good($('#tb')); await say(voice); await wait(500);
        i++; i<rounds.length ? show() : phReward(lv,'trace',rounds);
      }else{ bad($('#tb')); $('#hint').textContent='회색 글자 위를 꼼꼼히 따라 써 볼까?'; sayOne('Try again! You can do it!'); }
    };
  }
  show();
}

/* 6. Fill the Gap — hear the whole sentence (answer included), find that word among similar spellings */
function phSent(lv){
  phNav(lv,'sent'); const rounds = koRounds(lv, 8, w=>!!w.sent); let i=0;
  function show(){
    const w = rounds[i], opts = nearOpts(lv, w); let locked=false;
    const k = w.sent.lastIndexOf(w.w);
    const sent = esc(w.sent.slice(0,k)) + `<span class="blank-w" id="bw">　　</span>` + esc(w.sent.slice(k+w.w.length));
    stage.innerHTML = `
      <div class="progress">${i+1} / ${rounds.length}</div>
      <div class="chef"><div class="face" aria-hidden="true">🐰</div><div class="bubble">${sent}</div><button class="iconbtn" id="again" aria-label="Listen again">🔊</button></div>
      <div class="cards three">${opts.map(o=>`<button class="card wordonly" data-w="${esc(o)}"><span class="tw en-w">${esc(o)}</span></button>`).join('')}</div>`;
    const play = ()=>sayAll(w.sent);
    play(); $('#again').onclick = play;
    stage.querySelectorAll('.card').forEach(c=>c.onclick=async ()=>{
      if(locked || c.classList.contains('wrong')) return;
      if(c.dataset.w===w.w){
        locked=true; c.classList.add('right'); $('#bw').textContent=w.w; $('#bw').classList.add('got');
        good(c); await say(w.sent); await wait(450); i++; i<rounds.length ? show() : phReward(lv,'sent',rounds);
      }else{ c.classList.add('wrong'); bad(c); }
    });
  }
  show();
}

const PGAME = {flip:phFlip, props:phProps, hear:phHear, blank:phBlank, trace:phTrace, sent:phSent};
