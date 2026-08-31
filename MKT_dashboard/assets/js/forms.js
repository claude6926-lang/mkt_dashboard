'use strict';
/* ---------------------------------------------------------------- ฟอร์ม */
function fillMonthSelects(){
  const opts = MONTHS.map(m=>`<option value="${m.k}">${m.f}</option>`).join('');
  ['m-month','s-month','p-month','a-month'].forEach(id=>{ $(id).innerHTML = opts; $(id).value='aug'; });
  $('w-month').innerHTML = '<option value="">ไม่ระบุ</option>' + opts;
  $('filter-month').innerHTML = '<option value="all">ทุกเดือน</option>' +
    MONTHS.map(m=>`<option value="${m.k}">${m.f}</option>`).join('');
}

function updateMktCalc(){
  const l = num($('m-intake').value)||0, q = num($('m-qualify').value)||0,
        c = num($('m-close').value)||0,  a = num($('m-ads').value)||0,
        qt= num($('m-quote').value)||0,
        mo= $('m-month').value, ch = $('m-channel').value;
  const rev = STATE.sales.filter(r=>r.month===mo && r.channel===ch).reduce((s,r)=>s+r.revenue,0);
  $('m-revenue').value = rev ? fmt(rev) + ' บาท' : 'ยังไม่มีรายการในแท็บยอดขาย';
  $('m-roi').value = (a>0 && rev>0) ? (rev/a).toFixed(1) + ' เท่า' : '—';
  $('m-cpl').textContent       = (l>0 && a>0) ? fmt(a/l) + ' บาท' : '—';
  $('m-qrate').textContent     = l>0 ? (q/l*100).toFixed(1) + '%' : '—';
  $('m-crate').textContent     = l>0 ? (qt/l*100).toFixed(1) + '%' : '—';
  $('m-closerate').textContent = l>0 ? (c/l*100).toFixed(1) + '%' : '—';
}

// รายชื่อช่องกรอกของแต่ละฟอร์ม ใช้ทั้งตอนล้างค่าและตอนตรวจค่าติดลบ
const FORM_FIELDS = {
  mkt:['m-intake','m-reject','m-qualify','m-follow','m-quote','m-close','m-pipeline','m-ads'],
  sales:['s-person','s-team','s-customer','s-revenue'],
  pipeline:['p-team','p-sale','p-customer','p-company','p-value'],
  win:['w-sale','w-project','w-value','w-name'],
  ads:['a-budget','a-impr','a-reach','a-cpm','a-cpc','a-ctr','a-cpmsg']
};

function saveMkt(){
  const neg = firstNegative(FORM_FIELDS.mkt);
  if(neg){ toast(`ช่อง “${fieldName(neg)}” ใส่ค่าติดลบไม่ได้`); $(neg).focus(); return; }
  const month = $('m-month').value, channel = $('m-channel').value;
  const intake = num($('m-intake').value);
  if(intake==null){ toast('กรอกจำนวน Lead ที่ได้รับก่อนบันทึก'); $('m-intake').focus(); return; }
  const rec = {
    month, channel, intake,
    reject: num($('m-reject').value)||0, qualify: num($('m-qualify').value)||0,
    follow: num($('m-follow').value)||0, quote: num($('m-quote').value)||0,
    close: num($('m-close').value)||0, pipeline: num($('m-pipeline').value)||0,
    ads: num($('m-ads').value)
  };
  const i = STATE.mkt.findIndex(r=>r.month===month && r.channel===channel);
  if(i>=0) Object.assign(STATE.mkt[i], rec); else STATE.mkt.push({id:nid(), ...rec});
  render();
  markDirty();
  toast(`บันทึกสรุป MKT เดือน${mLabel(month)} ช่องทาง ${chLabel(channel)} เรียบร้อย`);
}

function saveSales(){
  const neg = firstNegative(FORM_FIELDS.sales);
  if(neg){ toast(`ช่อง “${fieldName(neg)}” ใส่ค่าติดลบไม่ได้`); $(neg).focus(); return; }
  const revenue = num($('s-revenue').value), person = $('s-person').value.trim();
  if(!person){ toast('กรอกชื่อพนักงานขายก่อนบันทึก'); $('s-person').focus(); return; }
  if(!revenue){ toast('กรอกยอดขายก่อนบันทึก'); $('s-revenue').focus(); return; }
  STATE.sales.push({id:nid(), month:$('s-month').value, person, team:$('s-team').value.trim(),
    group:$('s-group').value, channel:$('s-channel').value, customer:$('s-customer').value.trim(), revenue});
  clearForm('sales'); render(); markDirty();
  toast('บันทึกรายการยอดขายเรียบร้อย');
}

