'use strict';
/* ---------------------------------------------------------------- แสดงผล */
function render(){
  syncReport();
  renderReportBar();
  const d = derive();
  renderKpi(d); renderFunnel(d); renderDonut(d);
  renderMonthly(d); renderCharts(d); renderRank();
  renderGroupTabs(); renderPerson(); renderSalesTable(); renderTop5(d); renderWin();
  renderAdsTable();
  renderRecords();
  updateMktCalc();
}

function renderKpi(d){
  $('k-lead').textContent = fmt(d.lead);
  const byCh = Object.keys(CH).map(c=>{
    const n = STATE.mkt.filter(r=>r.channel===c && inScope(r)).reduce((a,r)=>a+(r.intake||0),0);
    return n ? CH[c]+' '+fmt(n) : null;
  }).filter(Boolean).join(' + ');
  const nMonths = d.rows.length || 1;
  $('k-lead-s').textContent = (byCh || 'ยังไม่มีข้อมูล') + ' · เฉลี่ย ' + fmt(d.lead/nMonths) + ' ราย/เดือน';

  $('k-pipe').innerHTML = d.pipeline ? fmtM(d.pipeline) + ' <span class="u">ล้านบาท</span>' : '—';
  $('k-pipe-s').textContent = 'จาก ' + STATE.pipeline.filter(inScope).length + ' โครงการที่ประเมินแล้ว';

  $('k-sale').innerHTML = d.revenue ? fmtM(d.revenue) + ' <span class="u">ล้านบาท</span>' : '—';
  $('k-sale-c').textContent = d.pipeline>0
    ? 'คิดเป็น ' + (d.revenue/d.pipeline*100).toFixed(1) + '% ของมูลค่าที่คาดว่าจะขายได้' : 'ยังไม่มีมูลค่าคาดขาย';

  $('k-ads').textContent = d.ads ? fmt(d.ads) : '—';
  $('k-ads-s').textContent = d.ads
    ? 'บาท · ' + d.adsMonths.map(mLabel).join(', ')
    : 'ยังไม่บันทึกงบโฆษณา';

  $('k-cpl').textContent = d.cpl!=null ? fmt(d.cpl) : '—';
  $('k-cpl-s').textContent = d.cpl!=null
    ? 'บาท/Lead · คิดจาก ' + fmt(d.leadsInAdsMonths) + ' Lead ในเดือนที่ลงงบ · ROAS ' + (d.roas!=null ? d.roas.toFixed(1)+' เท่า' : '—')
    : 'ต้องมีงบโฆษณาก่อนจึงคำนวณได้';
}

function renderFunnel(d){
  const steps = [
    {l:'Lead ทั้งหมด',  v:d.lead,    g:'linear-gradient(90deg,#3b82f6,#06b6d4)'},
    {l:'ผ่านคุณสมบัติ', v:d.qualify, g:'linear-gradient(90deg,#6366f1,#8b5cf6)'},
    {l:'เสนอราคา',     v:d.quote,   g:'linear-gradient(90deg,#f97316,#fb923c)'},
    {l:'ปิดการขาย',    v:d.close,   g:'linear-gradient(90deg,#10b981,#34d399)'}
  ];
  const base = d.lead || 1;
  $('funnel').innerHTML = steps.map(s=>{
    const pct = s.v/base*100;
    const w = s.v>0 ? Math.max(pct,4) : 0;
    return `<div class="fs"><div class="fl">${s.l}</div>
      <div class="fbw"><div class="fb" style="width:${w}%;background:${s.g}">${fmt(s.v)}</div></div>
      <div class="fp">${pct.toFixed(1)}%</div></div>`;
  }).join('');

  $('ladder').innerHTML = steps.map((s,i)=>{
    const prev = i===0 ? null : steps[i-1].v;
    const drop = prev ? ((s.v-prev)/prev*100).toFixed(1)+'%' : 'ฐานตั้งต้น';
    return `<div class="rung"><div class="k">${s.l}</div><div class="v">${fmt(s.v)}</div>
      <div class="p ${i===0?'base':'neg'}">${drop}</div></div>`;
  }).join('');

  $('funnel-note').textContent = d.lead>0
    ? 'อัตราปิดการขายรวม ' + (d.close/d.lead*100).toFixed(1) + '% หรือ 1 รายต่อ Lead ทุก ' + fmt(d.close? d.lead/d.close : 0) + ' ราย'
    : 'ยังไม่มี Lead ในช่วงที่เลือก';
}

