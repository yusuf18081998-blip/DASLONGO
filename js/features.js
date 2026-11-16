/* DASLONGO qo‘shimchalari: har testda 3 yurak, xatolar mashqi, yutuqlar, sandiq, ovoz.
   app.js dan keyin yuklanadi va kerakli funksiyalarni kengaytiradi. */
state.mistakes=Array.isArray(state.mistakes)?state.mistakes:[];
state.badges=Array.isArray(state.badges)?state.badges:[];
state.flawless=Number(state.flawless)||0;
if(typeof state.sound!=="boolean")state.sound=true;

let fxCtx,fxWait;
function fxBeep(kind){
  if(!state.sound)return;
  try{
    fxCtx=fxCtx||new(window.AudioContext||window.webkitAudioContext)();
    const seq={ok:[[660,.09],[880,.14]],bad:[[220,.18],[160,.22]],win:[[523,.1],[659,.1],[784,.1],[1047,.25]]}[kind];
    let t=fxCtx.currentTime;
    for(const[f,d]of seq){
      const o=fxCtx.createOscillator(),g=fxCtx.createGain();
      o.type=kind==="bad"?"sawtooth":"sine";o.frequency.value=f;
      g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
      o.connect(g);g.connect(fxCtx.destination);o.start(t);o.stop(t+d);t+=d;
    }
  }catch(e){}
}

/* ---- Yutuqlar ---- */
const FX_BADGES=[
  ["first","🌱","Birinchi modul",s=>fxDone(s)>=1],
  ["six","🏁","6 ta modul",s=>fxDone(s)>=6],
  ["s3","🔥","3 kunlik seriya",s=>s.bestStreak>=3],
  ["s7","⚡","Haftalik seriya",s=>s.bestStreak>=7],
  ["xp100","💎","100 XP",s=>s.xpEarned>=100],
  ["flawless","🎯","Xatosiz test",s=>s.flawless>=1],
  ["daily","✦","Kunlik chaqiriq",s=>s.challengeCount>=1],
  ["fixer","🛠️","Xatolar ustida ishladingiz",s=>s.fixed>=5]
];
function fxDone(s){return Object.values(s.completed||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0)}
function fxBadges(){
  for(const b of FX_BADGES){
    if(!state.badges.includes(b[0])&&b[3](state)){state.badges.push(b[0]);setTimeout(()=>showToast(`${b[1]} Yangi yutuq: ${b[2]}!`),2200)}
  }
}

/* ---- Xatolarni eslab qolish ---- */
function fxRemember(q){
  const key=state.course+"|"+q.tip;
  if(state.mistakes.some(m=>m.key===key))return;
  state.mistakes.unshift({key,course:state.course,q:q.q,a:q.a,ok:q.ok,tip:q.tip});
  state.mistakes=state.mistakes.slice(0,40);
}
function fxForgive(q){
  const key=state.course+"|"+q.tip,before=state.mistakes.length;
  state.mistakes=state.mistakes.filter(m=>m.key!==key);
  if(state.mistakes.length<before)state.fixed=(Number(state.fixed)||0)+1;
}
function fxPractice(){
  const list=state.mistakes.filter(m=>m.course===state.course);
  if(!list.length){showToast("Hozircha xato yo‘q — ajoyib!");return}
  lesson={index:0,questions:list.slice(0,5).map(m=>({q:m.q,a:m.a,ok:m.ok,tip:m.tip})),questionIndex:0,answered:false,selected:null,challenge:false,practice:true,stage:"quiz",hearts:maxHearts(),miss:0};
  document.getElementById("lesson-modal").classList.remove("hidden");
  renderLesson();
}
function fxFinishPractice(){
  state.xp+=5;state.xpEarned+=5;state.goalXp+=5;fxBadges();save();closeLesson();render();fxBeep("win");
  showToast("Mashq tugadi — +5 XP!");
}

