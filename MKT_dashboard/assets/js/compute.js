'use strict';
/* ---------------------------------------------------------------- คำนวณ */
function derive(){
  const mkt   = STATE.mkt.filter(inScope);
  const sales = STATE.sales.filter(inScope);

  const sum = (arr,f) => arr.reduce((a,r)=>a+(Number(f(r))||0),0);

  const d = {
    lead:     sum(mkt,r=>r.intake),
    reject:   sum(mkt,r=>r.reject),
    qualify:  sum(mkt,r=>r.qualify),
    follow:   sum(mkt,r=>r.follow),
    quote:    sum(mkt,r=>r.quote),
    close:    sum(mkt,r=>r.close),
    pipeline: sum(mkt,r=>r.pipeline),
    revenue:  sum(sales,r=>r.revenue),
    ads:      sum(mkt,r=>r.ads)
  };

  // CPL และ ROAS นับเฉพาะเดือนที่มีงบโฆษณาบันทึกไว้ เพื่อไม่ให้เดือนที่ยังไม่ลงงบมาเจือจางต้นทุน
  const adsMonths = [...new Set(STATE.mkt.filter(r=>inScope(r) && Number(r.ads)>0).map(r=>r.month))];
  const leadsInAdsMonths = sum(STATE.mkt.filter(r=>inScope(r) && adsMonths.includes(r.month)), r=>r.intake);
  const salesInAdsMonths = sum(STATE.sales.filter(r=>inScope(r) && adsMonths.includes(r.month)), r=>r.revenue);

  d.cpl  = (d.ads>0 && leadsInAdsMonths>0) ? d.ads/leadsInAdsMonths : null;
  d.roas = (d.ads>0) ? salesInAdsMonths/d.ads : null;
  d.adsMonths = adsMonths;
  d.leadsInAdsMonths = leadsInAdsMonths;

  // แยกรายเดือน
  d.rows = activeMonths().filter(k => FILTER.month==='all' || k===FILTER.month).map(k=>{
    const mm = STATE.mkt.filter(r=>r.month===k && inScope(r));
    const ss = STATE.sales.filter(r=>r.month===k && inScope(r));
    const lead = sum(mm,r=>r.intake), ads = sum(mm,r=>r.ads);
    return {
      key:k, label:mLabel(k), lead,
      qualify: sum(mm,r=>r.qualify),
      quote:   sum(mm,r=>r.quote),
      pipeline:sum(mm,r=>r.pipeline) || sum(STATE.pipeline.filter(r=>r.month===k && inScope(r)), r=>r.value),
      revenue: ss.length ? sum(ss,r=>r.revenue) : null,
      ads: ads||null,
      cpl: (ads>0 && lead>0) ? ads/lead : null,
      qrate: lead>0 ? sum(mm,r=>r.qualify)/lead*100 : null
    };
  });

  // แยกช่องทาง (ยอดขาย)
  d.byChannel = Object.keys(CH).map(c=>({
    channel:c, label:CH[c],
    revenue: sum(STATE.sales.filter(r=>r.channel===c && inScope(r)), r=>r.revenue)
  }));

  d.pipeline = d.rows.reduce((a,r)=>a+(r.pipeline||0), 0);

  return d;
}
