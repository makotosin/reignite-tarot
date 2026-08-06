const screens=[...document.querySelectorAll('.screen')];
const modes={one:{label:'今日の一枚',count:1,positions:['今日の兆し']},answer:{label:'迷いへの答え',count:1,positions:['問いへの答え']},three:{label:'過去・現在・未来',count:3,positions:['過去','現在','未来']},reignite:{label:'人生再点火の兆し',count:1,positions:['再点火の火種']}};
let state={mode:'one',question:'',selected:[],pool:[],visual:null};
const VISUAL_THEMES=[
  {name:'moon',body:'theme-moon',effect:'fx-mist',filter:'tone-moon'},
  {name:'blood',body:'theme-blood',effect:'fx-embers',filter:'tone-blood'},
  {name:'emerald',body:'theme-emerald',effect:'fx-runes',filter:'tone-emerald'},
  {name:'gold',body:'theme-gold',effect:'fx-stars',filter:'tone-gold'},
  {name:'violet',body:'theme-violet',effect:'fx-arcane',filter:'tone-violet'}
];
const CARD_MOODS={
  '15':'blood','16':'blood','13':'blood','18':'moon','17':'moon','02':'moon',
  '01':'violet','10':'violet','20':'gold','19':'gold','21':'gold','14':'emerald','03':'emerald'
};
function chooseVisual(card){
  const preferred=CARD_MOODS[String(card?.n).padStart(2,'0')];
  const pool=preferred?VISUAL_THEMES.filter(v=>v.name===preferred).concat(VISUAL_THEMES):VISUAL_THEMES;
  const visual=pool[Math.floor(Math.random()*pool.length)];
  state.visual={...visual,glow:['glow-soft','glow-deep','glow-pulse'][Math.floor(Math.random()*3)],motion:['motion-float','motion-breathe','motion-still'][Math.floor(Math.random()*3)]};
  applyVisual();
}
function applyVisual(){
  document.body.classList.remove(...VISUAL_THEMES.map(v=>v.body),...VISUAL_THEMES.map(v=>v.effect));
  if(!state.visual)return;
  document.body.classList.add(state.visual.body,state.visual.effect);
  spawnParticles(state.visual.name);
}
function spawnParticles(theme){
  const host=document.querySelector('#particles'); if(!host)return;
  host.innerHTML='';
  const count=innerWidth<700?16:30;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');
    p.style.setProperty('--x',`${Math.random()*100}%`);
    p.style.setProperty('--y',`${Math.random()*100}%`);
    p.style.setProperty('--s',`${Math.random()*5+2}px`);
    p.style.setProperty('--d',`${Math.random()*8+7}s`);
    p.style.setProperty('--delay',`${-Math.random()*12}s`);
    p.className=`particle particle-${theme}`;
    host.appendChild(p);
  }
}

