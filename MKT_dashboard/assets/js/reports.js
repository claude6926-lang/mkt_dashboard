'use strict';
/* ---------------------------------------------------------------- รายงานหลายชุด
   แต่ละรายงานคือแดชบอร์ดหนึ่งชุด มีข้อมูลของตัวเองแยกกันสมบูรณ์
   STATE คือข้อมูลของรายงานที่เปิดอยู่ การแก้ไขจึงไม่กระทบรายงานชุดอื่น */

const REPORTS = [];
let currentReportId = null;

const newReportId = () => 'rep' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function currentReport(){
  return REPORTS.find(r => r.id === currentReportId) || null;
}

// เก็บข้อมูลที่แก้ล่าสุดกลับเข้ารายงานที่เปิดอยู่ เรียกทุกครั้งที่ render
function syncReport(){
  const r = currentReport();
  if(r) r.data = {mkt:STATE.mkt, sales:STATE.sales, pipeline:STATE.pipeline, win:STATE.win, ads:STATE.ads};
}

// สร้างสำเนาข้อมูลแบบลึก พร้อมออกรหัสระเบียนใหม่ทั้งหมด
function cloneData(src){
  const out = {};
  for(const key of ['mkt','sales','pipeline','win','ads']){
    out[key] = (src[key] || []).map(rec => ({...rec, id: nid()}));
  }
  return out;
}

function addReport(name, data){
  const rep = {id:newReportId(), name, created:new Date(), data};
  REPORTS.push(rep);
  return rep;
}

// เปิดรายงานที่เลือก แล้วสลับข้อมูลใน STATE
function openReport(id){
  const rep = REPORTS.find(r => r.id === id);
  if(!rep) return;
  // เก็บงานที่ค้างของรายงานเดิมก่อน แต่ห้าม sync ทับตัวเองตอนเพิ่งโหลดข้อมูลมาใหม่
  if(currentReportId && currentReportId !== id) syncReport();
  currentReportId = id;
  for(const k of Object.keys(STATE)) delete STATE[k];
  Object.assign(STATE, rep.data);

  FILTER.month = 'all';
  FILTER.channel = 'all';
  RANK_GROUP = 'all';
  $('filter-month').value = 'all';
  $('filter-channel').value = 'all';
  render();
}

function renderReportBar(){
  $('report-select').innerHTML = REPORTS.map(r =>
    `<option value="${r.id}"${r.id===currentReportId?' selected':''}>${esc(r.name)}</option>`).join('');
  $('report-delete').disabled = REPORTS.length < 2;

  const rep = currentReport();
  if(!rep) return;
  const counts = ['mkt','sales','pipeline','win','ads'].reduce((a,k)=>a+(STATE[k]?STATE[k].length:0), 0);
  $('report-name').textContent = rep.name;
  $('report-meta').textContent = counts === 0
    ? 'ยังไม่มีข้อมูล · ไปที่แท็บบันทึก Report เพื่อเริ่มกรอก'
    : `${counts} ระเบียน · สร้างเมื่อ ${rep.created.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'})}`;
}

/* ---------------------------------------------------------------- กล่องสร้าง/เปลี่ยนชื่อ */
let _reportDialogMode = 'new';

function openReportDialog(mode){
  _reportDialogMode = mode;
  const rep = currentReport();
  $('nr-title').textContent = mode === 'new' ? 'สร้างแดชบอร์ดใหม่' : 'เปลี่ยนชื่อรายงาน';
  $('nr-ok').textContent    = mode === 'new' ? 'สร้างรายงาน' : 'บันทึกชื่อ';
  $('nr-modes').hidden      = mode !== 'new';
  $('nr-name').value        = mode === 'new' ? '' : (rep ? rep.name : '');
  $('nr-name').placeholder  = mode === 'new' ? 'เช่น รายงานผลการตลาด ก.ย.–ธ.ค. 2569' : '';
  document.querySelector('input[name="nr-mode"][value="blank"]').checked = true;
  $('newreport-overlay').hidden = false;
  $('nr-name').focus();
}

function closeReportDialog(){ $('newreport-overlay').hidden = true; }

function submitReportDialog(){
  const name = $('nr-name').value.trim();
  if(!name){ toast('กรุณาตั้งชื่อรายงานก่อน'); $('nr-name').focus(); return; }

  if(_reportDialogMode === 'rename'){
    const rep = currentReport();
    if(rep) rep.name = name;
    closeReportDialog();
    renderReportBar();
    markDirty();
    toast('เปลี่ยนชื่อรายงานเรียบร้อย');
    return;
  }

  const mode = document.querySelector('input[name="nr-mode"]:checked').value;
  const rep = addReport(name, mode === 'copy' ? cloneData(STATE) : blankData());
  closeReportDialog();
  openReport(rep.id);
  markDirty();
  switchTab('input');
  switchSub('mkt');
  toast(mode === 'copy'
    ? `สร้าง “${name}” จากสำเนารายงานเดิมเรียบร้อย`
    : `สร้าง “${name}” แล้ว เริ่มกรอกข้อมูลได้เลย`);
}

function deleteReport(){
  const rep = currentReport();
  if(!rep) return;
  if(REPORTS.length < 2){ toast('ต้องมีรายงานอย่างน้อยหนึ่งชุด ลบชุดสุดท้ายไม่ได้'); return; }
  const counts = ['mkt','sales','pipeline','win','ads'].reduce((a,k)=>a+(STATE[k]?STATE[k].length:0), 0);
  confirmDialog(`รายงาน: <b>${esc(rep.name)}</b><br>ข้อมูลทั้งหมด: <b>${counts} ระเบียน</b>`, () => {
    const i = REPORTS.findIndex(r => r.id === rep.id);
    REPORTS.splice(i, 1);
    currentReportId = null;
    removeReportRemote(rep.id);
    openReport(REPORTS[Math.max(0, i - 1)].id);
    toast('ลบรายงานเรียบร้อย');
  });
}

/* ---------------------------------------------------------------- เริ่มต้น */

// ใช้เมื่อยังไม่ได้ต่อหลังบ้าน หรือหลังบ้านยังไม่มีข้อมูลเลย
function bootstrapLocal(){
  REPORTS.length = 0;
  Object.assign(STATE, seedData());
  const first = addReport('รายงานผลการตลาด พ.ค.–ส.ค. 2569', {
    mkt:STATE.mkt, sales:STATE.sales, pipeline:STATE.pipeline, win:STATE.win, ads:STATE.ads
  });
  currentReportId = first.id;
}

// ใช้เมื่อโหลดข้อมูลจาก Google Sheet มาได้แล้ว
function bootstrapFromServer(payload){
  REPORTS.length = 0;
  payload.reports.forEach(r => REPORTS.push({
    id: r.id,
    name: r.name,
    created: r.created ? new Date(r.created) : new Date(),
    data: {
      mkt:      r.data.mkt      || [],
      sales:    r.data.sales    || [],
      pipeline: r.data.pipeline || [],
      win:      r.data.win      || [],
      ads:      r.data.ads      || []
    }
  }));
  currentReportId = REPORTS[0].id;
}

function initReportsUI(){
  $('report-select').addEventListener('change', e => openReport(e.target.value));
  $('nr-cancel').addEventListener('click', closeReportDialog);
  $('nr-ok').addEventListener('click', submitReportDialog);
  $('nr-name').addEventListener('keydown', e => { if(e.key === 'Enter') submitReportDialog(); });
  $('newreport-overlay').addEventListener('click', e => {
    if(e.target === $('newreport-overlay')) closeReportDialog();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !$('newreport-overlay').hidden) closeReportDialog();
  });
}
