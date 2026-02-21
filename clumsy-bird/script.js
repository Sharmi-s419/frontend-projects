// ═══════════════════════════════════════════════
//  CLUMSY BIRD  –  full canvas game
// ═══════════════════════════════════════════════
const W = 480, H = 640;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
canvas.style.width  = W+'px';
canvas.style.height = H+'px';

// ── Live sidebar score
const liveScoreEl = document.getElementById('liveScore');
const liveBestEl  = document.getElementById('liveBest');
function updateSidebarScore(){
  liveScoreEl.textContent = score;
  liveBestEl.textContent  = best;
  liveScoreEl.classList.remove('pop');
  void liveScoreEl.offsetWidth;
  liveScoreEl.classList.add('pop');
  setTimeout(()=>liveScoreEl.classList.remove('pop'),150);
}

// ── Panels & buttons
const startPanel    = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const goScore       = document.getElementById('goScore');
const goBest        = document.getElementById('goBest');
const goMedal       = document.getElementById('goMedal');
const newBadge      = document.getElementById('newBadge');
const retryBtn      = document.getElementById('retryBtn');
const shareBtn      = document.getElementById('shareBtn');
const toast         = document.getElementById('toast');

// ── State machine
const STATE = { START:0, PLAYING:1, DYING:2, DEAD:3 };
let state = STATE.START;

// ── Config  (all velocities are px per 16ms tick, scaled by dt in update)
const GRAVITY    = 0.022;   // acceleration per ms
const FLAP_VEL   = -5.5;    // instant upward velocity on flap
const MAX_VY     = 9;       // terminal fall speed
const PIPE_SPEED = 0.10;    // px per ms  (~1.6px/frame @60fps)
const PIPE_GAP   = 150;
const PIPE_W     = 64;
const PIPE_INTERVAL = 1900; // ms between pipes
const GROUND_H   = 80;

// ── Bird
const bird = {
  x: 90, y: H/2 - 20,
  vy: 0, angle: 0,
  flapFrame: 0, flapTimer: 0,
  deadY: 0, deadVy: 0, deadAngle: 0,
  reset(){
    this.x=90; this.y=H/2-20;
    this.vy=0; this.angle=0;
    this.flapFrame=0; this.flapTimer=0;
  },
  flap(){
    this.vy = FLAP_VEL;
    this.flapFrame = 1; this.flapTimer = 0;
    spawnParticles(this.x+16, this.y+12, '#ffe566', 5);
  },
  update(dt){
    this.vy += GRAVITY * dt;
    this.vy  = Math.min(this.vy, MAX_VY);   // cap fall speed
    this.y  += this.vy * (dt / 16);
    this.angle = Math.max(-28, Math.min(90, this.vy * 6));
    this.flapTimer += dt;
    if(this.flapTimer > 120){ this.flapFrame = (this.flapFrame+1)%3; this.flapTimer=0; }
  },
  startDie(){
    this.deadY = this.y; this.deadVy = -4; this.deadAngle = this.angle;
  },
  updateDead(dt){
    this.deadVy += 0.35 * (dt/16);
    this.deadY  += this.deadVy * (dt/16);
    this.deadAngle = Math.min(this.deadAngle + 5*(dt/16), 90);
  }
};

// ── Pipes
let pipes = [];
let pipeTimer = 0;
function spawnPipe(){
  const minY = 80, maxY = H - GROUND_H - PIPE_GAP - 80;
  const topH = Math.random()*(maxY-minY)+minY;
  pipes.push({ x:W+10, topH, scored:false });
}

// ── Score
let score=0, best=parseInt(localStorage.getItem('cb_best')||'0',10);

// ── Particles
let particles=[];
function spawnParticles(x,y,color,n){
  for(let i=0;i<n;i++){
    const angle=Math.random()*Math.PI*2;
    const spd=1+Math.random()*3;
    particles.push({x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,
      life:1,color,size:2+Math.random()*3});
  }
}
function updateParticles(){
  particles=particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=0.04;
    return p.life>0;
  });
}

// ── Clouds
let clouds=[];
for(let i=0;i<5;i++) clouds.push({x:Math.random()*W,y:20+Math.random()*160,w:60+Math.random()*80,spd:0.3+Math.random()*0.4});

// ── Stars (night sky parallax)
let stars=[];
for(let i=0;i<60;i++) stars.push({x:Math.random()*W,y:Math.random()*(H-GROUND_H),size:Math.random()*2,alpha:Math.random()});

// ── Ground scroll
let groundOffset=0;

// ── Score flash
let scoreFlash=0;

