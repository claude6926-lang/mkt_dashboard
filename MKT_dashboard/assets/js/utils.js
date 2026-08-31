'use strict';
/* ---------------------------------------------------------------- ตัวช่วย */
const $ = id => document.getElementById(id);
const num = v => (v==null||v==='') ? null : Number(v);
const fmt = n => n==null ? '—' : Math.round(n).toLocaleString('en-US');
// รักษาทศนิยมไว้ ใช้กับค่าที่ปัดแล้วจะเข้าใจผิด เช่น Ads Metrics
const fmtR = n => n==null ? '—' : (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US',{maximumFractionDigits:2}));
const fmtM = n => (n==null||n===0) ? '—' : (n/1e6).toFixed(2);
const dash = v => (v==null||v==='') ? '—' : v;
const esc = s => String(s??'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// สีของพนักงานขายคนหนึ่ง คงที่ตลอดทั้งหน้า ไม่เปลี่ยนตามตัวกรอง
const personColor = name => {
  const list = [...new Set(STATE.sales.map(r=>r.person))];
  const i = list.indexOf(name);
  return PERSON_COLORS[(i<0 ? 0 : i) % PERSON_COLORS.length];
};
const groupClass = g => GROUP_CLASS[g] || 'g-retail';
const mLabel = k => (MONTHS.find(m=>m.k===k)||{}).s || '—';
const chLabel = c => CH[c] || '—';

let FILTER = {month:'all', channel:'all'};
let RANK_GROUP = 'all';

function toast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('on'), 2600);
}

function inScope(rec){
  const okM = FILTER.month==='all' || rec.month===FILTER.month;
  const okC = FILTER.channel==='all' || rec.channel===FILTER.channel;
  return okM && okC;
}
// เดือนที่มีข้อมูลจริง เรียงตามปฏิทิน
function activeMonths(){
  const set = new Set();
  ['mkt','sales','pipeline','ads'].forEach(k => STATE[k].forEach(r=>set.add(r.month)));
  STATE.win.forEach(r=>{ if(r.month) set.add(r.month); });
  return MONTHS.filter(m=>set.has(m.k)).map(m=>m.k);
}

// ชื่อช่องกรอกจาก <label for> ใช้บอกผู้ใช้ว่าผิดตรงไหน
const fieldName = id => {
  const l = document.querySelector(`label[for="${id}"]`);
  return l ? l.textContent.replace('*','').trim() : id;
};
// คืน id ของช่องแรกที่ใส่ค่าติดลบ ถ้าไม่มีคืน null
function firstNegative(ids){
  for(const id of ids){
    const v = num($(id).value);
    if(v != null && !Number.isNaN(v) && v < 0) return id;
  }
  return null;
}

/* ---------------------------------------------------------------- กล่องยืนยัน */
// ใช้ก่อนทำสิ่งที่ย้อนกลับไม่ได้ เช่น ลบระเบียน
let _confirmAction = null;
let _confirmOpener = null;

function confirmDialog(messageHtml, onConfirm){
  _confirmAction = onConfirm;
  _confirmOpener = document.activeElement;
  $('confirm-msg').innerHTML = messageHtml;
  $('confirm-overlay').hidden = false;
  $('confirm-cancel').focus();
}

function closeConfirm(){
  $('confirm-overlay').hidden = true;
  _confirmAction = null;
  if(_confirmOpener && document.body.contains(_confirmOpener)) _confirmOpener.focus();
  _confirmOpener = null;
}

$('confirm-cancel').addEventListener('click', closeConfirm);
$('confirm-ok').addEventListener('click', () => {
  const run = _confirmAction;
  closeConfirm();
  if(run) run();
});
// คลิกพื้นหลังหรือกด Esc ถือว่ายกเลิก
$('confirm-overlay').addEventListener('click', e => { if(e.target === $('confirm-overlay')) closeConfirm(); });
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !$('confirm-overlay').hidden) closeConfirm();
});
