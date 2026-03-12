const _ROLE_COLOR = {
    attack:'#e74c3c',kamikaze:'#ff6b6b',surveillance:'#2ecc71',ew:'#9b59b6',
    ATK:'#e74c3c',REC:'#2ecc71',DEC:'#f1c40f',EW:'#9b59b6',COM:'#3498db',NAV:'#1abc9c',CMD:'#f39c12',
};
const _FORMATION_META = {
    'PRECISION STRIKE': { icon:'⊕', accentColor:'#a4c639', desc:'Surgical engagement with minimum assets. Maximum warhead yield per platform.', tags:['Low Footprint','Max Yield','Fast Execution'] },
    'SATURATION ASSAULT': { icon:'⚡', accentColor:'#d4a017', desc:'Overwhelming multi-vector strike. Saturates air-defence with decoy and EW support.', tags:['Multi-Vector','ADS Saturation','Redundant Strike'] },
    'SHADOW RECON STRIKE': { icon:'◉', accentColor:'#00bcd4', desc:'ISR-led precision package. AI-guided platforms with full situational awareness.', tags:['ISR-Heavy','AI-Guided','Surgical CEP'] },
};
const _RISK_COLOR = { LOW:'#6b7f3b', MODERATE:'#d4a017', HIGH:'#e67e22', CRITICAL:'#e74c3c' };
const _ZONE_META = [
    { key:'total',kPa:350,color:'#c0392b',label:'Total Destruction' },
    { key:'severe',kPa:100,color:'#e67e22',label:'Severe Damage' },
    { key:'moderate',kPa:35,color:'#d4a017',label:'Moderate Damage' },
    { key:'light',kPa:7,color:'#b8a000',label:'Light Damage' },
    { key:'glass',kPa:3.5,color:'#6b7f3b',label:'Glass Breakage' },
];