function renderDonut(d){
  const rest = Math.max(d.lead - d.reject - d.follow - d.quote - d.close, 0);
  const segs = [
    {l:'ไม่ตรงคุณสมบัติ',            v:d.reject, c:'#94a3b8'},
    {l:'อยู่ระหว่างติดตาม',           v:d.follow, c:'#3b82f6'},
    {l:'เสนอราคาแล้ว',              v:d.quote,  c:'#f97316'},
    {l:'ปิดการขายแล้ว',              v:d.close,  c:'#10b981'},
    {l:'ผ่านคุณสมบัติ ยังไม่ระบุขั้น', v:rest,     c:'#e2e8f0'}
  ].filter(s=>s.v>0);

  const C = 2*Math.PI*50, total = d.lead || 1;
  let off = 0;
  $('donut-arcs').innerHTML = segs.map(s=>{
    const len = s.v/total*C;
    const el = `<circle r="50" fill="none" stroke="${s.c}" stroke-width="24" stroke-dasharray="${len.toFixed(1)} ${(C-len).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"/>`;
    off += len;
    return el;
  }).join('');
  $('donut-total').textContent = fmt(d.lead);
  $('donut-legend').innerHTML = segs.map(s=>
    `<div class="li"><i style="background:${s.c}"></i><span>${s.l}</span><b>${fmt(s.v)}<span class="pct">${(s.v/total*100).toFixed(1)}%</span></b></div>`
  ).join('');
  $('donut-note').textContent = 'สัดส่วนสถานะของ Lead ' + fmt(d.lead) + ' ราย ตามที่บันทึกในแท็บสรุป MKT';
}

function renderMonthly(d){
  const tb = document.querySelector('#tbl-monthly tbody');
  if(!d.rows.length){ tb.innerHTML = '<tr><td colspan="8" class="empty">ยังไม่มีข้อมูลในช่วงที่เลือก</td></tr>'; $('monthly-note').textContent=''; return; }
  tb.innerHTML = d.rows.map(r=>`<tr>
    <td><strong>${r.label} 69</strong></td>
    <td class="num">${fmt(r.lead)}</td>
    <td class="num">${fmt(r.qualify)}</td>
    <td class="num">${fmt(r.quote)}</td>
    <td class="num">${r.pipeline?fmtM(r.pipeline)+' ลบ.':'—'}</td>
    <td class="num">${r.revenue?fmtM(r.revenue)+' ลบ.':'—'}</td>
    <td class="num">${r.ads==null?'—':fmt(r.ads)}</td>
    <td class="num hl">${r.cpl==null?'—':fmt(r.cpl)}</td>
  </tr>`).join('') + `<tr class="tot">
    <td>รวม</td><td class="num">${fmt(d.lead)}</td><td class="num">${fmt(d.qualify)}</td><td class="num">${fmt(d.quote)}</td>
    <td class="num">${d.pipeline?fmtM(d.pipeline)+' ลบ.':'—'}</td><td class="num">${d.revenue?fmtM(d.revenue)+' ลบ.':'—'}</td>
    <td class="num">${d.ads?fmt(d.ads):'—'}</td><td class="num hl">${d.cpl==null?'—':fmt(d.cpl)}</td></tr>`;

  const parts = d.byChannel.filter(c=>c.revenue>0).map(c=>
    `<strong style="color:var(--primary)">฿${fmt(c.revenue)}</strong> ${c.label} (${(c.revenue/d.revenue*100).toFixed(1)}%)`);
  $('monthly-note').innerHTML = (parts.length ? 'ยอดขายแยกช่องทาง: ' + parts.join(' · ') + '<br>' : '')
    + 'ต้นทุนต่อ Lead แถวรวมคิดจากงบ ' + fmt(d.ads) + ' บาท หารด้วย ' + fmt(d.leadsInAdsMonths)
    + ' Lead เฉพาะเดือนที่มีงบโฆษณา (' + (d.adsMonths.map(mLabel).join(', ')||'—') + ')';
}

