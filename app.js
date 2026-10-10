const screens=[...document.querySelectorAll('.screen')];
const modes={one:{label:'今日の一枚',count:1,positions:['今日の兆し']},answer:{label:'迷いへの答え',count:1,positions:['問いへの答え']},three:{label:'過去・現在・未来',count:3,positions:['過去','現在','未来']},reignite:{label:'人生再点火の兆し',count:1,positions:['再点火の火種']}};
let state={mode:'one',selected:[],pool:[],visual:null};
const VISUAL_THEMES=[
  {name:'moon',body:'theme-moon',effect:'fx-mist',filter:'tone-moon'},
  {name:'blood',body:'theme-blood',effect:'fx-embers',filter:'tone-blood'},
  {name:'emerald',body:'theme-emerald',effect:'fx-mist',filter:'tone-emerald'},
  {name:'gold',body:'theme-gold',effect:'fx-mist',filter:'tone-gold'},
  {name:'violet',body:'theme-violet',effect:'fx-mist',filter:'tone-violet'}
];
const CARD_MOODS={
  '15':'blood','16':'blood','13':'blood','18':'moon','17':'moon','02':'moon',
  '01':'violet','10':'violet','20':'gold','19':'gold','21':'gold','14':'emerald','03':'emerald'
};
function chooseVisual(card){
  const preferred=CARD_MOODS[String(card?.n).padStart(2,'0')];
  let pool=preferred?VISUAL_THEMES.filter(v=>v.name===preferred).concat(VISUAL_THEMES):[...VISUAL_THEMES];
  if(state.visual?.name&&pool.length>1)pool=pool.filter(v=>v.name!==state.visual.name);
  const visual=pool[Math.floor(Math.random()*pool.length)];
  state.visual={...visual,glow:['glow-soft','glow-deep','glow-pulse'][Math.floor(Math.random()*3)],motion:['motion-float','motion-sway','motion-breathe'][Math.floor(Math.random()*3)]};
  applyVisual();
}
function applyVisual(){
  document.body.classList.remove(...VISUAL_THEMES.map(v=>v.body),...VISUAL_THEMES.map(v=>v.effect));
  if(!state.visual)return;
  document.body.classList.add(state.visual.body,state.visual.effect);
  document.documentElement.style.setProperty('--current-mood',`"${state.visual.name}"`);
  spawnParticles(state.visual.name);
}
function spawnParticles(theme){
  const host=document.querySelector('#particles'); if(!host)return;
  host.innerHTML='';
  const count=innerWidth<700?7:12;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');
    p.style.setProperty('--x',`${Math.random()*100}%`);
    p.style.setProperty('--y',`${Math.random()*100}%`);
    p.style.setProperty('--s',`${Math.random()*3+1}px`);
    p.style.setProperty('--d',`${Math.random()*8+7}s`);
    p.style.setProperty('--delay',`${-Math.random()*12}s`);
    p.className=`particle particle-${theme}`;
    host.appendChild(p);
  }
}


// Effects v4.0: card-specific visual direction
function cardFxClass(card){
  const n=Number(card?.n);
  if([18,2].includes(n)) return 'fx-card-moon';
  if([15,13].includes(n)) return 'fx-card-blood';
  if(n===16) return 'fx-card-tower';
  if([17,19,20,21].includes(n)) return 'fx-card-stars';
  if([1,10].includes(n)) return 'fx-card-arcane';
  if([3,14].includes(n)) return 'fx-card-nature';
  return ['fx-card-moon','fx-card-blood','fx-card-stars','fx-card-arcane','fx-card-nature'][Math.floor(Math.random()*5)];
}
function specialFxMarkup(){return '<div class="card-special-fx" aria-hidden="true"></div>'}

const $=s=>document.querySelector(s);
const DAILY_READING_KEY='reigniteTarotDailyReadingV1';
const TEST_MODE=new URLSearchParams(location.search).get('test')==='1';