const _CSS = `
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Saira+Condensed:wght@300;400;500;600;700;800;900&display=swap');
.su-root *{box-sizing:border-box;margin:0;padding:0}
.su-root{font-family:'Saira Condensed',sans-serif;color:#e0e0d0}
.su-info-bar{display:flex;align-items:center;gap:24px;flex-wrap:wrap;background:rgba(0,0,0,.45);border:1px solid #3a4a20;border-left:4px solid #8fa94e;padding:14px 22px;margin-bottom:28px;backdrop-filter:blur(8px)}
.su-info-item{display:flex;flex-direction:column;gap:2px}
.su-info-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b7f3b;font-weight:700}
.su-info-value{font-size:16px;font-weight:700;color:#c2b280;letter-spacing:1px}
.su-info-divider{width:1px;height:36px;background:#3a4a20;flex-shrink:0}
.su-heading{font-family:'Black Ops One',cursive;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8fa94e;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.su-heading::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#3a4a20,transparent)}
.su-cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;margin-bottom:28px}
.su-card{background:rgba(10,12,8,.7);border:1px solid #2a3a14;display:flex;flex-direction:column;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;position:relative;overflow:hidden}
.su-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,.5)}
.su-card-top-bar{height:3px;width:100%}
.su-card-header{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 18px 12px;border-bottom:1px solid #2a3a14}
.su-card-title-group{display:flex;align-items:center;gap:10px}
.su-card-icon{font-size:22px;line-height:1}
.su-card-name{font-family:'Black Ops One',cursive;font-size:14px;letter-spacing:2px;text-transform:uppercase}
.su-risk-badge{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 8px;border:1px solid;flex-shrink:0}
.su-card-body{padding:14px 18px;flex:1;display:flex;flex-direction:column;gap:12px}
.su-card-desc{font-size:13px;color:#8a8a7a;line-height:1.4;font-style:italic}
.su-tags{display:flex;gap:6px;flex-wrap:wrap}
.su-tag{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;background:rgba(107,127,59,.15);border:1px solid #3a4a20;color:#8fa94e}
.su-drone-row{display:flex;flex-direction:column;gap:5px}
.su-drone-row-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7f3b;font-weight:600}
.su-chips{display:flex;flex-wrap:wrap;gap:5px}
.su-chip{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 7px;border-radius:2px;color:#0a0c08}
.su-stats-box{background:rgba(0,0,0,.35);border:1px solid #2a3a14;border-left:3px solid;padding:12px 14px}
.su-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.su-stat{display:flex;flex-direction:column;align-items:center;gap:2px}
.su-stat-val{font-family:'Black Ops One',cursive;font-size:18px}
.su-stat-key{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#6b7f3b}
.su-eff-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px}
.su-eff-bar-wrap{flex:1;height:4px;background:#1a1c16;overflow:hidden}
.su-eff-bar{height:100%;background:linear-gradient(90deg,#6b7f3b,#a4c639);transition:width .4s}
.su-eff-pct{font-size:12px;font-weight:700;color:#a4c639;min-width:40px;text-align:right}
.su-card-footer{padding:12px 18px;border-top:1px solid #2a3a14}
.su-select-btn{width:100%;padding:11px;background:transparent;cursor:pointer;font-family:'Saira Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid;transition:background .2s,color .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.su-select-btn:hover{color:#0a0c08}
.su-back-btn{background:transparent;border:1px solid #3a4a20;color:#8fa94e;font-family:'Saira Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:10px 20px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .2s,color .2s;margin-bottom:20px}
.su-back-btn:hover{background:#3a4a20;color:#c2b280}
.su-report-header{background:rgba(0,0,0,.5);border:1px solid #3a4a20;border-left:4px solid;padding:18px 24px;margin-bottom:22px}
.su-report-title{font-family:'Black Ops One',cursive;font-size:18px;letter-spacing:3px;text-transform:uppercase}
.su-report-sub{font-size:12px;color:#8a8a7a;letter-spacing:1px;margin-top:4px}
.su-table-wrap{overflow-x:auto;margin-bottom:22px}
.su-table{width:100%;border-collapse:collapse;font-size:12px}
.su-table thead tr{border-bottom:2px solid #3a4a20}
.su-table thead th{padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8fa94e;text-align:left;background:rgba(0,0,0,.4);white-space:nowrap}
.su-table tbody tr{border-bottom:1px solid rgba(58,74,32,.4)}
.su-table tbody tr:hover{background:rgba(107,127,59,.07)}
.su-table tbody td{padding:9px 12px;color:#b8b8a0;font-size:12px;white-space:nowrap}
.su-table tfoot tr{border-top:2px solid #3a4a20}
.su-table tfoot td{padding:10px 12px;font-size:12px;font-weight:700;color:#c2b280;background:rgba(0,0,0,.3)}
.su-role-pill{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;color:#0a0c08}
.su-stat-boxes{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}
@media(max-width:768px){.su-stat-boxes{grid-template-columns:repeat(2,1fr)}}
.su-stat-box{background:rgba(0,0,0,.45);border:1px solid #2a3a14;border-left:4px solid;padding:16px 18px}
.su-stat-box-val{font-family:'Black Ops One',cursive;font-size:26px;line-height:1;margin-bottom:4px}
.su-stat-box-key{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7f3b}
.su-stat-box-unit{font-size:11px;color:#8a8a7a;margin-left:4px}
.su-visuals-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px}
@media(max-width:900px){.su-visuals-row{grid-template-columns:1fr}}
.su-visual-panel{background:rgba(0,0,0,.4);border:1px solid #2a3a14;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px}
.su-visual-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7f3b;align-self:flex-start}
.su-zones-panel{background:rgba(0,0,0,.4);border:1px solid #2a3a14;padding:18px;margin-bottom:22px}
.su-zone-row{display:flex;align-items:center;gap:14px;padding:8px 0;border-bottom:1px solid rgba(58,74,32,.3)}
.su-zone-row:last-child{border-bottom:none}
.su-zone-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.su-zone-name{font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;flex:1}
.su-zone-threshold{font-size:10px;color:#6b7f3b;min-width:70px}
.su-zone-radius{font-family:'Black Ops One',cursive;font-size:14px;color:#c2b280}
.su-verdict{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;border:3px solid;margin-bottom:22px;position:relative;text-align:center}
.su-verdict-text{font-family:'Black Ops One',cursive;font-size:24px;letter-spacing:5px;text-transform:uppercase}
.su-verdict-sub{font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:6px;opacity:.8}
.su-verdict-corner{position:absolute;width:14px;height:14px;border:3px solid}
.su-verdict-corner.tl{top:-3px;left:-3px;border-right:none;border-bottom:none}
.su-verdict-corner.tr{top:-3px;right:-3px;border-left:none;border-bottom:none}
.su-verdict-corner.bl{bottom:-3px;left:-3px;border-right:none;border-top:none}
.su-verdict-corner.br{bottom:-3px;right:-3px;border-left:none;border-top:none}
.su-count-row{display:flex;align-items:center;gap:20px;background:rgba(0,0,0,.3);border:1px solid #2a3a14;padding:14px 20px;margin-bottom:22px;flex-wrap:wrap}
.su-count-item{display:flex;flex-direction:column;gap:2px;align-items:center}
.su-count-val{font-family:'Black Ops One',cursive;font-size:22px}
.su-count-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7f3b}
.su-count-divider{width:1px;height:30px;background:#2a3a14}
.su-report-footer{display:flex;gap:12px;flex-wrap:wrap}
.su-footer-btn{background:transparent;cursor:pointer;font-family:'Saira Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:10px 22px;display:flex;align-items:center;gap:8px;transition:background .2s,color .2s}
.su-footer-btn-primary{border:1px solid #8fa94e;color:#8fa94e}
.su-footer-btn-primary:hover{background:#8fa94e;color:#0a0c08}
.su-footer-btn-secondary{border:1px solid #3a4a20;color:#6b7f3b}
.su-footer-btn-secondary:hover{background:#3a4a20;color:#c2b280}
`;