function renderCharts(d){
  const labels = d.rows.map(r=>r.label);
  chartCompare.data.labels = labels;
  chartCompare.data.datasets[0].data = d.rows.map(r=>+(r.pipeline/1e6).toFixed(2));
  chartCompare.data.datasets[1].data = d.rows.map(r=>r.revenue==null?null:+(r.revenue/1e6).toFixed(2));
  chartCompare.update();

  chartLead.data.labels = labels;
  chartLead.data.datasets[0].data = d.rows.map(r=>r.lead);
  chartLead.data.datasets[1].data = d.rows.map(r=>r.qrate==null?null:+r.qrate.toFixed(1));
  chartLead.update();

  chartAds.data.labels = labels;
  chartAds.data.datasets[0].data = d.rows.map(r=>r.ads==null?null:+(r.ads/1000).toFixed(1));
  chartAds.data.datasets[1].data = d.rows.map(r=>r.cpl==null?null:Math.round(r.cpl));
  chartAds.update();
}

// ปุ่มกลุ่มงานสร้างจากข้อมูลจริง กลุ่มไหนไม่มียอดขายก็จะไม่มีปุ่มขึ้นมา
function renderGroupTabs(){
  const groups = [...new Set(STATE.sales.filter(inScope).map(x=>x.group))].filter(Boolean);
  if(RANK_GROUP !== 'all' && !groups.includes(RANK_GROUP)) RANK_GROUP = 'all';
  $('seg-group').innerHTML = ['all', ...groups].map(g=>
    `<button type="button" class="${g===RANK_GROUP?'on':''}" data-g="${esc(g)}" onclick="setGroup('${esc(g)}')">${g==='all'?'ทั้งหมด':esc(g)}</button>`
  ).join('');
}

function setGroup(g){
  RANK_GROUP = g;
  renderGroupTabs();
  renderRank();
}

function renderRank(){
  const rows = STATE.sales.filter(x=>inScope(x) && (RANK_GROUP==='all' || x.group===RANK_GROUP));
  // ใช้ทุกเดือนที่อยู่ในช่วงที่เลือก เพื่อให้เส้นต่อเนื่องและเทียบกันได้ตรงแกนเดียวกัน
  const months = MONTHS.filter(m => (FILTER.month==='all' || m.k===FILTER.month) && rows.some(x=>x.month===m.k));
  const people = [...new Set(rows.map(x=>x.person))];

  chartRank.data.labels = months.map(m=>m.s);
  chartRank.data.datasets = people.map(person=>{
    const col = personColor(person);
    return {
      label: person,
      data: months.map(m=>rows.filter(x=>x.person===person && x.month===m.k).reduce((a,x)=>a+x.revenue,0)),
      borderColor: col, backgroundColor: col,
      pointBackgroundColor: col, pointRadius: 5, pointHoverRadius: 7,
      borderWidth: 3, tension: .3, fill: false, spanGaps: true
    };
  });
  chartRank.update();
}

function renderPerson(){
  const rows = STATE.sales.filter(inScope);
  const total = rows.reduce((a,r)=>a+r.revenue,0);
  const people = [...new Set(rows.map(r=>r.person))]
    .map(p=>{
      const rr = rows.filter(r=>r.person===p);
      return {p, team:rr[0].team, n:rr.length, sum:rr.reduce((a,r)=>a+r.revenue,0)};
    }).sort((a,b)=>b.sum-a.sum);

  const tb = document.querySelector('#tbl-person tbody');
  const medal = i => i===0 ? 'rk1' : i===1 ? 'rk2' : i===2 ? 'rk3' : 'rkn';
  tb.innerHTML = people.length ? people.map((x,i)=>{
    const col = personColor(x.p), pct = total ? x.sum/total*100 : 0;
    return `<tr>
      <td><span class="rk-badge ${medal(i)}">${i+1}</span></td>
      <td><span class="pchip"><i class="pdot" style="background:${col}"></i>${esc(x.p)}</span></td>
      <td>${esc(x.team)||'—'}</td>
      <td class="num">${x.n}</td>
      <td class="num"><span class="money">${fmt(x.sum)}</span></td>
      <td class="num">${pct.toFixed(1)}%<span class="mbar"><i style="width:${pct.toFixed(1)}%;background:${col}"></i></span></td>
    </tr>`;
  }).join('')
    + `<tr class="tot"><td colspan="3">รวม</td><td class="num">${rows.length}</td><td class="num">${fmt(total)}</td><td class="num">100%</td></tr>`
    : '<tr><td colspan="6" class="empty">ยังไม่มีรายการยอดขาย</td></tr>';
}