// ── Input
function inputAction(){
  if(state===STATE.START){
    startGame();
  } else if(state===STATE.PLAYING){
    bird.flap();
  }
}
document.addEventListener('keydown', e=>{
  if(e.code==='Space'||e.code==='ArrowUp') inputAction();
});
document.addEventListener('pointerdown', e=>{
  if(gameOverPanel.classList.contains('visible')) return;
  inputAction();
});
retryBtn.addEventListener('click', e=>{e.stopPropagation(); startGame();});
shareBtn.addEventListener('click', e=>{
  e.stopPropagation();
  const txt=`I scored ${score} on Clumsy Bird! 🐦 Can you beat me?`;
  if(navigator.share) navigator.share({title:'Clumsy Bird',text:txt}).catch(()=>{});
  else navigator.clipboard.writeText(txt).then(()=>showToast('Copied to clipboard!'));
});

// ═══════════════════════════════════════════════
//  DRAW HELPERS
// ═══════════════════════════════════════════════

function drawSky(){
  // Day-night gradient
  const grad=ctx.createLinearGradient(0,0,0,H-GROUND_H);
  grad.addColorStop(0,'#0d1b4b');
  grad.addColorStop(0.4,'#1a3a6e');
  grad.addColorStop(0.7,'#3a7bd5');
  grad.addColorStop(1,'#7ec8f8');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H-GROUND_H);
}