function _injectCSS(){if(document.getElementById('su-styles'))return;const s=document.createElement('style');s.id='su-styles';s.textContent=_CSS;document.head.appendChild(s)}

class StrikeUI{
    constructor(container,props){_injectCSS();this.el=container;this.el.classList.add('su-root');this.props=props;this._view='cards';this._selFormation=null;this._impactData=null;this._formationOrder=['PRECISION_STRIKE','SATURATION_ASSAULT','SHADOW_RECON_STRIKE'];this._render()}
    _render(){this.el.innerHTML='';if(this._view==='cards')this._renderCards();else this._renderReport()}

    _renderCards(){
        const{formations,target,distanceKm,onBack}=this.props;
        this.el.appendChild(this._missionInfoBar(target,distanceKm));
        this.el.appendChild(this._backBtn('← BACK TO CONFIG',onBack));
        const h=document.createElement('div');h.className='su-heading';h.innerHTML='SELECT STRIKE FORMATION';this.el.appendChild(h);
        const grid=document.createElement('div');grid.className='su-cards-grid';
        for(const key of this._formationOrder){const f=formations[key];if(f)grid.appendChild(this._formationCard(f))}
        this.el.appendChild(grid);
    }

    _missionInfoBar(target,distanceKm){
        const hl=v=>`<span class="su-info-value">${v}</span>`;
        const lbl=(t,v)=>`<div class="su-info-item"><span class="su-info-label">${t}</span>${hl(v)}</div>`;
        const bar=document.createElement('div');bar.className='su-info-bar';
        bar.innerHTML=`${lbl('Target',target.name??'—')}<div class="su-info-divider"></div>${lbl('Category',target.category??target.targetType??'—')}<div class="su-info-divider"></div>${lbl('Distance',distanceKm.toFixed(1)+' km')}<div class="su-info-divider"></div>${lbl('Hardness',Math.round((target.hardness??0.5)*100)+'%')}<div class="su-info-divider"></div>${lbl('Air Defence',Math.round((target.airDefenseLevel??0)*100)+'%')}<div class="su-info-divider"></div>${lbl('Target Type',(target.targetType??'fixed').toUpperCase())}`;
        return bar;
    }