/* ---- Har testda alohida yuraklar ---- */
const fxBeginTest=beginLessonTest;
beginLessonTest=function(){
  fxBeginTest();
  if(lesson&&lesson.stage==="quiz"){lesson.hearts=maxHearts();lesson.miss=0;renderLesson()}
};
const fxRenderLesson=renderLesson;
renderLesson=function(feedback){
  fxRenderLesson(feedback);
  if(!lesson)return;
  const h=document.getElementById("lesson-hearts");
  if(h&&lesson.stage==="quiz"&&lesson.hearts!=null)h.textContent=lesson.hearts;
  const k=document.querySelector("#lesson-content .section-kicker");
  if(lesson.practice&&k){
    k.textContent=`XATOLAR USTIDA ISHLASH · SAVOL ${lesson.questionIndex+1} / ${lesson.questions.length}`;
    const t=document.getElementById("lesson-title");if(t)t.textContent="Mashq";
    const b=document.querySelector("#lesson-content .modal-footer .btn-green");
    if(b&&/yakunlash/.test(b.textContent))b.textContent="Mashqni yakunlash";
  }else if(k){
    k.textContent=k.textContent.replace(/\/ 6 /,`/ ${course().modules.length} `);
  }
};
submitLesson=function(){
  if(!lesson||lesson.selected==null)return;
  const q=lesson.questions[lesson.questionIndex];
  lesson.answered=true;
  if(lesson.selected===q.ok){fxBeep("ok");fxForgive(q);save();renderLesson("success");return}
  fxBeep("bad");lesson.miss=(lesson.miss||0)+1;fxRemember(q);
  if(lesson.hearts==null)lesson.hearts=maxHearts();
  lesson.hearts-=1;save();
  if(lesson.hearts<=0){fxNoHearts();return}
  lesson.answered=false;lesson.selected=null;renderLesson("wrong");
};
function fxNoHearts(){
  clearInterval(fxWait);
  const until=Date.now()+30000;
  document.getElementById("lesson-hearts").textContent="0";
  document.getElementById("lesson-content").innerHTML=`<div class="text-center"><div class="text-5xl mb-3">💔</div><h2 id="lesson-title">Yuraklar tugadi</h2><p class="lead">Xatolar soni yetdi, sinov to‘xtadi. XP evaziga davom eting yoki biroz kuting.</p><div class="grid gap-3 mt-5"><button class="btn3d btn-green px-5 py-3" onclick="fxRevive(true)">❤️ 50 XP bilan tiklash</button><div class="muted text-sm" id="revive-timer"></div><button class="btn3d btn-dark px-5 py-3" onclick="closeLesson()">Chiqish</button></div></div>`;
  const tick=()=>{
    const el=document.getElementById("revive-timer");
    if(!lesson||!el){clearInterval(fxWait);return}
    const r=Math.ceil((until-Date.now())/1000);
    if(r<=0){clearInterval(fxWait);fxRevive(false)}else el.textContent=`⏳ ${r} soniyadan keyin bepul tiklanadi`;
  };
  tick();fxWait=setInterval(tick,1000);
}
function fxRevive(pay){
  if(!lesson)return;
  if(pay){if(state.xp<50){showToast("XP yetarli emas. Kuting yoki chiqing.");return}state.xp-=50;save();render()}
  clearInterval(fxWait);
  lesson.hearts=maxHearts();lesson.answered=false;lesson.selected=null;
  renderLesson();showToast("Yuraklar tiklandi!");
}
const fxClose=closeLesson;
closeLesson=function(){clearInterval(fxWait);fxClose()};

/* ---- Mashq tugashi, sandiq ---- */
const fxNext=nextLessonQuestion;
nextLessonQuestion=function(){
  if(lesson&&lesson.practice&&lesson.questionIndex===lesson.questions.length-1){fxFinishPractice();return}
  fxNext();
};
const fxFinish=finishLesson;
finishLesson=function(){
  const l=lesson,flawless=!!l&&!l.challenge&&!l.miss,before=(state.completed[state.course]||[]).length;
  fxFinish();
  if((state.completed[state.course]||[]).length>before){
    if(flawless)state.flawless+=1;
    let msg;const r=Math.random();
    if(r<.6){const x=5+Math.floor(Math.random()*11);state.xp+=x;state.xpEarned+=x;state.goalXp+=x;msg=`🎁 Sandiq: +${x} XP!`}
    else if(r<.85){state.shields+=1;msg="🎁 Sandiq: seriya qalqoni!"}
    else{state.xp+=25;state.xpEarned+=25;state.goalXp+=25;msg="🎁 Katta sandiq: +25 XP!"}
    fxBadges();save();render();fxBeep("win");
    setTimeout(()=>showToast(msg),1500);
  }
};

/* ---- O‘ng paneldagi karta ---- */
function fxPanel(){
  let p=document.getElementById("fx-panel");
  if(!p){
    const host=document.getElementById("quests-list")?.closest("section");
    if(!host)return;
    p=document.createElement("section");p.id="fx-panel";p.className="panel p-4";host.after(p);
  }
  const n=state.mistakes.filter(m=>m.course===state.course).length;
  p.innerHTML=`<h2 class="side-title">Xatolar ustida ishlash</h2><p class="muted text-xs">${n?`${n} ta savolni qayta mashq qiling.`:"Hozircha xato yo‘q."}</p><button class="btn3d btn-blue px-4 py-2 w-full" ${n?"":"disabled"} onclick="fxPractice()">Mashqni boshlash</button><h2 class="side-title mt-4">Yutuqlar</h2><div class="flex flex-wrap gap-2">${FX_BADGES.map(b=>`<span title="${b[2]}" class="text-2xl ${state.badges.includes(b[0])?"":"opacity-25 grayscale"}">${b[1]}</span>`).join("")}</div><label class="muted text-xs mt-3 flex gap-2 items-center"><input type="checkbox" ${state.sound?"checked":""} onchange="state.sound=this.checked;save()"> Ovozli effektlar</label>`;
}
const fxRenderQuests=renderQuests;
renderQuests=function(){fxRenderQuests();fxPanel()};
fxBadges();save();render();