function drawStars(){
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,240,${s.alpha})`;
    ctx.fill();
  });
}

function drawClouds(){
  ctx.save();
  clouds.forEach(c=>{
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(c.x,c.y,c.w/2,c.w/5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x-c.w*0.2,c.y-c.w*0.12,c.w*0.28,c.w*0.18,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x+c.w*0.18,c.y-c.w*0.1,c.w*0.22,c.w*0.15,0,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function drawMoon(){
  ctx.save();
  ctx.fillStyle='rgba(255,245,180,0.9)';
  ctx.shadowColor='rgba(255,245,180,0.5)'; ctx.shadowBlur=20;
  ctx.beginPath();
  ctx.arc(340,55,28,0,Math.PI*2); ctx.fill();
  // crater
  ctx.fillStyle='rgba(220,210,150,0.5)';
  ctx.beginPath(); ctx.arc(330,48,7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(348,62,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawGround(){
  // dark strip
  ctx.fillStyle='#3e2d1c';
  ctx.fillRect(0,H-GROUND_H,W,GROUND_H);
  // grass top
  ctx.fillStyle='#4daa2e';
  ctx.fillRect(0,H-GROUND_H,W,14);
  ctx.fillStyle='#3a8a20';
  ctx.fillRect(0,H-GROUND_H+14,W,6);
  // dirt scrolling lines
  ctx.strokeStyle='rgba(255,255,255,0.06)';
  ctx.lineWidth=2;
  for(let i=0;i<8;i++){
    const rx=((groundOffset*0.5)%(W/4))+i*(W/4);
    ctx.beginPath();
    ctx.moveTo(rx-50,H-GROUND_H+28);
    ctx.lineTo(rx+50,H-GROUND_H+28);
    ctx.stroke();
  }
}

function drawPipe(x, topH){
  const botY = topH + PIPE_GAP;
  const botH = H - GROUND_H - botY;
  const grad = ctx.createLinearGradient(x,0,x+PIPE_W,0);
  grad.addColorStop(0,'#5ac626'); grad.addColorStop(0.4,'#7ee84a'); grad.addColorStop(1,'#3a9010');

  // top pipe body
  ctx.fillStyle=grad;
  ctx.fillRect(x,0,PIPE_W,topH-18);
  // top cap
  ctx.fillRect(x-6,topH-28,PIPE_W+12,28);
  // highlights
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.fillRect(x+8,0,10,topH-18);

  // bottom pipe body
  ctx.fillStyle=grad;
  ctx.fillRect(x,botY+18,PIPE_W,botH);
  // bottom cap
  ctx.fillRect(x-6,botY,PIPE_W+12,28);
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.fillRect(x+8,botY+28,10,botH);

  // border
  ctx.strokeStyle='#2a7800'; ctx.lineWidth=2.5;
  ctx.strokeRect(x,0,PIPE_W,topH-18);
  ctx.strokeRect(x-6,topH-28,PIPE_W+12,28);
  ctx.strokeRect(x,botY+18,PIPE_W,botH);
  ctx.strokeRect(x-6,botY,PIPE_W+12,28);
}

// Wing positions for 3 frames: up, mid, down
const WING_Y = [-10, 0, 10];

function drawBird(bx, by, angle, frame, dead=false){
  ctx.save();
  ctx.translate(bx+20, by+18);
  ctx.rotate(angle*Math.PI/180);

  // shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0,20,18,6,0,0,Math.PI*2); ctx.fill();

  // body
  const bodyGrad=ctx.createRadialGradient(-4,-4,2,0,0,22);
  bodyGrad.addColorStop(0,'#ffe97a');
  bodyGrad.addColorStop(0.6,'#f5c518');
  bodyGrad.addColorStop(1,'#c99600');
  ctx.fillStyle=bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0,0,20,16,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#9a6e00'; ctx.lineWidth=2; ctx.stroke();

  // wing
  ctx.fillStyle='#f0a800';
  ctx.beginPath();
  const wy=WING_Y[frame];
  ctx.ellipse(-8,wy,12,7,Math.PI*0.15,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#9a6e00'; ctx.lineWidth=1.5; ctx.stroke();

  // belly
  ctx.fillStyle='rgba(255,245,200,0.7)';
  ctx.beginPath();
  ctx.ellipse(4,4,12,9,0.2,0,Math.PI*2); ctx.fill();

  // eye white
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(10,-4,7,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#555'; ctx.lineWidth=1.5; ctx.stroke();

  if(dead){
    // X eyes
    ctx.strokeStyle='#333'; ctx.lineWidth=2.5;
    ['M 7,-7 L 13,-1','M 13,-7 L 7,-1'].forEach(d=>{
      const p=new Path2D(d); ctx.stroke(p);
    });
  } else {
    // pupil
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath(); ctx.arc(11,-4,3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(12,-5,1.2,0,Math.PI*2); ctx.fill();
  }

  // beak
  ctx.fillStyle='#e96c0a';
  ctx.beginPath();
  ctx.moveTo(16,-2); ctx.lineTo(26,0); ctx.lineTo(16,4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#b04800'; ctx.lineWidth=1.5; ctx.stroke();

  ctx.restore();
}

function drawScore(){
  const s = score.toString();
  ctx.save();
  ctx.font = 'bold 54px Bangers, cursive';
  ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=8;

  if(scoreFlash>0){
    const sc = 1+scoreFlash*0.3;
    ctx.translate(W/2,52);
    ctx.scale(sc,sc);
    ctx.translate(-W/2,-52);
    ctx.fillStyle='#ffe566';
  } else {
    ctx.fillStyle='white';
  }
  ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=5;
  ctx.strokeText(s,W/2,62);
  ctx.fillText(s,W/2,62);
  ctx.restore();
}

function drawParticles(){
  particles.forEach(p=>{
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha=1;
}

// Draw the mini bird on the start screen preview canvas
(function drawPreviewBird(){
  const pc=document.getElementById('birdPreview');
  const pctx=pc.getContext('2d');
  let f=0;
  setInterval(()=>{
    pctx.clearRect(0,0,80,64);
    pctx.save();
    pctx.translate(40,32);
    pctx.rotate(Math.sin(Date.now()*0.003)*0.15);
    // body
    const g=pctx.createRadialGradient(-4,-4,2,0,0,22);
    g.addColorStop(0,'#ffe97a'); g.addColorStop(0.6,'#f5c518'); g.addColorStop(1,'#c99600');
    pctx.fillStyle=g;
    pctx.beginPath(); pctx.ellipse(0,0,20,16,0,0,Math.PI*2); pctx.fill();
    pctx.strokeStyle='#9a6e00'; pctx.lineWidth=2; pctx.stroke();
    // wing
    pctx.fillStyle='#f0a800';
    pctx.beginPath();
    const wy2=WING_Y[f];
    pctx.ellipse(-8,wy2,12,7,Math.PI*0.15,0,Math.PI*2); pctx.fill();
    pctx.strokeStyle='#9a6e00'; pctx.lineWidth=1.5; pctx.stroke();
    // eye
    pctx.fillStyle='white'; pctx.beginPath(); pctx.arc(10,-4,7,0,Math.PI*2); pctx.fill();
    pctx.strokeStyle='#555'; pctx.lineWidth=1.5; pctx.stroke();
    pctx.fillStyle='#1a1a1a'; pctx.beginPath(); pctx.arc(11,-4,3.5,0,Math.PI*2); pctx.fill();
    pctx.fillStyle='white'; pctx.beginPath(); pctx.arc(12,-5,1.2,0,Math.PI*2); pctx.fill();
    // beak
    pctx.fillStyle='#e96c0a';
    pctx.beginPath(); pctx.moveTo(16,-2); pctx.lineTo(26,0); pctx.lineTo(16,4); pctx.closePath(); pctx.fill();
    pctx.restore();
    f=(f+1)%3;
  },150);
})();

// ═══════════════════════════════════════════════
//  COLLISION DETECTION
// ═══════════════════════════════════════════════
function checkCollision(){
  const bx=bird.x+5, by=bird.y+5, bw=30, bh=26;
  // Ground / ceiling
  if(bird.y+bh >= H-GROUND_H || bird.y<=0) return true;
  for(const p of pipes){
    const px=p.x-6, pw=PIPE_W+12;
    const botY=p.topH+PIPE_GAP;
    // top pipe cap area
    if(bx+bw>px && bx<px+pw){
      if(by<p.topH || by+bh>botY) return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════
//  GAME LIFECYCLE
// ═══════════════════════════════════════════════
function startGame(){
  score=0; pipes=[]; particles=[];
  bird.reset();
  pipeTimer=0;
  state=STATE.PLAYING;
  liveScoreEl.textContent='0';
  liveBestEl.textContent=best;
  startPanel.classList.remove('visible'); startPanel.classList.add('hidden');
  gameOverPanel.classList.remove('visible'); gameOverPanel.classList.add('hidden');
  bird.flap();
}

function triggerDeath(){
  state=STATE.DYING;
  bird.startDie();
  spawnParticles(bird.x+20,bird.y+18,'#ffe566',14);
  spawnParticles(bird.x+20,bird.y+18,'#e94e3d',8);
  // Flash screen
  let flashes=0;
  const fi=setInterval(()=>{
    if(++flashes>=5){ clearInterval(fi); showGameOver(); }
  },80);
}

function showGameOver(){
  state=STATE.DEAD;
  const isNew=score>best;
  if(isNew){ best=score; localStorage.setItem('cb_best',best); }
  liveBestEl.textContent = best;

  goScore.textContent=score;
  goBest.textContent=best;
  newBadge.style.display=isNew?'inline-block':'none';

  // Medal
  let medalClass='medal-none',medalIcon='💀',stars=0;
  if(score>=40){medalClass='medal-gold';medalIcon='🥇';stars=3;}
  else if(score>=20){medalClass='medal-silver';medalIcon='🥈';stars=3;}
  else if(score>=10){medalClass='medal-bronze';medalIcon='🥉';stars=2;}
  else if(score>=5){medalClass='medal-bronze';medalIcon='🥉';stars=1;}
  goMedal.className='medal '+medalClass;
  goMedal.textContent=medalIcon;
  ['st1','st2','st3'].forEach((id,i)=>{
    const el=document.getElementById(id);
    el.classList.remove('lit');
    if(i<stars) setTimeout(()=>el.classList.add('lit'),(i+1)*200+500);
  });

  gameOverPanel.classList.remove('hidden'); gameOverPanel.classList.add('visible');
}

function showToast(msg){
  toast.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2500);
}

// ═══════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════
let lastTime=0, deathTimer=0;

function loop(ts){
  const dt=Math.min(ts-lastTime,50); lastTime=ts;

  ctx.clearRect(0,0,W,H);

  // Background
  drawSky();
  drawStars();
  drawMoon();
  drawClouds();

  // Update clouds
  clouds.forEach(c=>{
    c.x-=c.spd*(dt/16);
    if(c.x+c.w/2<0) c.x=W+c.w;
  });

  if(state===STATE.PLAYING){
    // Update
    pipeTimer+=dt;
    if(pipeTimer>PIPE_INTERVAL){ pipeTimer=0; spawnPipe(); }

    pipes=pipes.filter(p=>{
      p.x -= PIPE_SPEED * dt;
      // Score
      if(!p.scored && p.x+PIPE_W<bird.x){
        p.scored=true; score++;
        scoreFlash=1;
        spawnParticles(bird.x+20,bird.y,'#ffe566',8);
        updateSidebarScore();
      }
      return p.x>-PIPE_W-20;
    });
    if(scoreFlash>0) scoreFlash=Math.max(0,scoreFlash - (dt/16)*0.08);

    bird.update(dt);
    groundOffset += PIPE_SPEED * dt;
    updateParticles();

    if(checkCollision()) triggerDeath();
  }

  // Draw pipes
  pipes.forEach(p=>drawPipe(p.x,p.topH));

  drawGround();

  // Draw bird
  if(state===STATE.DYING || state===STATE.DEAD){
    const deadBird=bird;
    if(state===STATE.DYING){ deadBird.updateDead(dt); deathTimer+=dt; }
    drawBird(deadBird.x, deadBird.deadY, deadBird.deadAngle, 0, true);
  } else {
    drawBird(bird.x, bird.y, bird.angle, bird.flapFrame, false);
  }

  drawParticles();

  if(state===STATE.PLAYING || state===STATE.DYING){
    drawScore();
  }

  // Start screen idle animation — bird bobs
  if(state===STATE.START){
    bird.y = H/2-20 + Math.sin(ts*0.002)*12;
    drawBird(bird.x,bird.y,Math.sin(ts*0.002)*8,Math.floor(ts/150)%3,false);
    drawScore();
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);