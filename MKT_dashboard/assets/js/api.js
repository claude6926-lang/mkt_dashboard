'use strict';
/* ---------------------------------------------------------------- ตัวเชื่อมหลังบ้าน
   คุยกับ Apps Script ด้วย fetch ธรรมดา
   ส่งเป็น text/plain เพื่อเลี่ยง preflight ของ CORS ซึ่ง Apps Script ไม่ตอบ */

const API = {
  get url()     { return (APP_CONFIG.apiUrl || '').trim(); },
  get token()   { return (APP_CONFIG.apiToken || '').trim(); },
  // โหมดพร็อกซี: ชี้ไปที่ /api/... บนโดเมนเดียวกัน Token อยู่ฝั่งเซิร์ฟเวอร์ ไม่ต้องมีในหน้าเว็บ
  get viaProxy(){ return this.url.startsWith('/'); },
  get enabled() { return !!this.url && (this.viaProxy || !!this.token); }
};

async function apiCall(payload){
  const body = API.viaProxy ? payload : {...payload, token: API.token};
  const res = await fetch(API.url, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify(body),
    redirect: 'follow'
  });
  if(!res.ok) throw new Error('เซิร์ฟเวอร์ตอบกลับ ' + res.status);
  const out = await res.json();
  if(!out.ok) throw new Error(out.error || 'ไม่ทราบสาเหตุ');
  return out;
}

const apiLoad         = ()   => apiCall({action:'load'});
const apiSaveReport   = rep  => apiCall({action:'saveReport', report:{
                                  id:rep.id, name:rep.name,
                                  created: rep.created instanceof Date ? rep.created.toISOString() : rep.created,
                                  data:rep.data }});
const apiDeleteReport = id   => apiCall({action:'deleteReport', id});

/* ---------------------------------------------------------------- สถานะการบันทึก */

// สถานะที่เป็นไปได้: local | loading | saving | saved | error
function setSync(state, detail){
  const el = $('sync-status');
  if(!el) return;
  const text = {
    local:   'โหมดทดลอง ยังไม่ได้ต่อหลังบ้าน',
    loading: 'กำลังโหลดข้อมูล…',
    saving:  'กำลังบันทึก…',
    saved:   'บันทึกแล้ว',
    error:   'บันทึกไม่สำเร็จ'
  }[state] || state;
  el.className = 'sync sync-' + state;
  el.textContent = text;
  el.title = detail || '';
  $('sync-retry').hidden = state !== 'error';
}

/* ---------------------------------------------------------------- คิวบันทึก
   รวบการแก้หลายครั้งติดกันให้ยิงครั้งเดียว และไม่ให้สองคำสั่งทับกัน */

let _saveTimer = null;
let _saving = false;
let _pending = false;
let _lastFailed = null;

function markDirty(){
  if(!API.enabled) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(flushSave, 700);
}

async function flushSave(){
  if(!API.enabled) return;
  if(_saving){ _pending = true; return; }

  const rep = currentReport();
  if(!rep) return;

  _saving = true;
  setSync('saving');
  try {
    await apiSaveReport(rep);
    _lastFailed = null;
    setSync('saved');
  } catch(err) {
    _lastFailed = rep.id;
    setSync('error', String(err.message || err));
    toast('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ กดปุ่ม “ลองใหม่” ข้างสถานะได้เลย');
  } finally {
    _saving = false;
    if(_pending){ _pending = false; flushSave(); }
  }
}

// ปุ่มลองใหม่ข้างสถานะ
function retrySave(){
  setSync('saving');
  flushSave();
}

async function removeReportRemote(id){
  if(!API.enabled) return;
  setSync('saving');
  try {
    await apiDeleteReport(id);
    setSync('saved');
  } catch(err) {
    setSync('error', String(err.message || err));
    toast('ลบรายงานบนเซิร์ฟเวอร์ไม่สำเร็จ');
  }
}