    _formationCard(formation){
        const meta=_FORMATION_META[formation.name]??{icon:'◆',accentColor:'#8fa94e',desc:'',tags:[]};
        const stats=formation.stats;const error=formation.error;
        const card=document.createElement('div');card.className='su-card';
        if(!error)card.style.setProperty('--card-accent',meta.accentColor);
        card.addEventListener('mouseenter',()=>{card.style.borderColor=meta.accentColor+'88'});
        card.addEventListener('mouseleave',()=>{card.style.borderColor='#2a3a14'});
        const riskColor=stats?(_RISK_COLOR[stats.riskLevel]??'#d4a017'):'#666';

        const topBar=document.createElement('div');topBar.className='su-card-top-bar';topBar.style.background=meta.accentColor;card.appendChild(topBar);

        const header=document.createElement('div');header.className='su-card-header';
        header.innerHTML=`<div class="su-card-title-group"><span class="su-card-icon">${meta.icon}</span><span class="su-card-name" style="color:${meta.accentColor}">${formation.name}</span></div>${stats?`<span class="su-risk-badge" style="color:${riskColor};border-color:${riskColor}">${stats.riskLevel}</span>`:''}`;
        card.appendChild(header);

        const body=document.createElement('div');body.className='su-card-body';
        if(error){body.innerHTML=`<p style="color:#e74c3c;font-size:13px;padding:10px 0">${error}</p>`;card.appendChild(body);return card}
        body.innerHTML+=`<p class="su-card-desc">${meta.desc}</p>`;
        body.innerHTML+=`<div class="su-tags">${meta.tags.map(t=>`<span class="su-tag">${t}</span>`).join('')}</div>`;
        if(formation.attackDrones?.length)body.appendChild(this._droneChipRow('Attack',formation.attackDrones));
        if(formation.supportDrones?.length)body.appendChild(this._droneChipRow('Support',formation.supportDrones));
        body.appendChild(this._cardStatsBox(stats,meta.accentColor));card.appendChild(body);

        const footer=document.createElement('div');footer.className='su-card-footer';
        const btn=document.createElement('button');btn.className='su-select-btn';btn.style.borderColor=meta.accentColor;btn.style.color=meta.accentColor;btn.innerHTML='▶ SELECT FOR IMPACT ANALYSIS';
        btn.addEventListener('mouseenter',()=>{btn.style.background=meta.accentColor;btn.style.color='#0a0c08'});
        btn.addEventListener('mouseleave',()=>{btn.style.background='transparent';btn.style.color=meta.accentColor});
        btn.addEventListener('click',()=>this._selectFormation(formation));
        footer.appendChild(btn);card.appendChild(footer);return card;
    }

    _droneChipRow(label,drones){
        const row=document.createElement('div');row.className='su-drone-row';row.innerHTML=`<span class="su-drone-row-label">${label}</span>`;
        const chips=document.createElement('div');chips.className='su-chips';
        drones.forEach(d=>{const c=document.createElement('span');c.className='su-chip';c.style.background=_ROLE_COLOR[d.role]??'#8fa94e';c.textContent=(d.name??'').substring(0,10);c.title=`${d.name} (${d.role}) — ${d.payloadTNTkg??0} kg TNT`;chips.appendChild(c)});
        row.appendChild(chips);return row;
    }

    _cardStatsBox(stats,accentColor){
        const box=document.createElement('div');box.className='su-stats-box';box.style.borderLeftColor=accentColor;
        const tnt=stats.totalTNT!=null?stats.totalTNT.toFixed(1)+' kg':'—';
        const cepStr=stats.avgCEP_m!=null?stats.avgCEP_m.toFixed(0)+' m':'—';
        const eff=stats.effectiveness!=null?stats.effectiveness.toFixed(1):'—';
        const eta=stats.ETA??'—';
        const total=(stats.zones&&stats.zones.total)?stats.zones.total+'m':'—';
        box.innerHTML=`<div class="su-stats-grid"><div class="su-stat"><span class="su-stat-val" style="color:${accentColor}">${tnt}</span><span class="su-stat-key">TNT</span></div><div class="su-stat"><span class="su-stat-val" style="color:#c2b280">${cepStr}</span><span class="su-stat-key">AVG CEP</span></div><div class="su-stat"><span class="su-stat-val" style="color:#8fa94e">${eta}</span><span class="su-stat-key">ETA</span></div><div class="su-stat"><span class="su-stat-val" style="color:#e74c3c">${total}</span><span class="su-stat-key">DEST.R</span></div></div><div class="su-eff-row"><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#6b7f3b">Effectiveness</span><div class="su-eff-bar-wrap"><div class="su-eff-bar" style="width:${Math.min(parseFloat(eff)||0,100)}%"></div></div><span class="su-eff-pct">${eff}%</span></div>`;
        return box;
    }