// Phase 4 preview: the existing public daily gate is intentionally unchanged.
// In ?test=1, use a separate counter so previews cannot alter real usage history.
const PHASE4_TEST_KEY='reigniteTarotPhase4PreviewV1';
const SPIRIT_EVENTS={
  5:{tone:'caution',title:'最初の忠告',line:'また占うのかい。答えはもう示されたはずだよ。何度も尋ねるものじゃない。'},
  10:{tone:'caution',title:'老婆のため息',line:'何度尋ねても、運命が変わるわけではないよ。'},
  20:{tone:'uneasy',title:'不穏な気配',line:'おやめ。カードはお前の不安を慰める道具じゃない。'},
  30:{tone:'angry',title:'精霊の怒り',line:'いい加減におし！　運命を試し続けるものじゃない！'},
  50:{tone:'angry',title:'深まる闇',line:'お前は答えではなく、望む言葉だけを探している。'},
  100:{tone:'silent',title:'奇妙な沈黙',line:'……もう、わたしから言うことはないよ。'},
  1000:{tone:'secret',title:'精霊の降参',line:'……あんた、まだいたのかい。まったく、たいした執念だねえ！'}
};
function getPreviewCount(){try{const v=JSON.parse(localStorage.getItem(PHASE4_TEST_KEY)||'{}');return v.date===localDayKey()?Math.max(0,Number(v.count)||0):0}catch(_){return 0}}
function setPreviewCount(count){try{localStorage.setItem(PHASE4_TEST_KEY,JSON.stringify({date:localDayKey(),count:Math.max(0,Math.floor(count))}))}catch(_){}updateReadingCounters()}
function activeDailyCount(){return TEST_MODE?getPreviewCount():getDailyReadingState().count}
function updateReadingCounters(){const node=$('#reading-counters');if(node)node.textContent=`本日の占い ${activeDailyCount()} 回${TEST_MODE?'（開発プレビュー）':''}`}
function spiritTier(count){return count>=1000?'secret':count>=100?'silent':count>=50?'angry':count>=20?'uneasy':count>=5?'caution':'normal'}
function updateSpiritMood(count){document.body.dataset.spiritMood=spiritTier(count)}
function openSpiritEvent(count,continueReading){
  const e=SPIRIT_EVENTS[count];if(!e){continueReading();return}
  const dialog=$('#spirit-event');if(!dialog){continueReading();return}
  dialog.dataset.tone=e.tone;
  dialog.dataset.stage=String(count);
  const portrait=dialog.querySelector('.spirit-portrait img');
  if(portrait)portrait.src=count>=30?'spirit-elder-ominous.webp?v=2':'spirit-elder.webp?v=2';
  $('#spirit-title').textContent=e.title;
  $('#spirit-line').textContent=e.line;
  $('#spirit-count').textContent=`本日 ${count} 回目`;
  dialog.hidden=false;
  const button=$('#spirit-continue');button.focus();
  button.onclick=()=>{dialog.hidden=true;continueReading()};
}
function beginPreviewReading(){const count=getPreviewCount()+1;setPreviewCount(count);updateSpiritMood(count);openSpiritEvent(count,startActualReading)}
function reversalChance(count){return Math.min(.72,.35+Math.max(0,count-4)*.004)}
function pickWeightedCard(pool,count){
  // Increasing frequency of ominous cards is a disclosed game mechanic, not a prediction.
  const dark=new Set([12,13,15,16,18]);const extra=Math.min(3,Math.max(0,count-4)*.025);
  const weights=pool.map(c=>dark.has(Number(c.n))?1+extra:1);
  let r=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i]}
  return pool[pool.length-1];
}


function localDayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDailyReadingState(){
  const today=localDayKey();
  try{
    const saved=JSON.parse(localStorage.getItem(DAILY_READING_KEY)||'{}');
    if(saved.date!==today)return {date:today,count:0};
    return {date:today,count:Number(saved.count)||0};
  }catch(_){return {date:today,count:0}}
}
function setDailyReadingCount(count){
  try{localStorage.setItem(DAILY_READING_KEY,JSON.stringify({date:localDayKey(),count}))}catch(_){}
}
function registerReadingAttempt(){
  const daily=getDailyReadingState();
  const next=daily.count+1;
  setDailyReadingCount(next);
  return next;
}
// 過去の結果・累計回数は保存しない。日別回数だけを演出に使用する。
// The card-selection backdrop follows only today's count; never lifetime usage.
function updateDrawElderBackground(count){
  const screen=document.querySelector('#draw');
  const portrait=document.querySelector('#draw-elder-image');
  if(!screen||!portrait)return;
  const stage=count>=1000?1000:count>=100?100:count>=50?50:count>=30?30:count>=20?20:count>=10?10:count>=5?5:0;
  screen.dataset.elderStage=String(stage);
  const image=stage>=30&&stage<1000?'spirit-elder-ominous.webp':'spirit-elder.webp';
  if(portrait.getAttribute('src')!==image)portrait.setAttribute('src',image);
}
function startActualReading(){
  updateDrawElderBackground(activeDailyCount());
  prepareDeck();
  go('draw');
}
// Phase 5: local simulation ONLY. No payment or advertisement SDK is connected.
const PHASE5_MOCK_KEY='reigniteTarotPhase5MockV1';
function mockSubscriber(){try{return localStorage.getItem(PHASE5_MOCK_KEY)==='subscriber'}catch(_){return false}}
function mockAdsUnlocked(){try{const x=JSON.parse(localStorage.getItem(PHASE5_MOCK_KEY+'Ads')||'{}');return x.date===localDayKey()?Math.max(0,Math.floor(x.count)||0):0}catch(_){return 0}}
function setMockAdsUnlocked(n){try{localStorage.setItem(PHASE5_MOCK_KEY+'Ads',JSON.stringify({date:localDayKey(),count:n}))}catch(_){}}
function phase5Status(){const count=activeDailyCount(),sub=mockSubscriber();const el=$('#phase5-status');if(el)el.textContent=TEST_MODE?`開発用：本日 ${count} 回・${sub?'有料会員（模擬）':'無料会員（模擬）'}`:`本日 ${count} 回・${sub?'有料会員（模擬）':'無料会員（模擬）'}`}
function phase5SetSubscriber(value){try{localStorage.setItem(PHASE5_MOCK_KEY,value?'subscriber':'free')}catch(_){}phase5Status()}
function phase5Dialog(title,message,buttons){const panel=$('#phase5-gate');if(!panel)return;$('#phase5-gate-title').textContent=title;$('#phase5-gate-copy').textContent=message;const actions=$('#phase5-gate-actions');actions.replaceChildren();for(const [label,fn] of buttons){const btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent=label;btn.onclick=()=>{panel.hidden=true;fn()};actions.appendChild(btn)}panel.hidden=false}
function phase5Proceed(){if(TEST_MODE){beginPreviewReading()}else{const n=registerReadingAttempt();updateReadingCounters();updateSpiritMood(n);openSpiritEvent(n,startActualReading)}phase5Status()}
function handleDailyReadingGate(){
  const count=activeDailyCount();const next=count+1;
  if(mockSubscriber()||next===1){phase5Proceed();return}
  if(next>=5){phase5Dialog('本日の無料回数は終了しました','5回目以降は月額300円の有料プランが必要です。現在は購入できません。これは開発用の模擬画面です。', [['戻る',()=>go('question')],['開発用：有料会員に切替',()=>{phase5SetSubscriber(true);phase5Proceed()}]]);return}
  if(mockAdsUnlocked()>=next){phase5Proceed();return}
  phase5Dialog('広告を視聴して占う',`${next}回目の占いにはリワード広告の視聴が必要です。現在は広告SDK未接続のため、下のボタンで視聴完了を模擬します。`,[['戻る',()=>go('question')],['開発用：広告視聴完了を模擬',()=>{setMockAdsUnlocked(next);phase5Proceed()}]]);
}
function go(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));updateReadingCounters();scrollTo({top:0,behavior:'smooth'});} 
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$('#mode-label').textContent=modes[state.mode].label.toUpperCase();go('question')});
$('#begin-reading').onclick=handleDailyReadingGate;
$('#warning-continue').onclick=()=>{
  registerReadingAttempt();
  document.body.classList.remove('daily-omen');
  startActualReading();
};
$('#warning-stop').onclick=()=>{
  document.body.classList.remove('daily-omen');
  go('home');
};
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function prepareDeck(){state.readingCounted=false;state.selected=[];state.visual={...VISUAL_THEMES[Math.floor(Math.random()*VISUAL_THEMES.length)],glow:'glow-soft',motion:'motion-sway'};applyVisual();state.pool=shuffle(TAROT_CARDS);const deck=$('#deck');deck.innerHTML='';const shown=state.pool.slice(0,13);shown.forEach((card,i)=>{const btn=document.createElement('button');btn.className='deck-card';btn.style.setProperty('--rot',`${(i-6)*2.1}deg`);btn.style.setProperty('--lift',`${Math.abs(i-6)*2}px`);btn.setAttribute('aria-label',`${i+1}枚目のカード`);btn.innerHTML='<img src="images/card-back.svg" alt="カードの裏面">';btn.onclick=()=>pick(card,btn);deck.appendChild(btn)});$('#draw-help').textContent=modes[state.mode].count===1?'直感で一枚選びます':'直感で三枚選びます';updateStatus()}
function pick(card,btn){if(state.selected.length>=modes[state.mode].count||btn.classList.contains('picked'))return;const count=activeDailyCount();const available=state.pool.filter(c=>!state.selected.some(p=>p.n===c.n));const drawn=count>=5?pickWeightedCard(available,count):card;state.selected.push({...drawn,reversed:Math.random()<reversalChance(count)});btn.classList.add('picked');updateStatus();if(state.selected.length===modes[state.mode].count)setTimeout(reveal,500)}
function updateStatus(){const n=modes[state.mode].count;$('#selection-status').textContent=`${state.selected.length} / ${n} 枚を選択`}
function reveal(){
  chooseVisual(state.selected[0]);
  document.body.classList.add('v4-reading','v4-dim');
  setTimeout(()=>document.body.classList.remove('v4-dim'),1300);

  const wrap=$('#revealed-cards');
  const resultBtn=$('#show-result');
  const title=$('#reveal-title');
  wrap.innerHTML='';
  resultBtn.hidden=true;
  resultBtn.disabled=true;
  resultBtn.classList.remove('result-ready');

  const makeCard=(c,i)=>{
    const el=document.createElement('div');
    el.className=`flip-card ritual-card ${state.visual.glow} ${state.visual.motion} ${state.visual.filter} ${cardFxClass(c)}`;
    el.style.setProperty('--delay',`${i*.55}s`);
    el.innerHTML=`${specialFxMarkup()}<div class="card-aura"></div><div class="flip-inner"><div class="flip-face"><img src="images/card-back.svg" alt="カードの裏面"></div><div class="flip-face flip-front ${c.reversed?'reversed':''}"><img src="images/${String(c.n).padStart(2,'0')}-${c.slug}.png" alt="${c.jp}"></div></div><div class="card-caption">${modes[state.mode].positions[i]}</div>`;
    wrap.appendChild(el);
    return el;
  };

  const enableResult=()=>{
    resultBtn.hidden=false;
    resultBtn.disabled=false;
    resultBtn.classList.add('result-ready');
  };

  // v5.4.2: 1枚引き・3枚引きとも同一の自動回転処理。
  // カード自体のクリック操作は一切不要。
  title.textContent='カードがひらきます';
  const cards=state.selected.map(makeCard);
  go('reveal');

  cards.forEach((el,i)=>{
    setTimeout(()=>{
      el.classList.add('open','summoned');
      document.body.classList.add('reveal-flash','screen-rumble');
      setTimeout(()=>document.body.classList.remove('reveal-flash','screen-rumble'),1050);

      if(i===cards.length-1){
        setTimeout(()=>{
          title.textContent='カードを受け取って';
          enableResult();
        },760);
      }
    },220+i*520);
  });
}
$('#show-result').onclick=()=>{
  try{
    renderResult();
    updateReadingCounters();
    go('result');
  }catch(err){
    console.error('Result render failed:',err);
    alert('結果の表示中にエラーが発生しました。ページを再読み込みして、もう一度お試しください。');
  }
};
function orientation(c){return c.reversed?'逆位置':'正位置'}
function key(c){return c.reversed?c.reverse:c.upright}
function mainMessage(c){return c.reversed?c.shadow:c.message}
function interpret(c){
  const meaning=key(c);
  const message=mainMessage(c);
  const position=modes[state.mode]?.positions?.[0]||'今回の兆し';
  if(state.mode==='answer'){
    return `${position}として「${c.jp}」が示すのは、${meaning}です。${message} 焦って結論を固定せず、今できる選択を一つずつ確かめてみてください。`;
  }
  if(state.mode==='reignite'){
    return `${position}として現れた「${c.jp}」は、${meaning}を示しています。${message} 小さくても心が動く方向を、今日の再出発の手がかりにしてみてください。`;
  }
  return `${position}として現れた「${c.jp}」は、${meaning}を示しています。${message} 今日一日の出来事を、このカードの示す視点から静かに眺めてみてください。`;
}
const CARD_GUIDE=[{"art":"崖の上を歩く旅人と小さな白い動物。足元の断崖と遠くの光が、未知への旅立ちを表します。","upright":"自由な出発、冒険、可能性。先入観を捨てて新しい一歩を踏み出すとき。","reversed":"軽率、準備不足、現実逃避。勢いだけで進まず、足元を確かめる必要があります。"},{"art":"卓上の道具を前に立つ魔術師。頭上の光と掲げた手が、意志を現実へ結びつける力を示します。","upright":"創造力、技術、実行力。持っている力を使い、考えを形にする好機。","reversed":"力の空回り、欺瞞、自信不足。手段や動機を見直す必要があります。"},{"art":"二本の柱の間に座る女教皇。書物と月の意匠は、静かな知恵と隠された真実の象徴です。","upright":"直感、沈黙、洞察。表面に現れない気配を慎重に読み取るとき。","reversed":"思い込み、秘密、直感の鈍り。感情に流されず事実を確かめましょう。"},{"art":"豊かな緑と実りに囲まれて座る女帝。自然と穏やかな光が、生命を育む力を表します。","upright":"豊かさ、愛情、成長。育ててきたものが実を結ぶ兆し。","reversed":"過保護、浪費、停滞。与えることと自分を守ることの均衡が必要です。"},{"art":"石の玉座に座る皇帝。威厳ある衣装と堅固な建築が、秩序と責任を象徴します。","upright":"統率、安定、責任。明確な方針と着実な行動が力になります。","reversed":"頑固さ、支配、融通の利かなさ。強さだけで押し切らない姿勢が大切です。"},{"art":"高い座にある教皇と、その前にひざまずく人々。伝統と教えを受け継ぐ場面です。","upright":"学び、信頼、伝統。先人の知恵や誠実な助言が支えになります。","reversed":"形式への固執、盲従、価値観の衝突。自分で考える余地を持ちましょう。"},{"art":"光をまとった天使の下に向き合う二人。庭園の緑は、愛と選択の可能性を示します。","upright":"結びつき、調和、選択。心から納得できる関係や決断を大切に。","reversed":"すれ違い、迷い、不一致。気持ちと行動のずれを見つめ直すとき。"},{"art":"二頭の馬に引かれる戦車と堂々とした戦士。前へ進む勢いと、それを制御する意志の象徴です。","upright":"前進、勝利、決断。方向を定め、迷わず行動する力があります。","reversed":"暴走、焦り、方向喪失。勢いを抑え、目的を確認する必要があります。"},{"art":"女性が獅子に静かに触れる場面。力でねじ伏せず、優しさで本能を鎮める姿です。","upright":"勇気、忍耐、慈愛。穏やかな強さが困難を乗り越える鍵。","reversed":"自信喪失、感情の暴走、無理。自分を追い詰めず心を整えましょう。"},{"art":"雪深い山道で灯火を掲げる老人。暗闇を照らす小さな光は、内なる知恵を示します。","upright":"内省、探究、慎重さ。静かに考えることで答えが見えてきます。","reversed":"孤立、閉塞、考えすぎ。独りで抱え込まず外の声にも耳を傾けて。"},{"art":"雲間に浮かぶ巨大な車輪と周囲の存在。絶えず巡る運命と、変化の大きさを描いています。","upright":"転機、好機、循環。流れの変化を受け入れることで道が開けます。","reversed":"停滞、タイミングのずれ、抵抗。無理に動かず機を待つ判断も必要です。"},{"art":"剣と天秤を手にした人物が玉座に座る姿。公正な判断と行為の結果を象徴します。","upright":"公平、均衡、責任。感情だけでなく事実に基づく判断が重要です。","reversed":"偏り、不公平、判断ミス。自分に都合のよい見方を避けましょう。"},{"art":"木の枝から逆さに吊られた人物。静かな表情と逆転した視界が、見方の転換を表します。","upright":"忍耐、受容、発想の転換。立ち止まることで新しい意味に気づきます。","reversed":"徒労、執着、身動きの取れなさ。犠牲を続ける理由を問い直して。"},{"art":"黒い馬に乗る骸骨の騎士。暗い景色を進む姿は、避けられない終わりと変容の象徴です。","upright":"終結、転換、再生。古いものを手放し、新しい段階へ進むとき。","reversed":"変化への抵抗、未練、停滞。終わったことを抱え続けていないか見直しましょう。"},{"art":"翼のある人物が二つの器の間で水を移しています。異なるものを混ぜ合わせる調和の姿です。","upright":"節度、調和、回復。急がず少しずつ整えることが実を結びます。","reversed":"不均衡、極端、焦り。生活や気持ちの配分を立て直しましょう。"},{"art":"暗い玉座に座る悪魔と、足元につながれた人々。恐れや欲望による束縛を表します。","upright":"執着、誘惑、依存。何に縛られているのか自覚することが第一歩。","reversed":"束縛からの解放、気づき。古い依存を断ち切るきっかけが訪れます。"},{"art":"稲妻に打たれ崩れる高い塔。激しい光と落下する破片は、突然の変化を示します。","upright":"衝撃、崩壊、真実の露見。古い前提が崩れ、新しい土台が必要に。","reversed":"変化の先延ばし、内面の動揺。小さな兆候を見逃さないことが大切です。"},{"art":"星の輝く夜、水辺に身をかがめる女性。静かな水面と星明かりは、希望と癒やしの象徴です。","upright":"希望、回復、ひらめき。未来を信じる気持ちが少しずつ戻ります。","reversed":"失望、不安、自信の低下。遠い理想だけでなく身近な光を探して。"},{"art":"大きな月の下に続く道と水辺の生き物。薄明かりの景色が、不確かさと無意識を表します。","upright":"直感、幻想、不安。見えていない事情を慎重に探る必要があります。","reversed":"混乱の収束、誤解の解消。曖昧だったことが徐々に明らかになります。"},{"art":"輝く太陽の下に立つ人物と花々。明るい光が、生命力と喜びを満たしています。","upright":"成功、活力、祝福。素直な喜びや成果を受け取れるとき。","reversed":"一時的な陰り、空回り。焦らず自信と明るさを取り戻しましょう。"},{"art":"天使が空から呼びかけ、地上の人々が応える場面。目覚めと新たな判断の象徴です。","upright":"覚醒、再評価、再出発。過去を見直し、新たな決断を下す機会。","reversed":"決断の先延ばし、後悔、自己否定。過去に縛られず前を向きましょう。"},{"art":"光の輪の中心に立つ人物と四隅を囲む存在。ひとつの旅が完成する姿を表します。","upright":"完成、達成、統合。努力がまとまり、次の段階へ進む準備が整います。","reversed":"未完成、停滞、達成感の不足。最後の仕上げに目を向けましょう。"}];
function cardGuide(c){const g=CARD_GUIDE[Number(c.n)];if(!g)return '';return `<section class="reading-block card-guide" aria-label="${c.jp}の絵柄と意味"><h4>絵柄とカードの意味</h4><p class="guide-label">絵柄の象徴</p><p>${g.art}</p><div class="guide-meanings"><div class="guide-meaning ${c.reversed?'':'chosen'}"><strong>正位置${c.reversed?'':'・今回'}</strong><p>${g.upright}</p></div><div class="guide-meaning ${c.reversed?'chosen':''}"><strong>逆位置${c.reversed?'・今回':''}</strong><p>${g.reversed}</p></div></div></section>`}
let resultCarouselTimer=null;
function cardImagePath(c){return `images/${String(c.n).padStart(2,'0')}-${c.slug}.png`}
function cardArt(c,extra=''){return `<div class="result-card-frame ${extra} ${state.visual?.glow||''} ${state.visual?.filter||''} ${cardFxClass(c)}">${specialFxMarkup()}<div class="card-aura"></div><img class="${c.reversed?'reversed':''}" src="${cardImagePath(c)}" alt="${c.jp}" loading="eager"></div>`}
function openCardLightbox(c){
  let box=document.querySelector('.card-lightbox');
  if(!box){box=document.createElement('div');box.className='card-lightbox';box.innerHTML='<button class="lightbox-close" aria-label="閉じる">×</button><div class="lightbox-stage"></div>';document.body.appendChild(box);box.onclick=e=>{if(e.target===box||e.target.closest('.lightbox-close'))box.classList.remove('show')}}
  box.querySelector('.lightbox-stage').innerHTML=`<img class="${c.reversed?'reversed':''}" src="${cardImagePath(c)}" alt="${c.jp}">`;
  box.classList.add('show');
}
function setupResultArtClicks(){
  const btn=document.querySelector('.v53-single .art-button');
  const hit=document.querySelector('.v53-single .single-card-hitarea');
  if(!btn||!hit)return;
  const open=e=>{e.preventDefault();e.stopPropagation();openCardLightbox(state.selected[0])};
  hit.addEventListener('pointerup',open);
  hit.addEventListener('click',open);
  btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){open(e)}});
}

