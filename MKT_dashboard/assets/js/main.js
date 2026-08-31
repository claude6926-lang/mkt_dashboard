'use strict';
/* ---------------------------------------------------------------- นำทาง */
function switchTab(n){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#main-tabs [data-tab]').forEach(t=>t.classList.remove('active'));
  $('panel-'+n).classList.add('active');
  const t = document.querySelector('#main-tabs [data-tab="'+n+'"]'); if(t) t.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}
// โลโก้ซ้ายบน: กลับไปหน้าแดชบอร์ดและเลื่อนขึ้นบนสุด
function goHome(){
  switchTab('dashboard');
}

function switchSub(n){
  document.querySelectorAll('.sub-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#input-subtabs .tab').forEach(t=>t.classList.remove('active'));
  $('sub-'+n).classList.add('active');
  const t = document.querySelector('#input-subtabs [data-sub="'+n+'"]'); if(t) t.classList.add('active');
}

/* ---------------------------------------------------------------- เริ่มทำงาน */
// ผูกฟังก์ชันที่ปุ่มในหน้าเรียกใช้ไว้กับ window อย่างชัดเจน
Object.assign(window, {goHome, switchTab, switchSub, setGroup, openReportDialog, deleteReport, openReport, retrySave, saveMkt, saveSales, savePipeline,
  saveWin, saveAds, clearForm, removeRec, editMkt, editAds});

fillMonthSelects();
$('filter-month').addEventListener('change', e=>{ FILTER.month = e.target.value; render(); });
$('filter-channel').addEventListener('change', e=>{ FILTER.channel = e.target.value; render(); });
['m-intake','m-qualify','m-quote','m-close','m-ads','m-month','m-channel'].forEach(id=>{
  $(id).addEventListener('input', updateMktCalc);
  $(id).addEventListener('change', updateMktCalc);
});
initReportsUI();

// โหลดข้อมูลจากหลังบ้านถ้าตั้งค่าไว้ ถ้ายังไม่ได้ตั้งก็ใช้ข้อมูลตั้งต้นในเครื่อง
(async function boot(){
  if(!API.enabled){
    bootstrapLocal();
    openReport(currentReportId);
    setSync('local');
    return;
  }

  setSync('loading');
  try {
    const payload = await apiLoad();
    if(payload.reports && payload.reports.length){
      bootstrapFromServer(payload);
      openReport(currentReportId);
      setSync('saved');
    } else {
      // หลังบ้านยังว่าง ให้ส่งข้อมูลตั้งต้นขึ้นไปเป็นชุดแรก
      bootstrapLocal();
      openReport(currentReportId);
      await flushSave();
    }
  } catch(err){
    bootstrapLocal();
    openReport(currentReportId);
    setSync('error', String(err.message || err));
    toast('เชื่อมต่อหลังบ้านไม่ได้ กำลังใช้ข้อมูลตั้งต้นชั่วคราว การแก้ไขจะยังไม่ถูกบันทึก');
  }
})();