    _selectFormation(formation){const impact=this.props.onComputeImpact(formation);this._selFormation=formation;this._impactData=impact;this._view='report';this._render()}

    _renderReport(){
        const{target,distanceKm,onBack}=this.props;const formation=this._selFormation;const impact=this._impactData;
        const meta=_FORMATION_META[formation.name]??{accentColor:'#8fa94e'};
        this.el.appendChild(this._reportHeader(formation,target,distanceKm,meta));
        let h;h=document.createElement('div');h.className='su-heading';h.innerHTML='Per-Drone Breakdown';this.el.appendChild(h);
        this.el.appendChild(this._droneTable(impact.perDrone,impact.combined));
        this.el.appendChild(this._statBoxes(impact.combined));
        h=document.createElement('div');h.className='su-heading';h.innerHTML='Blast Analysis';this.el.appendChild(h);
        this.el.appendChild(this._visualsRow(impact.combined));
        h=document.createElement('div');h.className='su-heading';h.innerHTML='Damage Zone Radii';this.el.appendChild(h);
        this.el.appendChild(this._damageZonesPanel(impact.combined.damageZones));
        this.el.appendChild(this._verdictStamp(formation.stats?.effectiveness??0));
        this.el.appendChild(this._droneCountSummary(formation));
        this.el.appendChild(this._reportFooter(onBack,meta));
    }

    _reportHeader(formation,target,distanceKm,meta){
        const div=document.createElement('div');div.className='su-report-header';div.style.borderLeftColor=meta.accentColor;
        div.innerHTML=`<div class="su-report-title" style="color:${meta.accentColor}">${_FORMATION_META[formation.name]?.icon??'◆'} ${formation.name}</div><div class="su-report-sub">TARGET: ${target.name??'—'} · DISTANCE: ${distanceKm.toFixed(1)} km · CATEGORY: ${(target.category??target.targetType??'—').toUpperCase()} · RISK: <span style="color:${_RISK_COLOR[formation.stats?.riskLevel]??'#d4a017'}">${formation.stats?.riskLevel??'—'}</span></div>`;
        return div;
    }

    _droneTable(perDrone,combined){
        const wrap=document.createElement('div');wrap.className='su-table-wrap';
        let thead=['Drone','Role','Mass@Impact','Vel (m/s)','KE (J)','KE TNT','Warhead TNT','Total TNT','CEP (m)','Frag Vel (m/s)'].map(c=>`<th>${c}</th>`).join('');
        let tbody=perDrone.map(d=>{const rc=_ROLE_COLOR[d.role]??'#8fa94e';return`<tr><td>${d.name??'—'}</td><td><span class="su-role-pill" style="background:${rc}">${d.role}</span></td><td>${d.massOnImpact_kg} kg</td><td>${d.impactVelocity_ms}</td><td>${this._fmtNum(d.kineticEnergy_J)}</td><td>${d.kineticEnergy_TNT_kg} kg</td><td>${d.payloadTNT_kg} kg</td><td style="color:#a4c639;font-weight:700">${d.totalTNT_kg} kg</td><td>${d.cep_m} m</td><td>${d.fragmentVelocity_ms} m/s</td></tr>`}).join('');
        const tfoot=`<tr><td colspan="7" style="letter-spacing:2px;text-transform:uppercase;color:#8fa94e">Combined Total</td><td style="color:#a4c639">${combined.totalTNT_kg} kg TNT</td><td style="color:#c2b280">${combined.avgCEP_m??'—'} m</td><td></td></tr>`;
        wrap.innerHTML=`<table class="su-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody><tfoot>${tfoot}</tfoot></table>`;return wrap;
    }