function setupThreeCarousel(){
  if(resultCarouselTimer)clearInterval(resultCarouselTimer);
  const stage=document.querySelector('.three-carousel'); if(!stage)return;
  const slides=[...stage.querySelectorAll('.carousel-card')], dots=[...stage.querySelectorAll('.carousel-dot')];
  let active=0;
  const show=i=>{active=(i+slides.length)%slides.length;slides.forEach((el,n)=>{const d=n-active;el.classList.toggle('active',n===active);el.classList.toggle('prev',d===-1||d===slides.length-1);el.classList.toggle('next',d===1||d===-(slides.length-1));el.setAttribute('aria-hidden',n===active?'false':'true')});dots.forEach((d,n)=>d.classList.toggle('active',n===active));const c=state.selected[active];document.querySelector('.carousel-reading').innerHTML=`<h3>${modes[state.mode].positions[active]}：${c.jp}</h3><div class="orientation">${c.en}・${orientation(c)}</div><p><b>${key(c)}</b></p><p>${mainMessage(c)}</p>${cardGuide(c)}`}
  const restart=()=>{clearInterval(resultCarouselTimer);resultCarouselTimer=setInterval(()=>show(active+1),5200)};
  stage.querySelector('.carousel-prev').onclick=()=>{show(active-1);restart()};stage.querySelector('.carousel-next').onclick=()=>{show(active+1);restart()};dots.forEach((d,n)=>d.onclick=()=>{show(n);restart()});slides.forEach((el,n)=>el.onclick=()=>{if(n===active)openCardLightbox(state.selected[n]);else{show(n);restart()}});show(0);restart();
}
function repeatedReadingWarning(){const count=activeDailyCount();if(count<5)return '';return `<div class="reading-block spirit-advice"><h4>精霊からの戒め</h4><p>${count>=100?'何度問い直しても、答えが確かになるわけではありません。いったんカードを置き、自分の判断に戻りましょう。':count>=30?'繰り返し占うほど、警告の色が濃くなります。望む答えを探すより、すでに得た示唆を振り返りましょう。':'答えを急がず、一度の占いを大切にしてください。繰り返すほどカードの抽選傾向は警告寄りに変化します。'}</p></div>`}
function renderResult(){
  if(resultCarouselTimer){clearInterval(resultCarouselTimer);resultCarouselTimer=null}
  const body=$('#result-body');
  if(state.selected.length===1){const c=state.selected[0];body.innerHTML=`<div class="v53-single"><button type="button" class="art-button" data-card-index="0" aria-label="カードを拡大表示">${cardArt(c,'result-art-large')}<span class="single-card-hitarea" aria-hidden="true"></span></button><div class="single-summary"><h3>${c.jp}</h3><div class="orientation">${c.en}・${orientation(c)}</div><p><b>${key(c)}</b></p><p>${mainMessage(c)}</p></div></div>${cardGuide(c)}<div class="reading-block"><h4>今のあなたへ</h4><p>${interpret(c)}</p></div><div class="reading-block"><h4>今日からできる小さな行動</h4><p>${c.action}</p></div>`;setupResultArtClicks()}
  else{body.innerHTML=`<div class="three-carousel" aria-label="過去・現在・未来のカード"><button class="carousel-nav carousel-prev" aria-label="前のカード">‹</button><div class="carousel-stage">${state.selected.map((c,i)=>`<button class="carousel-card" data-index="${i}" aria-label="${modes[state.mode].positions[i]} ${c.jp}">${cardArt(c,'carousel-art')}<span>${modes[state.mode].positions[i]}</span></button>`).join('')}</div><button class="carousel-nav carousel-next" aria-label="次のカード">›</button><div class="carousel-dots">${state.selected.map((_,i)=>`<button class="carousel-dot" aria-label="${i+1}枚目"></button>`).join('')}</div></div><div class="carousel-reading"></div><div class="reading-block"><h4>三枚をつなぐ物語</h4><p>${threeStory()}</p></div><div class="reading-block"><h4>次の一歩</h4><p>${state.selected[1].action}</p></div>`;setupThreeCarousel()}
  body.insertAdjacentHTML('beforeend',repeatedReadingWarning());
}
function threeStory(){const [a,b,c]=state.selected;return `過去には「${a.jp}」が示す${key(a)}の流れがありました。現在は「${b.jp}」の${key(b)}が中心にあります。この流れを受け止めることで、未来の「${c.jp}」が示す${key(c)}へ向かいます。未来は決定ではなく、今の選び方によって形を変える余地があります。`}
$('#again').onclick=()=>{state.selected=[];document.body.classList.remove('v4-reading');go('modes')};
$('#save-result').onclick=saveImage;
async function saveImage(){const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#19112f');g.addColorStop(1,'#05040b');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#d9b66f';x.lineWidth=3;x.strokeRect(42,42,996,1266);x.textAlign='center';x.fillStyle='#d9b66f';x.font='32px serif';x.fillText('人生再点火 TAROT',540,105);x.fillStyle='#f2ead7';x.font='bold 54px serif';x.fillText(modes[state.mode].label,540,180);if(state.selected.length===1){const card=state.selected[0];const img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`);x.save();if(card.reversed){x.translate(540,555);x.rotate(Math.PI);x.drawImage(img,-180,-270,360,540)}else{x.drawImage(img,360,285,360,540)}x.restore();x.fillStyle='#f2ead7';x.font='bold 46px serif';x.fillText(`${card.jp}・${orientation(card)}`,540,900);wrapText(x,mainMessage(card),540,970,860,48,'30px serif');x.fillStyle='#d9b66f';x.font='bold 28px serif';x.fillText('今日からできる小さな行動',540,1130);x.fillStyle='#f2ead7';wrapText(x,card.action,540,1185,860,42,'27px serif')}else{x.font='bold 36px serif';for(let i=0;i<3;i++){const card=state.selected[i],img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`),cx=230+i*310;x.save();if(card.reversed){x.translate(cx,490);x.rotate(Math.PI);x.drawImage(img,-115,-172,230,345)}else{x.drawImage(img,cx-115,318,230,345)}x.restore();x.fillStyle='#d9b66f';x.font='25px serif';x.fillText(modes[state.mode].positions[i],cx,710);x.fillStyle='#f2ead7';x.font='bold 28px serif';x.fillText(card.jp,cx,750)}x.fillStyle='#f2ead7';wrapText(x,threeStory(),540,865,900,45,'28px serif')}x.fillStyle='#81778d';x.font='22px serif';x.fillText('スキ3000突破記念・読者無料サービス',540,1280);const a=document.createElement('a');a.download=`reignite-tarot-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click()}
function loadImage(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,font){ctx.font=font;let line='';const chars=[...text];for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=ch;y+=lineHeight}else line=test}ctx.fillText(line,x,y)}
// stars
const canvas=$('#stars'),ctx=canvas.getContext('2d');let stars=[];function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);stars=Array.from({length:Math.min(150,innerWidth/7)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.4+.2,a:Math.random()*.65+.15,s:Math.random()*.003+.001}))}function drawStars(t=0){ctx.clearRect(0,0,innerWidth,innerHeight);for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(t*s.s+s.x));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}requestAnimationFrame(drawStars)}addEventListener('resize',resize);resize();drawStars();

// Developer preview controls: only available with ?test=1.
if(TEST_MODE){
  const panel=$('#phase4-preview');if(panel){panel.hidden=false;$('#phase4-set-count').onclick=()=>{const n=Number($('#phase4-count-input').value);if(Number.isFinite(n)){const count=Math.max(0,Math.floor(n));setPreviewCount(count);updateSpiritMood(count);if(SPIRIT_EVENTS[count])openSpiritEvent(count,()=>{})}};$('#phase4-reset').onclick=()=>{setPreviewCount(0);updateSpiritMood(0)}}
  updateSpiritMood(getPreviewCount());
}
updateReadingCounters();

// Development-only switches. Production builds must remove these controls and mock entitlements.
if(TEST_MODE){const p=$('#phase5-dev');if(p){p.hidden=false;$('#phase5-free').onclick=()=>phase5SetSubscriber(false);$('#phase5-paid').onclick=()=>phase5SetSubscriber(true)}}
phase5Status();