function renderSalesTable(){
  const rows = STATE.sales.filter(inScope).slice().sort((a,b)=>MI[a.month]-MI[b.month] || b.revenue-a.revenue);
  const tb = document.querySelector('#tbl-sales tbody');
  tb.innerHTML = rows.length ? rows.map(r=>`<tr>
      <td>${mLabel(r.month)}</td>
      <td><span class="pchip"><i class="pdot" style="background:${personColor(r.person)}"></i>${esc(r.person)}</span></td>
      <td><span class="gchip ${groupClass(r.group)}">${esc(r.group)}</span></td>
      <td><span class="${r.channel==='fb'?'cf':'cl'}">${chLabel(r.channel)}</span></td>
      <td class="num"><span class="money">${fmt(r.revenue)}</span></td></tr>`).join('')
    + `<tr class="tot"><td colspan="4">รวม</td><td class="num">${fmt(rows.reduce((a,r)=>a+r.revenue,0))}</td></tr>`
    : '<tr><td colspan="5" class="empty">ยังไม่มีรายการยอดขาย</td></tr>';
}

function renderTop5(d){
  const rows = STATE.pipeline.filter(inScope).slice().sort((a,b)=>b.value-a.value).slice(0,5);
  const max = rows.length ? rows[0].value : 1;
  const share = d.pipeline ? rows.reduce((a,r)=>a+r.value,0)/d.pipeline*100 : 0;
  $('top5-note').textContent = rows.length
    ? '5 โครงการแรกคิดเป็น ' + share.toFixed(1) + '% ของมูลค่าที่คาดว่าจะขายได้'
    : 'ยังไม่มีโครงการในช่วงที่เลือก';
  $('top5').innerHTML = rows.map(r=>`<div class="rk">
      <div class="h"><span>${esc(r.company||r.customer)}</span><b>฿${(r.value/1e6).toFixed(2)}M</b></div>
      <div class="t"><div class="f" style="width:${(r.value/max*100).toFixed(1)}%"></div></div>
      <div class="tag">${esc(r.customer)} · ${mLabel(r.month)} · ${chLabel(r.channel)}${r.team?' · '+esc(r.team):''}</div>
    </div>`).join('');
}

function renderWin(){
  const tb = document.querySelector('#tbl-win tbody');
  const rows = STATE.win;
  tb.innerHTML = rows.length ? rows.map(r=>`<tr>
      <td>${esc(r.sale)}</td><td>${esc(r.projectNo)}</td><td class="num">${fmt(r.value)}</td>
      <td style="white-space:normal;max-width:230px">${esc(r.name)}</td></tr>`).join('')
    + `<tr class="tot"><td colspan="2">รวม</td><td class="num">${fmt(rows.reduce((a,r)=>a+r.value,0))}</td><td></td></tr>`
    : '<tr><td colspan="4" class="empty">ยังไม่มีโครงการที่ปิดการขาย</td></tr>';
}

function renderAdsTable(){
  const rows = MONTHS.filter(m=>STATE.ads.some(a=>a.month===m.k) || STATE.mkt.some(x=>x.month===m.k))
    .filter(m=>FILTER.month==='all' || m.k===FILTER.month);
  const tb = document.querySelector('#tbl-ads tbody');
  tb.innerHTML = rows.length ? rows.map(m=>{
    const a = STATE.ads.find(x=>x.month===m.k);
    return `<tr><td>${m.s}</td>
      <td class="num">${a?fmtR(a.budget):'—'}</td><td class="num">${a?fmtR(a.impr):'—'}</td><td class="num">${a?fmtR(a.reach):'—'}</td>
      <td class="num">${a&&a.cpm!=null?a.cpm:'—'}</td><td class="num">${a&&a.cpc!=null?a.cpc:'—'}</td>
      <td class="num">${a&&a.ctr!=null?a.ctr:'—'}</td><td class="num">${a&&a.cpmsg!=null?a.cpmsg:'—'}</td></tr>`;
  }).join('') : '<tr><td colspan="8" class="empty">ยังไม่มีข้อมูล Ads Metrics</td></tr>';
}