    _statBoxes(combined){
        const boxes=[{label:'Total TNT Yield',val:combined.totalTNT_kg,unit:'kg',color:'#e74c3c'},{label:'Total Kinetic Energy',val:(combined.totalKE_joules/1e6).toFixed(2),unit:'MJ',color:'#d4a017'},{label:'Avg CEP',val:combined.avgCEP_m??'—',unit:'m',color:'#3498db'},{label:'Thermal Radius',val:combined.thermalRadius_m,unit:'m',color:'#9b59b6'}];
        const wrap=document.createElement('div');wrap.className='su-stat-boxes';
        boxes.forEach(b=>{wrap.innerHTML+=`<div class="su-stat-box" style="border-left-color:${b.color}"><div class="su-stat-box-val" style="color:${b.color}">${b.val}<span class="su-stat-box-unit">${b.unit}</span></div><div class="su-stat-box-key">${b.label}</div></div>`});
        return wrap;
    }

    _visualsRow(combined){
        const row=document.createElement('div');row.className='su-visuals-row';
        const lp=document.createElement('div');lp.className='su-visual-panel';lp.innerHTML=`<div class="su-visual-title">Blast Radius Rings</div>`;lp.innerHTML+=this._blastRingSVG(combined.damageZones,combined.totalTNT_kg);row.appendChild(lp);
        const rp=document.createElement('div');rp.className='su-visual-panel';rp.innerHTML=`<div class="su-visual-title">Overpressure vs Distance</div>`;rp.innerHTML+=this._overpressureCurveSVG(combined.overpressureCurve);row.appendChild(rp);
        return row;
    }

    _damageZonesPanel(zones){
        const panel=document.createElement('div');panel.className='su-zones-panel';
        _ZONE_META.forEach(z=>{const r=zones?.[z.key]??0;panel.innerHTML+=`<div class="su-zone-row"><div class="su-zone-dot" style="background:${z.color}"></div><span class="su-zone-name" style="color:${z.color}">${z.label}</span><span class="su-zone-threshold">> ${z.kPa} kPa</span><span class="su-zone-radius">${r>0?r+' m':'—'}</span></div>`});
        panel.innerHTML+=`<div style="margin-top:14px;padding-top:12px;border-top:1px solid #2a3a14;display:flex;gap:24px;flex-wrap:wrap"><div><span style="font-size:9px;color:#6b7f3b;text-transform:uppercase;letter-spacing:1px">Crater Radius</span><div style="font-family:'Black Ops One',cursive;font-size:16px;color:#c2b280">${zones.__craterRadius??'—'}</div></div><div><span style="font-size:9px;color:#6b7f3b;text-transform:uppercase;letter-spacing:1px">Crater Depth</span><div style="font-family:'Black Ops One',cursive;font-size:16px;color:#c2b280">${zones.__craterDepth??'—'}</div></div><div><span style="font-size:9px;color:#6b7f3b;text-transform:uppercase;letter-spacing:1px">Fragment Range</span><div style="font-family:'Black Ops One',cursive;font-size:16px;color:#c2b280">${zones.__fragRange??'—'}</div></div></div>`;
        return panel;
    }