const $=s=>document.querySelector(s);
function go(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));scrollTo({top:0,behavior:'smooth'});} 
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$('#mode-label').textContent=modes[state.mode].label.toUpperCase();go('question')});
$('#question-input').addEventListener('input',e=>$('#count').textContent=e.target.value.length);
$('#begin-reading').onclick=()=>{state.question=$('#question-input').value.trim();prepareDeck();go('draw')};
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function prepareDeck(){state.selected=[];state.visual=null;document.body.classList.remove(...VISUAL_THEMES.map(v=>v.body),...VISUAL_THEMES.map(v=>v.effect));state.pool=shuffle(TAROT_CARDS);const deck=$('#deck');deck.innerHTML='';const shown=state.pool.slice(0,13);shown.forEach((card,i)=>{const btn=document.createElement('button');btn.className='deck-card';btn.style.setProperty('--rot',`${(i-6)*2.1}deg`);btn.style.setProperty('--lift',`${Math.abs(i-6)*2}px`);btn.setAttribute('aria-label',`${i+1}枚目のカード`);btn.innerHTML='<img src="images/card-back.svg" alt="カードの裏面">';btn.onclick=()=>pick(card,btn);deck.appendChild(btn)});$('#draw-help').textContent=modes[state.mode].count===1?'直感で一枚選びます':'直感で三枚選びます';updateStatus()}
function pick(card,btn){if(state.selected.length>=modes[state.mode].count)return;state.selected.push({...card,reversed:Math.random()<.35});btn.classList.add('picked');updateStatus();if(state.selected.length===modes[state.mode].count)setTimeout(reveal,500)}
function updateStatus(){const n=modes[state.mode].count;$('#selection-status').textContent=`${state.selected.length} / ${n} 枚を選択`}
function reveal(){chooseVisual(state.selected[0]);const wrap=$('#revealed-cards');wrap.innerHTML='';state.selected.forEach((c,i)=>{const el=document.createElement('div');el.className=`flip-card ${state.visual.glow} ${state.visual.motion} ${state.visual.filter}`;el.style.setProperty('--delay',`${i*.55}s`);el.innerHTML=`<div class="card-aura"></div><div class="flip-inner"><div class="flip-face"><img src="images/card-back.svg" alt="カードの裏面"></div><div class="flip-face flip-front ${c.reversed?'reversed':''}"><img src="images/${String(c.n).padStart(2,'0')}-${c.slug}.png" alt="${c.jp}"></div></div><div class="card-caption">${modes[state.mode].positions[i]}</div>`;wrap.appendChild(el);setTimeout(()=>{el.classList.add('open');document.body.classList.add('reveal-flash');setTimeout(()=>document.body.classList.remove('reveal-flash'),850)},220+i*420)});go('reveal')}
$('#show-result').onclick=()=>{renderResult();go('result')};
function orientation(c){return c.reversed?'逆位置':'正位置'}
function key(c){return c.reversed?c.reverse:c.upright}
function mainMessage(c){return c.reversed?c.shadow:c.message}
function renderResult(){const q=$('#question-echo');q.textContent=state.question?`「${state.question}」`:'心に浮かべた問いに対して';const body=$('#result-body');if(state.selected.length===1){const c=state.selected[0];body.innerHTML=`<div class="result-hero"><div class="result-card-frame ${state.visual?.glow||''} ${state.visual?.motion||''} ${state.visual?.filter||''}"><div class="card-aura"></div><img class="${c.reversed?'reversed':''}" src="images/${String(c.n).padStart(2,'0')}-${c.slug}.png" alt="${c.jp}"></div><div class="result-copy"><h3>${c.jp}</h3><div class="orientation">${c.en}・${orientation(c)}</div><p><b>${key(c)}</b></p><p>${mainMessage(c)}</p></div></div><div class="reading-block"><h4>今のあなたへ</h4><p>${interpret(c)}</p></div><div class="reading-block"><h4>今日からできる小さな行動</h4><p>${c.action}</p></div>`}else{body.innerHTML=`<div class="three-results">${state.selected.map((c,i)=>`<article class="mini-result"><div class="result-card-frame ${state.visual?.glow||''} ${state.visual?.motion||''} ${state.visual?.filter||''}"><div class="card-aura"></div><img class="${c.reversed?'reversed':''}" src="images/${String(c.n).padStart(2,'0')}-${c.slug}.png" alt="${c.jp}"></div><h3>${modes[state.mode].positions[i]}：${c.jp}</h3><p>${orientation(c)}｜${key(c)}</p><p>${mainMessage(c)}</p></article>`).join('')}</div><div class="reading-block"><h4>三枚をつなぐ物語</h4><p>${threeStory()}</p></div><div class="reading-block"><h4>次の一歩</h4><p>${state.selected[1].action}</p></div>`}}
function interpret(c){const prefix=state.mode==='reignite'?'再点火の鍵は、':state.mode==='answer'?'問いへの答えは、':state.mode==='one'?'今日の流れは、':'';return `${prefix}${mainMessage(c)} ${c.reversed?'急いで突破しようとせず、まず絡まっているものを見つけることが大切です。':'今は、カードが示す力を生活の中の小さな選択に移す時です。'}`}
function threeStory(){const [a,b,c]=state.selected;return `過去には「${a.jp}」が示す${key(a)}の流れがありました。現在は「${b.jp}」の${key(b)}が中心にあります。この流れを受け止めることで、未来の「${c.jp}」が示す${key(c)}へ向かいます。未来は決定ではなく、今の選び方によって形を変える余地があります。`}
$('#again').onclick=()=>{state.selected=[];go('modes')};
$('#save-result').onclick=saveImage;
async function saveImage(){const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#19112f');g.addColorStop(1,'#05040b');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#d9b66f';x.lineWidth=3;x.strokeRect(42,42,996,1266);x.textAlign='center';x.fillStyle='#d9b66f';x.font='32px serif';x.fillText('人生再点火 TAROT',540,105);x.fillStyle='#f2ead7';x.font='bold 54px serif';x.fillText(modes[state.mode].label,540,180);if(state.selected.length===1){const card=state.selected[0];const img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`);x.save();if(card.reversed){x.translate(540,555);x.rotate(Math.PI);x.drawImage(img,-180,-270,360,540)}else{x.drawImage(img,360,285,360,540)}x.restore();x.fillStyle='#f2ead7';x.font='bold 46px serif';x.fillText(`${card.jp}・${orientation(card)}`,540,900);wrapText(x,mainMessage(card),540,970,860,48,'30px serif');x.fillStyle='#d9b66f';x.font='bold 28px serif';x.fillText('今日からできる小さな行動',540,1130);x.fillStyle='#f2ead7';wrapText(x,card.action,540,1185,860,42,'27px serif')}else{x.font='bold 36px serif';for(let i=0;i<3;i++){const card=state.selected[i],img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`),cx=230+i*310;x.save();if(card.reversed){x.translate(cx,490);x.rotate(Math.PI);x.drawImage(img,-115,-172,230,345)}else{x.drawImage(img,cx-115,318,230,345)}x.restore();x.fillStyle='#d9b66f';x.font='25px serif';x.fillText(modes[state.mode].positions[i],cx,710);x.fillStyle='#f2ead7';x.font='bold 28px serif';x.fillText(card.jp,cx,750)}x.fillStyle='#f2ead7';wrapText(x,threeStory(),540,865,900,45,'28px serif')}x.fillStyle='#81778d';x.font='22px serif';x.fillText('スキ3000突破記念・読者無料サービス',540,1280);const a=document.createElement('a');a.download=`reignite-tarot-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click()}
function loadImage(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,font){ctx.font=font;let line='';const chars=[...text];for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=ch;y+=lineHeight}else line=test}ctx.fillText(line,x,y)}
// stars
const canvas=$('#stars'),ctx=canvas.getContext('2d');let stars=[];function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);stars=Array.from({length:Math.min(150,innerWidth/7)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.4+.2,a:Math.random()*.65+.15,s:Math.random()*.003+.001}))}function drawStars(t=0){ctx.clearRect(0,0,innerWidth,innerHeight);for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(t*s.s+s.x));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}requestAnimationFrame(drawStars)}addEventListener('resize',resize);resize();drawStars();