function savePipeline(){
  const neg = firstNegative(FORM_FIELDS.pipeline);
  if(neg){ toast(`ช่อง “${fieldName(neg)}” ใส่ค่าติดลบไม่ได้`); $(neg).focus(); return; }
  const value = num($('p-value').value), customer = $('p-customer').value.trim();
  if(!customer){ toast('กรอกชื่อลูกค้าก่อนบันทึก'); $('p-customer').focus(); return; }
  if(!value){ toast('กรอกประมาณการมูลค่างานก่อนบันทึก'); $('p-value').focus(); return; }
  STATE.pipeline.push({id:nid(), month:$('p-month').value, team:$('p-team').value.trim(),
    sale:$('p-sale').value.trim(), customer, company:$('p-company').value.trim(),
    channel:$('p-channel').value, value});
  clearForm('pipeline'); render(); markDirty();
  toast('บันทึกยอดประมาณการเรียบร้อย');
}

function saveWin(){
  const neg = firstNegative(FORM_FIELDS.win);
  if(neg){ toast(`ช่อง “${fieldName(neg)}” ใส่ค่าติดลบไม่ได้`); $(neg).focus(); return; }
  const value = num($('w-value').value), sale = $('w-sale').value.trim(), projectNo = $('w-project').value.trim();
  if(!sale){ toast('กรอกชื่อพนักงานขายก่อนบันทึก'); $('w-sale').focus(); return; }
  if(!projectNo){ toast('กรอก Project No. ก่อนบันทึก'); $('w-project').focus(); return; }
  if(!value){ toast('กรอกมูลค่าโครงการก่อนบันทึก'); $('w-value').focus(); return; }
  STATE.win.push({id:nid(), month:$('w-month').value, sale, projectNo, value, name:$('w-name').value.trim()});
  clearForm('win'); render(); markDirty();
  toast('บันทึกโครงการที่ปิดการขายเรียบร้อย');
}

function saveAds(){
  const neg = firstNegative(FORM_FIELDS.ads);
  if(neg){ toast(`ช่อง “${fieldName(neg)}” ใส่ค่าติดลบไม่ได้`); $(neg).focus(); return; }
  const month = $('a-month').value;
  const rec = {month, budget:num($('a-budget').value), impr:num($('a-impr').value), reach:num($('a-reach').value),
    cpm:num($('a-cpm').value), cpc:num($('a-cpc').value), ctr:num($('a-ctr').value), cpmsg:num($('a-cpmsg').value), flag:false};
  const i = STATE.ads.findIndex(r=>r.month===month);
  if(i>=0) Object.assign(STATE.ads[i], rec); else STATE.ads.push({id:nid(), ...rec});
  render();
  markDirty();
  toast(`บันทึกตัวชี้วัดสื่อโฆษณา เดือน${mLabel(month)} เรียบร้อย`);
}

function clearForm(sec){ FORM_FIELDS[sec].forEach(id=>$(id).value=''); if(sec==='mkt') updateMktCalc(); }

// ข้อความสรุปรายการที่กำลังจะลบ ให้ผู้ใช้ตรวจก่อนยืนยัน
function recSummary(set, r){
  const line = (k,v) => `${k}: <b>${esc(v)}</b>`;
  switch(set){
    case 'mkt':      return [line('เดือน', mLabel(r.month)), line('ช่องทาง', chLabel(r.channel)),
                             line('Lead', fmt(r.intake) + ' ราย')].join('<br>');
    case 'sales':    return [line('เดือน', mLabel(r.month)), line('พนักงานขาย', r.person),
                             line('ยอดขาย', fmt(r.revenue) + ' บาท')].join('<br>');
    case 'pipeline': return [line('เดือน', mLabel(r.month)), line('ลูกค้า', r.customer),
                             line('มูลค่า', fmt(r.value) + ' บาท')].join('<br>');
    case 'win':      return [line('พนักงานขาย', r.sale), line('Project No.', r.projectNo),
                             line('มูลค่า', fmt(r.value) + ' บาท')].join('<br>');
    case 'ads':      return [line('เดือน', mLabel(r.month)),
                             line('งบประมาณ', r.budget==null ? 'ไม่ระบุ' : fmt(r.budget) + ' บาท')].join('<br>');
    default:         return 'รายการนี้';
  }
}