    _verdictStamp(effectivenessPct){
        let text,color,sub;
        if(effectivenessPct>=80){text='✓ TARGET NEUTRALIZED';color='#6b7f3b';sub=`MISSION SUCCESS — ${effectivenessPct.toFixed(1)}% EFFECTIVENESS`}
        else if(effectivenessPct>=50){text='⚠ PARTIAL DAMAGE';color='#d4a017';sub=`INCOMPLETE NEUTRALIZATION — ${effectivenessPct.toFixed(1)}% EFFECTIVENESS`}
        else{text='✕ MISSION FAILURE';color='#e74c3c';sub=`INSUFFICIENT YIELD — ${effectivenessPct.toFixed(1)}% EFFECTIVENESS`}
        const stamp=document.createElement('div');stamp.className='su-verdict';stamp.style.borderColor=color;stamp.style.color=color;
        stamp.innerHTML=`<div class="su-verdict-corner tl" style="border-color:${color}"></div><div class="su-verdict-corner tr" style="border-color:${color}"></div><div class="su-verdict-corner bl" style="border-color:${color}"></div><div class="su-verdict-corner br" style="border-color:${color}"></div><div class="su-verdict-text">${text}</div><div class="su-verdict-sub">${sub}</div>`;
        return stamp;
    }

    _droneCountSummary(formation){
        const atk=(formation.attackDrones??[]).length;const sup=(formation.supportDrones??[]).length;const total=atk+sup;
        const row=document.createElement('div');row.className='su-count-row';
        row.innerHTML=`<div class="su-count-item"><span class="su-count-val" style="color:#e74c3c">${atk}</span><span class="su-count-label">Attack</span></div><div class="su-count-divider"></div><div class="su-count-item"><span class="su-count-val" style="color:#3498db">${sup}</span><span class="su-count-label">Support</span></div><div class="su-count-divider"></div><div class="su-count-item"><span class="su-count-val" style="color:#c2b280">${total}</span><span class="su-count-label">Total</span></div>`;
        return row;
    }

    _reportFooter(onBack,meta){
        const row=document.createElement('div');row.className='su-report-footer';
        const b1=document.createElement('button');b1.className='su-footer-btn su-footer-btn-primary';b1.innerHTML='← BACK TO FORMATIONS';b1.style.borderColor=meta.accentColor;b1.style.color=meta.accentColor;
        b1.addEventListener('mouseenter',()=>{b1.style.background=meta.accentColor;b1.style.color='#0a0c08'});
        b1.addEventListener('mouseleave',()=>{b1.style.background='transparent';b1.style.color=meta.accentColor});
        b1.addEventListener('click',()=>{this._view='cards';this._render()});
        const b2=document.createElement('button');b2.className='su-footer-btn su-footer-btn-secondary';b2.innerHTML='← BACK TO CONFIG';b2.addEventListener('click',onBack);
        row.appendChild(b1);row.appendChild(b2);return row;
    }

    _blastRingSVG(zones,totalTNTkg){
        if(!zones)return'<p style="color:#555;font-size:12px">No blast data</p>';
        const S=280,cx=S/2,cy=S/2,pad=24;
        const maxR=Math.max(zones.glass??0,zones.light??0,zones.moderate??0,zones.severe??0,zones.total??0,1);
        const svgRad=S/2-pad;const scale=r=>(r/maxR)*svgRad;
        const layers=[..._ZONE_META].reverse();
        const circles=layers.map(z=>{const r=scale(zones[z.key]??0);if(r<1)return'';return`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${z.color}" fill-opacity="0.18" stroke="${z.color}" stroke-width="1.2"/>`}).join('');
        const labels=_ZONE_META.map(z=>{const r=scale(zones[z.key]??0);if(r<6)return'';return`<text x="${(cx+r*0.72).toFixed(1)}" y="${(cy-r*0.72).toFixed(1)}" fill="${z.color}" font-size="8" font-family="'Saira Condensed',sans-serif" font-weight="700">${zones[z.key]}m</text>`}).join('');
        return`<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%"><rect width="${S}" height="${S}" fill="rgba(0,0,0,0.4)"/><circle cx="${cx}" cy="${cy}" r="${svgRad.toFixed(1)}" fill="none" stroke="#3a4a20" stroke-width="0.6" stroke-dasharray="4,4"/>${circles}${labels}<line x1="${cx-9}" y1="${cy}" x2="${cx+9}" y2="${cy}" stroke="#e0e0d0" stroke-width="1.2" opacity="0.8"/><line x1="${cx}" y1="${cy-9}" x2="${cx}" y2="${cy+9}" stroke="#e0e0d0" stroke-width="1.2" opacity="0.8"/><circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="#e0e0d0" stroke-width="1.2" opacity="0.8"/><text x="${cx}" y="${S-6}" text-anchor="middle" fill="#6b7f3b" font-size="9" font-family="'Saira Condensed',sans-serif" font-weight="700" letter-spacing="1">W = ${(totalTNTkg??0).toFixed(2)} kg TNT</text></svg>`;
    }

