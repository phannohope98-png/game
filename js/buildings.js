/* Công trình: trụ không có HP. Elf/Phù thủy bắn trực tiếp; Người/Orc quản lý lính bảo vệ. */
(function(){
  const SLOT_R=36;
  function makeBuilding(type,level,slotId){
    const def=CONFIG.buildings[type];
    return {id:slotId,type,def,level,cost:def.cost,spent:def.cost,timer:0,pulse:0,attackCd:Math.random()*.4,
      get upgradeCost(){return this.level>=def.levels.length?null:def.upgradeCost[this.level];}};
  }
  const Buildings={SLOT_R,slots:[],highlight:false,game:null,
    init(game,pos){this.game=game;this.slots=pos.map((p,i)=>({id:i,x:p.x,y:p.y,building:null}));this.highlight=false;},
    slotAt(x,y){return this.slots.find(s=>Math.abs(s.x-x)<=SLOT_R+4&&Math.abs(s.y-y)<=SLOT_R+4)||null;},
    build(slot,type){const g=this.game,d=CONFIG.buildings[type];if(slot.building||!g.spendGold(d.cost))return false;slot.building=makeBuilding(type,Player.buildingLevel(type),slot.id);Effects.burst(slot.x,slot.y,'#ead7aa',18,170,.55,6,200);Effects.ring(slot.x,slot.y,10,62,.45,d.color,4);AudioSys.play('build');return true;},
    upgrade(slot){const b=slot.building,c=b&&b.upgradeCost;if(!b||c===null||!this.game.spendGold(c))return false;b.level++;b.spent+=c;for(const u of Units.list)if(u.alive&&u.ownerSlot===slot.id)this.placeGuard(u,slot);Effects.ring(slot.x,slot.y,10,74,.55,'#ffd86b',5);Effects.text(slot.x,slot.y-45,'Cấp '+b.level+'!','#ffd86b',22);return true;},
    sell(slot){const b=slot.building;if(!b)return 0;for(const u of [...Units.list])if(u.ownerSlot===slot.id)Units.kill(u);const r=Math.floor(b.spent*CONFIG.match.sellRefund);this.game.addGold(r,slot.x,slot.y);slot.building=null;return r;},
    placeGuard(u,slot){const b=slot.building;if(!b)return;const near=this.game.map.path.nearest(slot.x,slot.y);const p=this.game.map.path.pointAt(near.dist,{});const idx=u.fIndex||0;u.homeX=p.x+p.nx*((idx%2?1:-1)*13);u.homeY=p.y+p.ny*((idx%2?1:-1)*13);u.guardRange=b.def.levels[b.level-1].guardRange||150;},
    targetFor(s,b){const lv=b.def.levels[b.level-1],r=lv.range;let best=null,bd=-1;for(const e of Enemies.list){if(!e.alive)continue;const dx=e.x-s.x,dy=e.y-s.y;if(dx*dx+dy*dy<=r*r&&e.dist>bd){best=e;bd=e.dist;}}return best;},
    update(dt){for(const s of this.slots){const b=s.building;if(!b)continue;if(b.pulse>0)b.pulse-=dt;const d=b.def,lv=d.levels[b.level-1];if(d.mode==='tower'){b.attackCd-=dt;if(b.attackCd<=0){const t=this.targetFor(s,b);if(t){Combat.fire(d.projectile,s.x,s.y-35,t,0,0,lv.damage,1,d.aoeRadius||0);b.attackCd=d.attackSpeed;b.pulse=.16;AudioSys.play(d.projectile==='arrow'?'arrow':'magic');}else b.attackCd=.12;}}else if(d.mode==='barracks'){
        const owned=Units.countOwned(s.id);if(owned<d.unitCount&&Units.count()<CONFIG.match.maxUnits){b.timer+=dt;if(b.timer>=d.respawnTime){b.timer=0;const u=Units.spawn(d.unitType,Math.min(b.level,CONFIG.units[d.unitType].levels.length),s.x,s.y,s.id);this.placeGuard(u,s);}}else b.timer=0;
      }}},
    healGuards(){for(const u of Units.list){if(!u.alive||u.ownerSlot<0)continue;const s=this.slots[u.ownerSlot];if(!s||!s.building)continue;u.hp=u.maxHp;this.placeGuard(u,s);u.x+=(u.homeX-u.x)*.35;u.y+=(u.homeY-u.y)*.35;}},
    draw(ctx,time){const size=GameMap.CELL-8;for(const s of this.slots)if(!s.building)Painter.plot(ctx,s.x,s.y,size,this.highlight?'highlight':'empty',time);for(const s of this.slots){const b=s.building;if(!b)continue;Painter.plot(ctx,s.x,s.y,size,'built',time);const k=b.pulse>0?1+b.pulse*.35:1;Painter.building(ctx,b.type,s.x,s.y+4,.95*k,time);for(let i=0;i<b.level;i++){ctx.fillStyle='#f0c667';ctx.fillRect(s.x-size/2+5+i*9,s.y+size/2-9,6,5);}if(b.def.mode==='barracks'&&Units.countOwned(s.id)<b.def.unitCount){const w=size-30,x=s.x-size/2+15,y=s.y+size/2-9;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x,y,w,5);ctx.fillStyle='#7fc6d9';ctx.fillRect(x,y,w*Math.min(1,b.timer/b.def.respawnTime),5);}}}
  };window.Buildings=Buildings;
})();