function removeRec(set, id){
  const rec = STATE[set].find(r=>r.id===id);
  if(!rec) return;
  confirmDialog(recSummary(set, rec), () => {
    STATE[set] = STATE[set].filter(r=>r.id!==id);
    render();
    markDirty();
    toast('ลบรายการเรียบร้อย');
  });
}
function editMkt(id){
  const r = STATE.mkt.find(x=>x.id===id); if(!r) return;
  $('m-month').value=r.month; $('m-channel').value=r.channel; $('m-intake').value=r.intake;
  $('m-reject').value=r.reject; $('m-qualify').value=r.qualify; $('m-follow').value=r.follow;
  $('m-quote').value=r.quote; $('m-close').value=r.close; $('m-pipeline').value=r.pipeline;
  $('m-ads').value=r.ads??''; updateMktCalc();
  window.scrollTo({top:0, behavior:'smooth'});
}
function editAds(id){
  const r = STATE.ads.find(x=>x.id===id); if(!r) return;
  $('a-month').value=r.month; $('a-budget').value=r.budget??''; $('a-impr').value=r.impr??'';
  $('a-reach').value=r.reach??''; $('a-cpm').value=r.cpm??''; $('a-cpc').value=r.cpc??'';
  $('a-ctr').value=r.ctr??''; $('a-cpmsg').value=r.cpmsg??'';
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderRecords(){
  // 1 สรุป MKT
  const mkt = STATE.mkt.slice().sort((a,b)=>MI[a.month]-MI[b.month] || a.channel.localeCompare(b.channel));
  document.querySelector('#rec-mkt tbody').innerHTML = mkt.length ? mkt.map(r=>`<tr style="cursor:pointer" onclick="editMkt('${r.id}')">
    <td>${mLabel(r.month)}</td><td><span class="${r.channel==='fb'?'cf':'cl'}">${chLabel(r.channel)}</span></td>
    <td class="num">${fmt(r.intake)}</td><td class="num">${fmt(r.qualify)}</td><td class="num">${fmt(r.quote)}</td>
    <td class="num">${fmt(r.close)}</td><td class="num">${fmt(r.pipeline)}</td><td class="num">${r.ads==null?'—':fmt(r.ads)}</td>
    <td class="num"><button class="bd" onclick="event.stopPropagation();removeRec('mkt','${r.id}')">ลบ</button></td></tr>`).join('')
    : '<tr><td colspan="9" class="empty">ยังไม่มีระเบียน</td></tr>';

  // 2 ยอดขาย
  const s = STATE.sales.slice().sort((a,b)=>MI[a.month]-MI[b.month]);
  document.querySelector('#rec-sales tbody').innerHTML = s.length ? s.map(r=>`<tr>
    <td>${mLabel(r.month)}</td><td><strong>${esc(r.person)}</strong></td><td>${esc(r.team)||'—'}</td>
    <td>${esc(r.group)}</td><td><span class="${r.channel==='fb'?'cf':'cl'}">${chLabel(r.channel)}</span></td>
    <td>${esc(r.customer)||'—'}</td><td class="num">${fmt(r.revenue)}</td>
    <td class="num"><button class="bd" onclick="removeRec('sales','${r.id}')">ลบ</button></td></tr>`).join('')
    + `<tr class="tot"><td colspan="6">รวม</td><td class="num">${fmt(s.reduce((a,r)=>a+r.revenue,0))}</td><td></td></tr>`
    : '<tr><td colspan="8" class="empty">ยังไม่มีรายการ</td></tr>';

  // 3 ยอดประมาณการ
  const p = STATE.pipeline.slice().sort((a,b)=>MI[a.month]-MI[b.month] || b.value-a.value);
  document.querySelector('#rec-pipeline tbody').innerHTML = p.length ? p.map(r=>`<tr>
    <td>${mLabel(r.month)}</td><td>${esc(r.team)||'—'}</td><td>${esc(r.sale)||'—'}</td><td>${esc(r.customer)}</td>
    <td style="white-space:normal;max-width:230px">${esc(r.company)||'—'}</td>
    <td><span class="${r.channel==='fb'?'cf':'cl'}">${chLabel(r.channel)}</span></td>
    <td class="num">${fmt(r.value)}</td>
    <td class="num"><button class="bd" onclick="removeRec('pipeline','${r.id}')">ลบ</button></td></tr>`).join('')
    : '<tr><td colspan="8" class="empty">ยังไม่มีรายการ</td></tr>';
  $('pipe-sum').textContent = `ทั้งหมด ${p.length} โครงการ · รวม ${fmt(p.reduce((a,r)=>a+r.value,0))} บาท`;

  // 4 WIN
  document.querySelector('#rec-win tbody').innerHTML = STATE.win.length ? STATE.win.map(r=>`<tr>
    <td>${r.month?mLabel(r.month):'ไม่ระบุ'}</td><td>${esc(r.sale)}</td><td>${esc(r.projectNo)}</td>
    <td class="num">${fmt(r.value)}</td><td style="white-space:normal;max-width:260px">${esc(r.name)||'—'}</td>
    <td class="num"><button class="bd" onclick="removeRec('win','${r.id}')">ลบ</button></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">ยังไม่มีรายการ</td></tr>';
  $('win-sum').textContent = `ทั้งหมด ${STATE.win.length} โครงการ · รวม ${fmt(STATE.win.reduce((a,r)=>a+r.value,0))} บาท`;

  // 5 Ads
  const a = STATE.ads.slice().sort((x,y)=>MI[x.month]-MI[y.month]);
  document.querySelector('#rec-ads tbody').innerHTML = a.length ? a.map(r=>`<tr style="cursor:pointer" onclick="editAds('${r.id}')">
    <td>${mLabel(r.month)}</td><td class="num">${fmtR(r.budget)}</td><td class="num">${fmtR(r.impr)}</td>
    <td class="num">${fmtR(r.reach)}</td><td class="num">${dash(r.cpm)}</td><td class="num">${dash(r.cpc)}</td>
    <td class="num">${dash(r.ctr)}</td><td class="num">${dash(r.cpmsg)}</td>
    <td class="num"><button class="bd" onclick="event.stopPropagation();removeRec('ads','${r.id}')">ลบ</button></td></tr>`).join('')
    : '<tr><td colspan="9" class="empty">ยังไม่มีระเบียน</td></tr>';
}