    _overpressureCurveSVG(curve){
        if(!curve||curve.length<2)return'<p style="color:#555;font-size:12px;padding:20px">Insufficient data</p>';
        const W=360,H=210,PAD={t:12,r:16,b:40,l:52};const pW=W-PAD.l-PAD.r,pH=H-PAD.t-PAD.b;
        const maxDist=curve[curve.length-1].dist;const maxOp=Math.max(...curve.map(p=>p.op),10);
        const px=d=>(PAD.l+(d/maxDist)*pW).toFixed(2);const py=op=>(PAD.t+(1-Math.min(op/maxOp,1))*pH).toFixed(2);
        const pts=curve.map(p=>`${px(p.dist)},${py(p.op)}`).join(' ');
        const areaPath=`M${px(curve[0].dist)},${py(curve[0].op)} `+curve.map(p=>`L${px(p.dist)},${py(p.op)}`).join(' ')+` L${px(maxDist)},${PAD.t+pH} L${px(0)},${PAD.t+pH} Z`;
        const thr=[{kPa:350,col:'#c0392b'},{kPa:100,col:'#e67e22'},{kPa:35,col:'#d4a017'},{kPa:7,col:'#b8a000'}].map(({kPa,col})=>{if(kPa>maxOp*1.1)return'';const y=py(kPa);return`<line x1="${PAD.l}" y1="${y}" x2="${PAD.l+pW}" y2="${y}" stroke="${col}" stroke-width="0.7" stroke-dasharray="4,3" opacity="0.75"/><text x="${PAD.l-4}" y="${+y+4}" text-anchor="end" fill="${col}" font-size="8" font-family="monospace">${kPa}</text>`}).join('');
        const xTicks=Array.from({length:6},(_,i)=>{const d=Math.round((i/5)*maxDist);return`<text x="${px(d)}" y="${PAD.t+pH+14}" text-anchor="middle" fill="#666" font-size="8" font-family="monospace">${d}</text>`}).join('');
        const gridH=[25,50,75].map(pct=>{const y=PAD.t+(pct/100)*pH;return`<line x1="${PAD.l}" y1="${y}" x2="${PAD.l+pW}" y2="${y}" stroke="#2a2a1e" stroke-width="0.5"/>`}).join('');
        return`<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.4)"/><rect x="${PAD.l}" y="${PAD.t}" width="${pW}" height="${pH}" fill="rgba(0,0,0,0.2)" stroke="#2a3a14" stroke-width="0.5"/>${gridH}${thr}<path d="${areaPath}" fill="rgba(164,198,57,0.12)" stroke="none"/><polyline points="${pts}" fill="none" stroke="#a4c639" stroke-width="1.8" stroke-linejoin="round"/>${xTicks}<text x="${PAD.l-28}" y="${PAD.t+pH/2}" text-anchor="middle" fill="#6b7f3b" font-size="9" font-family="monospace" transform="rotate(-90,${PAD.l-28},${PAD.t+pH/2})">kPa</text><text x="${PAD.l+pW/2}" y="${H-4}" text-anchor="middle" fill="#6b7f3b" font-size="9" font-family="monospace" letter-spacing="1">Distance (m)</text></svg>`;
    }

    _backBtn(label,fn){const btn=document.createElement('button');btn.className='su-back-btn';btn.innerHTML=label;btn.addEventListener('click',fn);return btn}
    _fmtNum(n){if(n==null)return'—';if(n>=1e9)return(n/1e9).toFixed(2)+' G';if(n>=1e6)return(n/1e6).toFixed(2)+' M';if(n>=1e3)return(n/1e3).toFixed(1)+' K';return n.toFixed(0)}
}

window.StrikeUI=StrikeUI;
