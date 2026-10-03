/* Final anime presentation pass: environment lighting, petals, motes, vignette. Visual only. */
(function(){
 const old=window.requestAnimationFrame; let t=0;
 window.AnimeFinal={
  overlay(ctx,map,time){ if(!ctx||!map)return; t=time||0; const W=map.W,H=map.H; ctx.save();
   let sun=ctx.createRadialGradient(W*.18,H*.18,20,W*.18,H*.18,520); sun.addColorStop(0,'rgba(255,232,170,.12)');sun.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,W,H);
   ctx.globalCompositeOperation='screen'; for(let i=0;i<24;i++){let q=(t*.012+i*41)%2400,x=(i*137+q*.32)%W,y=(i*211+q*.15)%H,r=1.2+(i%3);ctx.globalAlpha=.12+(i%5)*.025;ctx.fillStyle=i%4?'#fff2b0':'#9eeaff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
   if(!map.theme.snow&&!map.theme.dead){for(let i=0;i<12;i++){let q=(t*.018+i*83)%1900,x=(i*197+q*.22)%W,y=(i*113+q*.38)%H;ctx.globalAlpha=.28;ctx.fillStyle=i%2?'#ffc4dc':'#fff0f6';ctx.save();ctx.translate(x,y);ctx.rotate(q*.01);ctx.beginPath();ctx.ellipse(0,0,5,2.2,.5,0,Math.PI*2);ctx.fill();ctx.restore()}}
   ctx.globalCompositeOperation='source-over';let v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.72);v.addColorStop(0,'rgba(14,10,32,0)');v.addColorStop(1,'rgba(14,10,32,.17)');ctx.globalAlpha=1;ctx.fillStyle=v;ctx.fillRect(0,0,W,H);ctx.restore();
  }
 };
})();