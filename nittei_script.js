// 日付軸。各日2マス＝4hずつ。目盛りは累計h（4の倍数）で表示
const days=[["06/04","木"],["06/05","金"],["06/08","月"],["06/09","火"],["06/10","水"],["06/11","木"],["06/12","金"],["06/15","月"],["06/16","火"],["06/17","水"],["06/18","木"],["06/19","金"],["06/22","月"]];
const SLOTS=days.length*2, CW=30, HRS_PER_SLOT=4;
// 週末判定：曜日ラベルではなく実際の日付の連続性で判定（金曜が祝日で配列から抜けてても対応）
const dayGap=(()=>{
  const out=new Array(days.length).fill(false);
  const dates=[];
  let year=new Date().getFullYear(),prevDate=null;
  for(const d of days){
    const [mm,dd]=d[0].split('/').map(Number);
    let dt=new Date(year,mm-1,dd);
    if(prevDate && dt<=prevDate){ year++; dt=new Date(year,mm-1,dd); }
    dates.push(dt); prevDate=dt;
  }
  for(let i=0;i<dates.length-1;i++){
    if(Math.round((dates[i+1]-dates[i])/86400000)>1) out[i]=true;
  }
  return out;
})();
// COL_OFFSET は getColOffset() に移行（シミュ連動のため）
function slot(d,h){return d*2+h;}
function dateToSlot(mmdd,half){if(!mmdd)return null;const i=days.findIndex(d=>d[0]===mmdd);return i<0?null:slot(i,half||0);}

// hours=必要工数(Y列,h)。crew=人数(2:グレー/1:水色)。バー位置は累計工数から自動連結
let rows=[
  {no:"855940",nm:"8FL281304 6110 L=1478",grp:"6-2",qty:300,done:300,hours:4,proc:{start:slot(2,0),len:1,crew:2},ac:"05/29",ad:"06/05",af:"06/08"},
  {no:"855941",nm:"8FL281304 6110 L=1478",grp:"6-2",qty:100,done:100,hours:4,proc:{start:slot(2,0),len:1,crew:2},ac:"05/29",ad:"06/05",af:"06/08"},
  {no:"858188",nm:"8FL281304 6110 L=1478",grp:"6-2",qty:200,done:200,hours:4,proc:{start:slot(2,0),len:1,crew:2},ac:"05/29",ad:"06/05",af:"06/08"},
  {no:"855931",nm:"8FL281304 5010 L=888",grp:"6-2",qty:100,done:100,hours:4,proc:{start:slot(2,0),len:1,crew:2},ac:"05/29",ad:"06/05",af:"06/08"},
  {no:"855916",nm:"8FL281304 8310 L=748",grp:"6-2",qty:400,done:400,hours:4,proc:{start:slot(2,0),len:1,crew:2},ac:"05/29",ad:"06/05",af:"06/08"},
  {no:"859608",nm:"GA-770（特注）BR",grp:"6-2",qty:6,done:6,hours:4,proc:{start:slot(1,0),len:1,crew:2},ac:"06/01",ad:"06/05",af:"06/05"},
  {no:"853508",nm:"灯具カバーPC IN 2130 L=908",grp:"6-3",qty:208,done:48,hours:4,proc:{start:slot(0,0),len:1,crew:1},ac:"06/01",ad:"06/08",af:"06/12"},
  {no:"853510",nm:"灯具カバーPC IN 2050 L=1183.5",grp:"6-3",qty:208,done:0,hours:6.5,proc:{start:slot(0,1),len:2,crew:1},ac:"06/01",ad:"06/08",af:"06/12"},
  {no:"853511",nm:"灯具カバーPC IN 2080 L=1540",grp:"6-3",qty:96,done:0,hours:4,proc:{start:slot(1,0),len:1,crew:1},ac:"06/01",ad:"06/08",af:"06/15"},
  {no:"853514",nm:"灯具カバーPC IN 2100 L=1923",grp:"6-3",qty:96,done:0,hours:4,proc:{start:slot(2,0),len:1,crew:1},ac:"06/01",ad:"06/08",af:"06/15"},
  {no:"855942",nm:"8FL281304 6110 L=1478",grp:"6-4",qty:500,done:0,hours:4.2,proc:{start:slot(4,0),len:2,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855943",nm:"8FL281304 6110 L=1478",grp:"6-4",qty:100,done:0,hours:0.8,proc:{start:slot(4,1),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855944",nm:"8FL281304 6110 L=1478",grp:"6-4",qty:100,done:0,hours:0.9,proc:{start:slot(5,0),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855914",nm:"8FL281304 4910 L=592",grp:"6-4",qty:300,done:0,hours:1.7,proc:{start:slot(5,1),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855915",nm:"8FL281304 4910 L=592",grp:"6-4",qty:100,done:0,hours:0.6,proc:{start:slot(6,0),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855909",nm:"8FL281304 4810 L=297",grp:"6-4",qty:100,done:0,hours:1.0,proc:{start:slot(6,0),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855910",nm:"8FL281304 4810 L=297",grp:"6-4",qty:100,done:0,hours:0.5,proc:{start:slot(6,1),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855911",nm:"8FL281304 4810 L=297",grp:"6-5",qty:300,done:0,hours:1.5,proc:{start:slot(6,1),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855932",nm:"8FL281304 5010 L=888",grp:"6-5",qty:600,done:0,hours:3.5,proc:{start:slot(6,0),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855933",nm:"8FL281304 5010 L=888",grp:"6-5",qty:400,done:0,hours:2.4,proc:{start:slot(6,1),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855934",nm:"8FL281304 5010 L=888",grp:"6-5",qty:100,done:0,hours:0.6,proc:{start:slot(7,0),len:1,crew:2},ac:"06/03",ad:"06/10",af:"06/11"},
  {no:"855937",nm:"8FL281304 5010 L=888",grp:"6-6",qty:1000,done:0,hours:5.9,proc:{start:slot(7,0),len:2,crew:2},ac:"06/03",ad:"06/12",af:"06/12"},
  {no:"855936",nm:"8FL281304 5010 L=888",grp:"6-6",qty:2000,done:0,hours:11.8,proc:{start:slot(2,0),len:3,crew:1},ac:"06/08",ad:"06/12",af:"06/12"},
  {no:"855912",nm:"8FL281304 4810 L=297",grp:"6-7",qty:300,done:0,hours:1.5,proc:{start:slot(11,0),len:1,crew:2},ac:"06/08",ad:"06/17",af:"06/17"},
  {no:"858244",nm:"灯具カバーPC IN 2070 L=1966",grp:"6-7",qty:208,done:0,hours:8.7,proc:{start:slot(9,0),len:3,crew:1},ac:"06/10",ad:"06/17",af:"06/17"},
  {no:"853513",nm:"灯具カバーPC IN 2110 L=1815",grp:"6-7",qty:208,done:0,hours:8.7,proc:{start:slot(9,0),len:3,crew:1},ac:"06/10",ad:"06/17",af:"06/17"}
];
const original=JSON.parse(JSON.stringify(rows));

// ── シミュレーションオフセット ──
// 午後（12時以降）は自動で+4hからスタート。トグルで手動切替も可
let sim4 = (new Date().getHours() >= 12);  // 午後は自動ON
let sim8 = false;
// BAR_OFFSET（バー位置）
function getSimOffset(){ return sim8 ? 8 : (sim4 ? HRS_PER_SLOT : 0); }
// COL_OFFSET（列ラベル）：+4h=午後モード(0)、+8h/なし=午前モード(4)
function getColOffset(){
  if(sim8) return 4;
  if(sim4) return 0;
  return (new Date().getHours() < 12) ? 4 : 0;
}
function onSim4Change(v){
  sim4=!!v;
  if(sim4) sim8=false;
  syncSimUI(); buildHead(); buildBody();
}
function onSim8Change(v){
  sim8=!!v;
  if(sim8) sim4=false;
  syncSimUI(); buildHead(); buildBody();
}
function syncSimUI(){
  const c4=document.getElementById('sim4-chk');
  const c8=document.getElementById('sim8-chk');
  if(c4) c4.checked=sim4;
  if(c8) c8.checked=sim8;
}

// 品名(空白除去)→品目スペック。app.py が vfdb.json から差し込む（未注入時は空）
const VFDB_SPEC = {};
// 国民の祝日（YYYY-MM-DD）。app.py が HOLIDAYS_2026 を差し込む（未注入時は空）。休日設定カレンダーの参照表示用
const NATIONAL_HOLIDAYS = new Set([]);

function buildHead(){
  // コーナーヘッダーはテーブル外のdivに描画（theadセルのz-indexバグ回避）
  document.getElementById('corner-front').innerHTML=`<div class="hdr-left">
    <span class="grip-ph"></span>
    <span class="del-ph"></span>
    <span class="fld kyukyu hdr">支給</span>
    <span class="fld shohi hdr">消費</span>
    <span class="fld zansu hdr">残数</span>
    <span class="fld no hdr">明細No</span>
    <span class="fld nm hdr"><span class="nmtxt">品名</span><button id="show-hidden-btn" onclick="toggleShowHidden();event.stopPropagation();" title="進捗100%＋納品日超過の行を非表示/表示">非表示解除</button></span>
    <span class="fld qty hdr">注文数/h</span>
    <span class="fld done hdr">進捗</span>
    <span class="fld hrs hdr">工数/累計</span>
    <span class="fld dchip hdr" style="min-width:48px">引取</span>
    <span class="fld dchip hdr" style="min-width:48px">納品</span>
    <span class="fld denno hdr">伝票No</span>
    <span class="fld dchip hdr" style="min-width:48px">期限</span>
  </div>`;
  let h1=`<th class="corner" rowspan="2"></th>`,h2="";
  let cum=0;
  const remDates=reminderDatesSet(); // リマインダーがある日付(MM/DD) → デイラインをハイパーリンク化
  days.forEach((d,i)=>{
    const isWk=dayGap[i]; // 翌営業日との間に空き（土日・祝日）がある日の右側罫線を強調
    const hasRem=remDates.has(d[0]);
    const remTitle=hasRem?escapeHtml(reminderTitleForMmdd(d[0])):'';
    h1+=`<th class="day${isWk?' wknd-end':''}${hasRem?' has-reminder':''}" colspan="2"${hasRem?` onclick="openReminderModal('${d[0]}')" title="${remTitle}"`:''}>${d[0]}<small>(${d[1]})</small></th>`;
    // 1日2マス＝累計4の倍数の目盛り（getColOffsetで午前/午後/シミュ切替）
    const CO=getColOffset();
    const a=cum+CO; cum+=HRS_PER_SLOT; const b=cum+CO; cum+=HRS_PER_SLOT;
    h2+=`<th>${a}</th><th${isWk?' class="wknd-end"':''}>${b}</th>`;
  });
  document.getElementById('head1').innerHTML=h1;
  document.getElementById('head2').innerHTML=h2;
}
function pct(r){return r.qty?Math.round(r.done/r.qty*100):0;}

// 自動非表示判定：進捗100% かつ 納品日(ad)が今日より前
let showHidden = false;
function isAutoHide(r){
  if(!r.qty || r.done < r.qty) return false;  // 進捗100%未満はスキップしない
  const ad = r.ad; if(!ad) return false;
  const today = new Date();
  const [m,d] = ad.split('/').map(Number);
  const adDate = new Date(today.getFullYear(), m-1, d);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return adDate < todayDate;  // 納品日が今日より前（超過）
}
function toggleDetail(){
  const isHidden=document.body.classList.toggle('hide-kss');
  document.body.classList.toggle('hide-denno',isHidden);
  const btn=document.getElementById('detail-toggle-btn');
  if(btn){btn.textContent=isHidden?'詳細 ▶':'詳細 ▼';btn.classList.toggle('active',!isHidden);}
}
function toggleShowHidden(){
  showHidden = !showHidden;
  const btn = document.getElementById('show-hidden-btn');
  if(btn){ btn.textContent = showHidden ? '非表示中' : '非表示解除'; btn.classList.toggle('active', showHidden); }
  buildBody();
}

// -1枝番表示ロジック：対になる-2が存在しない場合は-1を非表示
function noDisplayStr(r){
  const s=String(r.no);
  if(/-1$/.test(s)){const base=s.replace(/-1$/,'');if(!rows.some(x=>String(x.no)===base+'-2'))return base.replace(/^0+/,'');}
  return s.replace(/^0+/,'');
}
function noIsBunno(r){
  const s=String(r.no);
  if(/-1$/.test(s)){const base=s.replace(/-1$/,'');if(!rows.some(x=>String(x.no)===base+'-2'))return false;}
  return s.includes('-');
}

function buildBody(){
  const tb=document.getElementById('body');tb.innerHTML="";
  const BAR_OFFSET=getSimOffset(); // バー表示位置（シミュトグル連動）
  const remDatesForCols=reminderDatesSet(); // リマインダーがある日付(MM/DD) → 列全体をハイライト
  let cumH=0; // 累計工数は常に0から（表示される「累X.Xh」の基準）
  let parallelActive=false; // 並行開始日行が一度出たら、以降の行も+4h/+8hトグルの影響を受けない
  let delivRiskCount=0; // 納品日を追い越す件数（遅延の恐れ・赤）
  let sameDayCount=0;   // 納品日当日に食い込む件数（当日まで作業・黄）
  let prevZansu=null; // 8FL281304行の残数累積
  rows.forEach((r,idx)=>{
    if(!showHidden && isAutoHide(r)) return;  // 自動非表示
    const p=pct(r);
    const orig=original.find(o=>o.no===r.no);
    const qtyMod=orig&&r.qty!==orig.qty;
    const afMod=orig&&r.af!==orig.af;
    const pct100=(r.qty>0&&r.done>=r.qty); // 完了フラグ
    const remaining=pct100 ? 0 : (r.qty>0 ? r.hours*(r.qty-r.done)/r.qty : r.hours); // 残工数（完了は0）
    // 並行タスク：parallelFromが設定されている場合は日付から開始位置を計算
    let startH, endH;
    if(r.parallelFrom){
      parallelActive=true; // 以降の行も含めてトグル非連動にする
      const _pi=days.findIndex(d=>d[0]===r.parallelFrom);
      // parallelFrom 行は明示的に設定した日付＝絶対位置。+4h/+8hシミュの影響は受けない
      startH=(_pi>=0)?(_pi*8):cumH;
      endH=startH+remaining;
      cumH=endH;
    }else{
      startH=cumH;
      cumH+=remaining;
      endH=cumH;
    }
    const prevDone=(idx>0&&pct(rows[idx-1])>=100);
    const isInProgress=(p>=1&&p<100)||(p===0&&prevDone);
    const tr=document.createElement('tr');tr.className="row"+(isInProgress?' in-progress':'')+(r.parallelFrom?' parallel-row':'');tr.dataset.idx=idx;
    let cells=`<td class="left"><div class="leftinner">
      <span class="grip" data-grip>⋮⋮</span>
      <button class="del-btn" onclick="askDelete(${idx});event.stopPropagation();" title="削除">×</button>
      <span class="fld kyukyu" data-edit="kyukyu" data-idx="${idx}" tabindex="0">${r.kyukyu||0}</span>
      ${(()=>{
        // SGT同期済みの値があればそれを優先、なければVFDB_SPECから計算
        // shohi: 手動設定(r.shohi)があれば優先、なければVFDB_SPECから計算
        const is8FL=String(r.nm||'').startsWith('8FL281304');
        let shohi=0;
        if(r.shohi != null){
          shohi = r.shohi;
        } else if(is8FL){
          const sp=VFDB_SPEC&&VFDB_SPEC[_normNmP(r.nm)];
          const toru=sp&&sp.toru;
          shohi=(toru>0)?Math.ceil(r.qty/toru):0;
        }
        // zansu は常にリアルタイム計算（kyukyu変更を即反映）
        const zansu=(prevZansu!=null?prevZansu:0)+(r.kyukyu||0)-shohi;
        prevZansu=zansu;
        // 8FL以外は消費列を表示しない
        const shohi_disp=is8FL?shohi:0;
        return `<span class="fld shohi">${shohi_disp}</span><span class="fld zansu">${zansu}</span>`;
      })()}
      <span class="fld no kiroku-trigger${noIsBunno(r)?' no-bunno':''}${_tokkiMap.has(String(r.no))?' has-tokki':''}" onclick="openKiroku(${idx});event.stopPropagation();">${noDisplayStr(r)}</span>
      <span class="fld nm${r.nm&&r.nm.includes('PC IN')?' nm-pcin':''}${_tokkiMap.has(String(r.no))?' has-tokki':''}"${_tokkiMap.has(String(r.no))?` data-tokki="${escapeHtml(_tokkiMap.get(String(r.no)))}"`:''}><span class="nmtxt">${r.nm}</span></span>
      <span class="fld qty${qtyMod?' mod-qty':''}" data-edit="qty" data-idx="${idx}" tabindex="0">${r.qty}<span class="phour">${(()=>{
        // 残工数(h) = (注文数 - 進捗数) ÷ DB切断工数(本/h)
        // DBはVFDB_SPEC(vfdb.json)から取得、依頼書データは参照しない
        const _sp=VFDB_SPEC&&VFDB_SPEC[_normNmP(r.nm)];
        const _ks=_sp?parseFloat(_sp.kosuu||0):0;
        const _rem=r.qty-r.done;
        return(_ks>0&&_rem>0)?(_rem/_ks).toFixed(1)+'h':'';
      })()}</span></span>
      <span class="fld done ${p>=100?'full':''}" data-edit="done" data-idx="${idx}" tabindex="0">${r.done}<small> ${p}%</small></span>
      <span class="fld hrs"><b>${remaining.toFixed(1)}</b><span class="cum">/${endH.toFixed(1)}</span>${r.parallelFrom?`<span class="parallel-mark" title="並行: ${r.parallelFrom}">⤺</span>`:''}</span>
      <span class="fld dchip mat" data-edit="ac" data-idx="${idx}" tabindex="0">${r.ac||"—"}</span>
      <span class="fld dchip deliv" data-edit="ad" data-idx="${idx}" tabindex="0">${r.ad||"—"}</span>
      <span class="fld denno" title="伝票No">${r.denno||"—"}</span>
      <span class="fld dchip due${afMod?' mod-af':''}" data-edit="af" data-idx="${idx}" tabindex="0">${r.af||"—"}</span>
    </div></td>`;
    for(let s=0;s<SLOTS;s++){
      const de=(s%2===1)?' dayend':' half';
      const isWk=(s%2===1) && dayGap[s>>1]; // 翌営業日との間に空き（土日・祝日）がある日の右側罫線を強調
      const remCol=remDatesForCols.has(days[s>>1][0])?' rem-col':'';
      cells+=`<td class="cell${de}${isWk?' wknd-end':''}${remCol}" data-s="${s}"></td>`;
    }
    tr.innerHTML=cells;tb.appendChild(tr);
    const fc=tr.querySelectorAll('td.cell')[0];
    // 工程バー：累計工数から自動連結（1h = CW/4 px）。進捗100%は非表示
    if(!pct100){
      const pxPerH=CW/HRS_PER_SLOT;
      const bar=document.createElement('div');bar.className="bar";
      const _barOff=parallelActive?0:BAR_OFFSET; // 並行開始日行以降は+4h/+8hトグルの影響を受けない（明示的に設定した日付を固定）
      bar.style.left=((startH+_barOff)*pxPerH+1)+"px";
      bar.style.width=Math.max(remaining*pxPerH-2,4)+"px";
      bar.style.background=r.nm.includes('灯具')?"var(--proc1)":"var(--proc2)"; // 灯具=一人(水色)、それ以外=二人(グレー)
      fc.appendChild(bar);
    }
    // マーカー：文字なし・バーと同高
    const addMark=(mmdd,cls,half)=>{
      const s=dateToSlot(mmdd,half);if(s==null)return;
      const m=document.createElement('div');m.className="mark "+cls;
      m.style.left=(s*CW+1)+"px";m.style.width=(CW-2)+"px";fc.appendChild(m);
    };
    // 引取(AC)は単独
    addMark(r.ac,"mat",1);
    // 納品(AD)と期限(AF)が同じスロット（午後=half:1）に重なる場合は左半分緑・右半分赤
    const sAd=dateToSlot(r.ad,1);
    const sAf=dateToSlot(r.af,1);
    if(sAd!=null && sAf!=null && sAd===sAf){
      // 左半分: 納品(緑)
      const mL=document.createElement('div');mL.className="mark deliv";
      mL.style.left=(sAd*CW+1)+"px";mL.style.width=Math.floor((CW-2)/2)+"px";fc.appendChild(mL);
      // 右半分: 期限(赤)
      const half=Math.floor((CW-2)/2);
      const mR=document.createElement('div');mR.className="mark due";
      mR.style.left=(sAd*CW+1+half)+"px";mR.style.width=(CW-2-half)+"px";fc.appendChild(mR);
    } else {
      addMark(r.ad,"deliv",1);
      addMark(r.af,"due",1); // 期限も午後列に統一
    } // 引取・納品=午後(PM), 期限=午前

    // 進捗バーが納品日カラムに差し掛かったら警告
    //   ・納品日の午前枠に差し掛かる → 当日まで作業（黄）
    //   ・納品日の午後枠に差し掛かる → 納品遅延の恐れ（赤）。赤が優先
    // 納品日の営業日index（daysは営業日のみ）。バー終端は画面同様 BAR_OFFSET(シミュ)込み
    const _di=days.findIndex(d=>d[0]===r.ad);
    if(!pct100 && _di>=0){
      const HPD=HRS_PER_SLOT*2;             // 1営業日の工数(8h)
      const visEndH=endH+(parallelActive?0:BAR_OFFSET); // 画面上のバー終端（並行開始日行以降はトグル非連動）
      const amStart=_di*HPD;                // 納品日 午前枠の始まり
      const pmStart=_di*HPD+HRS_PER_SLOT;   // 納品日 午後枠の始まり
      if(visEndH > pmStart){
        // 納品日の午後枠に差し掛かる → 納品遅延の恐れ（赤）
        tr.classList.add('deliv-risk');
        delivRiskCount++;
      }else if(visEndH > amStart){
        // 納品日の午前枠に差し掛かる → 当日まで作業（黄）
        tr.classList.add('samedaywork-risk');
        sameDayCount++;
      }
    }

    // 行クリック（グリップのみ除外、ハイライトはhoverのみ）
    tr.addEventListener('click',e=>{
      if(e.target.closest('[data-grip]'))return;
    });
  });
  attachDrag();
  attachContextMenu();
  applySelection();
  applyPicks();
  attachColHover();
  applyWeekdayHl();
  const warnEl=document.getElementById('deliv-warn');
  if(warnEl){
    if(delivRiskCount>0){
      warnEl.textContent='⚠ 納品遅延の恐れがある依頼が'+delivRiskCount+'件あります。';
      warnEl.style.display='';
    } else {
      warnEl.textContent='';
      warnEl.style.display='none';
    }
  }
  const sameDayEl=document.getElementById('samedaywork-warn');
  if(sameDayEl){
    if(sameDayCount>0){
      sameDayEl.textContent='⚠ 納品日当日まで作業が続く依頼が'+sameDayCount+'件あります。';
      sameDayEl.style.display='';
    } else {
      sameDayEl.textContent='';
      sameDayEl.style.display='none';
    }
  }
}

function attachColHover(){
  // td.cell にhoverでスロット単位（4h列）をオレンジハイライト
  document.querySelectorAll('td.cell').forEach(td=>{
    td.addEventListener('mouseenter',()=>{
      const s=td.dataset.s;
      document.querySelectorAll('td.cell').forEach(c=>c.classList.toggle('col-hl',c.dataset.s===s));
    });
    td.addEventListener('mouseleave',()=>{
      document.querySelectorAll('td.cell').forEach(c=>c.classList.remove('col-hl'));
    });
  });
}

let selectedNo=null, selectedDay=null;

// ── 曜日ボタン（月〜金）：選択した曜日のガント列（午後だけ）を緑ハイライト ──
// 複数選択可・サーバー(/weekday_hl)に永続保存＝リロード/サーバー再起動後も維持
let selectedWk = new Set();
function toggleWeekdayHl(wk){
  if(selectedWk.has(wk)) selectedWk.delete(wk);
  else selectedWk.add(wk);
  applyWeekdayHl();
  saveWeekdayHl();
}
function applyWeekdayHl(){
  document.querySelectorAll('.wk-btn').forEach(b=>b.classList.toggle('active',selectedWk.has(b.dataset.wk)));
  document.querySelectorAll('#head1 th.day').forEach(th=>th.classList.remove('wk-hl'));
  document.querySelectorAll('.mark.wk-mark').forEach(m=>m.remove()); // 前回の曜日マーカーを除去
  if(!selectedWk.size)return;
  // 選択曜日に該当する日のindex集合
  const selDays=new Set();
  days.forEach((d,i)=>{ if(selectedWk.has(d[1])) selDays.add(i); });
  if(!selDays.size)return;
  // 各行の引取(ac)・納品(ad)がある午後スロットに2色マーカーを描く
  //   左=青（曜日一致の目印） / 右= 納品:緑 ・ 引取:黄
  const half=Math.floor((CW-2)/2);
  const dayHasMark=new Set();
  document.querySelectorAll('tr.row').forEach(tr=>{
    const r=rows[+tr.dataset.idx]; if(!r)return;
    const fc=tr.querySelector('td.cell'); if(!fc)return;
    [[r.ac,'var(--mat)'],[r.ad,'var(--deliv)']].forEach(([mmdd,rightColor])=>{
      const s=dateToSlot(mmdd,1);
      if(s==null || !selDays.has(s>>1))return;
      const left=s*CW+1;
      const mL=document.createElement('div');
      mL.className='mark wk-mark'; mL.style.left=left+'px'; mL.style.width=half+'px';
      mL.style.background='#4a9eff';
      const mR=document.createElement('div');
      mR.className='mark wk-mark'; mR.style.left=(left+half)+'px'; mR.style.width=(CW-2-half)+'px';
      mR.style.background=rightColor;
      fc.appendChild(mL); fc.appendChild(mR);
      dayHasMark.add(s>>1);
    });
  });
  // 引取・納品が存在した日だけ日付ヘッダーをハイライト
  const ths=[...document.querySelectorAll('#head1 th.day')];
  dayHasMark.forEach(i=>{ if(ths[i]) ths[i].classList.add('wk-hl'); });
}
const WK_VALID=new Set(['月','火','水','木','金']);
let _wkSrvOk=false;   // /weekday_hl が新形式で応答したか（古いサーバー残存の検出用）
async function loadWeekdayHl(){
  _wkSrvOk=false;
  try{
    const resp = await fetch('http://localhost:8512/weekday_hl', {cache:'no-store'});
    if(!resp.ok)return;
    const d = await resp.json();
    // 新サーバーは {ok:true, days:[...]} を返す。
    // 配列が返る＝このルートを知らない古いサーバーがポートを握ったまま（nittei.jsonが返ってる）
    if(d && !Array.isArray(d) && Array.isArray(d.days)){
      _wkSrvOk=true;
      selectedWk=new Set(d.days.filter(x=>WK_VALID.has(x)));
    }
  }catch(e){ /* サーバー未起動時は空のまま */ }
}
async function saveWeekdayHl(){
  if(!_wkSrvOk){
    // 古いサーバーにPOSTするとルート扱いされ nittei.json を壊すので絶対に投げない
    toast('曜日設定を保存できません。古い日程サーバーが残ってます。アプリを完全に終了してから起動し直してや');
    return;
  }
  try{
    const resp = await fetch('http://localhost:8512/weekday_hl', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({days:Array.from(selectedWk)})
    });
    if(!resp.ok) toast('曜日設定の保存エラー: サーバー応答 '+resp.status);
  }catch(e){ toast('曜日設定の保存に失敗: '+e.message); }
}

document.addEventListener('DOMContentLoaded',()=>{
  // ヘッダーの「〇月度」を当月で自動表示
  const titleEl=document.getElementById('page-title');
  if(titleEl) titleEl.textContent=(new Date().getMonth()+1)+'月度 切断加工日程表';
  const wrapEl=document.querySelector('.wrap');
  if(wrapEl){
    wrapEl.addEventListener('pointerdown',()=>wrapEl.classList.add('no-select'));
    document.addEventListener('pointerup',()=>wrapEl.classList.remove('no-select'));
  }
});

function applySelection(){
  // 行ハイライト
  document.querySelectorAll('tr.row').forEach(tr=>{
    tr.classList.toggle('selected', rows[+tr.dataset.idx].no===selectedNo);
  });
  // 列ハイライト
  document.querySelectorAll('#head1 th.day').forEach(th=>th.classList.remove('col-hl'));
  document.querySelectorAll('td.cell').forEach(td=>td.classList.remove('col-hl'));
  if(selectedDay!==null){
    [...document.querySelectorAll('#head1 th.day')][selectedDay]?.classList.add('col-hl');
    document.querySelectorAll(`td.cell[data-s="${selectedDay*2}"],td.cell[data-s="${selectedDay*2+1}"]`).forEach(td=>td.classList.add('col-hl'));
  }
}

// ── 行移動（単行ドラッグ ＋ 長押し範囲選択→ブロック移動）──
const LP_MS=400, MOVE_TH=8;        // 長押し判定ミリ秒 / ドラッグ判定px
let mvPicks=[];                    // 範囲選択中の行オブジェクト配列（連続）
let mvAnchor=null;                 // 範囲選択の起点index
let dragIdx=null,dragEl=null;      // 単行ドラッグ用
let lpTimer=null,lpFired=false,downIdx=null,downX=0,downY=0,dragging=false,blockDrag=false,blockObjs=null;

function attachDrag(){document.querySelectorAll('[data-grip]').forEach(g=>g.addEventListener('pointerdown',onGripDown));}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mvPicks.length){clearPicks();toast('範囲選択を解除');}});
// 加工記録：text入力の英字を大文字強制（実値も大文字／カーソル位置は保持）
// ※モーダルはこのscriptより後に出てくるのでdocumentに委譲（要素生成タイミングに依存しない）
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.tagName!=='INPUT')return;
  if(!el.closest('#kirokuModal'))return;
  const t=(el.type||'text').toLowerCase();
  if(t!=='text'&&t!=='')return;
  const up=el.value.toUpperCase();
  if(up!==el.value){const s=el.selectionStart,en=el.selectionEnd;el.value=up;try{el.setSelectionRange(s,en);}catch(_){}}
  if(el.dataset && el.dataset.col==='1'){
    formatKeisokuLot(el);                                    // 計測ロット：区切り整形
    if(el.dataset.draft==='1'){el.dataset.draft='';el.classList.remove('kr-draft');}  // 入力したら下書き解除＝確定
  }
});
// 計測ロット：値入力後の Enter で「1行下」に同じ値を下書き生成（入力中は更新しない）
// 下書きセルで Enter を押せば確定し、さらに次の行へ下書きが連鎖する
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const el=e.target;
  if(el.tagName!=='INPUT'||!el.dataset||el.dataset.col!=='1'||!el.closest('#kirokuModal'))return;
  el.dataset.draft='';el.classList.remove('kr-draft');       // 現在セルを確定
  if(!el.value)return;
  const ri=+el.dataset.row;
  const next=document.querySelector(`#k2-daily-body input[data-row="${ri+1}"][data-col="1"]`);
  if(next && (!next.value || next.dataset.draft==='1')){
    next.value=el.value;next.dataset.draft='1';next.classList.add('kr-draft');
  }
});
// 作業日：日だけ入力したら月を自動補完（例 1 → 06/01）。月はPCのカレンダー（システム日付）から取得
function schedMonth(){
  return new Date().getMonth()+1;
}
function normalizeWorkDate(el){
  const v=(el.value||'').trim();
  if(!v)return;
  let mm,dd,m;
  if(/^\d{1,2}$/.test(v)){ mm=schedMonth(); dd=+v; }                       // 日だけ→当月補完
  else if((m=/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/.exec(v))){ mm=+m[1]; dd=+m[2]; } // M/D→ゼロ埋め
  else return;                                                             // それ以外は触らない
  if(mm<1||mm>12||dd<1||dd>31)return;
  const out=String(mm).padStart(2,'0')+'/'+String(dd).padStart(2,'0');
  if(out!==el.value) el.value=out;
}
// 加工Lot（5行）：日だけ入力で yy.mm.dd 表記に補完（例 1 → 26.06.01）。年月はPCのカレンダーから
function normalizeLotDate(el){
  const v=(el.value||'').trim();
  if(!v)return;
  const now=new Date();
  let YY=String(now.getFullYear()%100).padStart(2,'0'), mm, dd, m;
  if(/^\d{1,2}$/.test(v)){ mm=now.getMonth()+1; dd=+v; }                                 // 日だけ→当年当月
  else if((m=/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/.exec(v))){ mm=+m[1]; dd=+m[2]; }          // M/D→当年
  else if((m=/^(\d{2,4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/.exec(v))){ YY=String((+m[1])%100).padStart(2,'0'); mm=+m[2]; dd=+m[3]; } // Y.M.D→ゼロ埋め
  else return;                                                                            // それ以外は触らない
  if(mm<1||mm>12||dd<1||dd>31)return;
  const out=YY+'.'+String(mm).padStart(2,'0')+'.'+String(dd).padStart(2,'0');
  if(out!==el.value) el.value=out;
}
// 入庫日：加工Lot（yy.mm.dd）の中で最も遅い日付を MM/DD で表示
function updateNyukoBi(){
  const el=document.getElementById('k2-nyuko-bi'); if(!el)return;
  let best=null;
  for(let i=0;i<KR_LOT_ROWS;i++){
    const m=/^(\d{2})\.(\d{1,2})\.(\d{1,2})$/.exec((document.getElementById('k2-lot-'+i)?.value||'').trim());
    if(!m)continue;
    const ord=(+m[1])*10000+(+m[2])*100+(+m[3]);
    if(best===null||ord>best.ord) best={ord,mm:+m[2],dd:+m[3]};
  }
  if(best) el.value=String(best.mm).padStart(2,'0')+'/'+String(best.dd).padStart(2,'0');
}
document.addEventListener('focusout',e=>{
  const el=e.target;
  if(el.tagName!=='INPUT')return;
  if(el.dataset&&el.dataset.col==='0'&&el.closest('#kirokuModal')) normalizeWorkDate(el);  // 作業日 MM/DD
  if(/^k2-lot-\d+$/.test(el.id)){ normalizeLotDate(el); updateNyukoBi(); }                  // 加工Lot yy.mm.dd → 入庫日更新
});
// 加工Lot・箱数・不良数の移動
//  Enter：加工Lot→（右）箱数→（次段の）加工Lot…とジグザグ。不良数は下へ
//  ↑↓：各列内の縦移動
const KR_VGROUPS=[
  ['k2-lot-0','k2-lot-1','k2-lot-2','k2-lot-3','k2-lot-4'],
  ['k2-hako-0','k2-hako-1','k2-hako-2','k2-hako-3','k2-hako-4'],
  ['f2-kizu','f2-kubomi','f2-imono','f2-kake','f2-meyani','f2-peko','f2-sonota'],
];
const KR_ENTER_SEQ=(()=>{const a=[];for(let i=0;i<5;i++){a.push('k2-lot-'+i,'k2-hako-'+i);}return a;})();
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  const id=e.target&&e.target.id;
  if(!id)return;
  let t=null;
  if(e.key==='Enter'){
    if(KR_ENTER_SEQ.includes(id)){                       // 加工Lot⇔箱数のジグザグ
      const ni=KR_ENTER_SEQ.indexOf(id)+1; e.preventDefault();
      if(ni<KR_ENTER_SEQ.length) t=document.getElementById(KR_ENTER_SEQ[ni]);
    }else{
      const g=KR_VGROUPS.find(a=>a.includes(id)); if(!g)return;
      const ni=g.indexOf(id)+1; e.preventDefault();
      if(ni<g.length) t=document.getElementById(g[ni]);
    }
  }else{                                                 // ↑↓は縦移動
    const g=KR_VGROUPS.find(a=>a.includes(id)); if(!g)return;
    const ni=g.indexOf(id)+((e.key==='ArrowUp')?-1:1); e.preventDefault();
    if(ni>=0&&ni<g.length) t=document.getElementById(g[ni]);
  }
  if(t){t.focus();if(t.select)t.select();}
});
// 計測ロット書式：2字 [空白] 1字 [空白] 2字 [-] 残り（例 AB C DE-F）／カーソル保持
function lotFmt(raw){
  let out='';
  for(let i=0;i<raw.length;i++){
    if(i===2||i===3) out+=' ';   // 2-3文字目間／3-4文字目間にスペース
    if(i===5) out+='-';          // 5-6文字目間にハイフン
    out+=raw[i];
  }
  return out;
}
function formatKeisokuLot(el){
  const caret=el.selectionStart;
  const k=el.value.slice(0,caret).replace(/[ -]/g,'').length;   // カーソルより前の実文字数
  const raw=el.value.replace(/[ -]/g,'');
  const out=lotFmt(raw);
  if(out===el.value) return;
  el.value=out;
  const np=lotFmt(raw.slice(0,k)).length;
  try{el.setSelectionRange(np,np);}catch(_){}
}

function applyPicks(){
  const set=new Set(mvPicks);
  document.querySelectorAll('tr.row').forEach(tr=>tr.classList.toggle('mv-pick',set.has(rows[+tr.dataset.idx])));
  const sb=document.getElementById('sort-due-btn');
  if(sb){
    sb.style.display=mvPicks.length>=2?'':'none';
    sb.textContent=`⇅ 期限で${mvSortDir>0?'昇順':'降順'}ソート（${mvPicks.length}行）`;
  }
}

let mvSortDir=1;   // 1=昇順 / -1=降順（押すたび反転）
function dueKey(o){const m=/^(\d{1,2})\/(\d{1,2})$/.exec((o.af||'').trim());return m?(+m[1])*100+(+m[2]):99999;}
function sortPicksByDue(){
  if(mvPicks.length<2)return;
  const slots=mvPicks.map(o=>rows.indexOf(o)).sort((a,b)=>a-b);   // 選択行の現在位置（連続）
  const sorted=mvPicks.slice().sort((a,b)=>(dueKey(a)-dueKey(b))*mvSortDir);
  slots.forEach((s,i)=>rows[s]=sorted[i]);                        // 同じ枠に並べ替えて戻す
  mvPicks=sorted;                                                 // 選択は維持
  buildBody();
  toast(`選択${sorted.length}行を期限${mvSortDir>0?'昇順':'降順'}でソート`);
  mvSortDir*=-1;                                                  // 次回は逆向き
  saveRows();
}
function clearPicks(){mvPicks=[];mvAnchor=null;applyPicks();}
function setRange(aIdx,bIdx){
  const lo=Math.min(aIdx,bIdx),hi=Math.max(aIdx,bIdx);
  mvPicks=rows.slice(lo,hi+1);applyPicks();
  toast(`${mvPicks.length}行を選択（グリップをドラッグで移動）`);
}

function onGripDown(e){
  e.preventDefault();
  const tr=e.target.closest('tr');
  downIdx=+tr.dataset.idx;downX=e.clientX;downY=e.clientY;
  dragging=false;lpFired=false;
  // すでに複数選択中で、その中の行を掴んだ→ブロック移動の構え
  blockDrag=mvPicks.length>1 && mvPicks.includes(rows[downIdx]);
  lpTimer=setTimeout(()=>{                 // 長押し＝範囲選択モード開始
    if(mvPicks.length===0){
      lpFired=true;mvAnchor=downIdx;mvPicks=[rows[downIdx]];applyPicks();
      toast('範囲選択：もう1行タップで範囲指定 → ドラッグで移動');
    }
  },LP_MS);
  document.addEventListener('pointermove',onGripMove);
  document.addEventListener('pointerup',onGripUp);
}

function onGripMove(e){
  if(!dragging){
    if(Math.abs(e.clientX-downX)<=MOVE_TH && Math.abs(e.clientY-downY)<=MOVE_TH) return;
    clearTimeout(lpTimer);               // 動いた＝ドラッグ確定
    dragging=true;
    if(blockDrag){
      blockObjs=mvPicks.slice();
      document.querySelectorAll('tr.row').forEach(tr=>{if(blockObjs.includes(rows[+tr.dataset.idx]))tr.classList.add('dragging');});
    }else{
      clearPicks();                      // 非選択行のドラッグは単行移動
      dragIdx=downIdx;dragEl=document.querySelector(`tr[data-idx="${dragIdx}"]`);dragEl.classList.add('dragging');
    }
  }
  if(blockDrag)onBlockDrag(e);else onSingleDrag(e);
}

function onSingleDrag(e){
  const y=e.clientY;
  for(const tr of document.querySelectorAll('tr.row')){
    if(tr===dragEl)continue;
    const rc=tr.getBoundingClientRect();
    if(y>rc.top&&y<rc.bottom){
      const o=+tr.dataset.idx;
      if(o!==dragIdx){const it=rows.splice(dragIdx,1)[0];rows.splice(o,0,it);dragIdx=o;buildBody();dragEl=document.querySelector(`tr[data-idx="${dragIdx}"]`);dragEl.classList.add('dragging');}
      break;
    }
  }
}

function onBlockDrag(e){
  const y=e.clientY;
  for(const tr of document.querySelectorAll('tr.row')){
    const i=+tr.dataset.idx;
    if(blockObjs.includes(rows[i]))continue;   // ブロック内の行は基準にしない
    const rc=tr.getBoundingClientRect();
    if(y>rc.top&&y<rc.bottom){
      const targetObj=rows[i];
      const above=y<(rc.top+rc.height/2);
      rows=rows.filter(r=>!blockObjs.includes(r));   // ブロックを抜く
      let ti=rows.indexOf(targetObj);if(!above)ti+=1;
      rows.splice(ti,0,...blockObjs);                // 元の順序のまま挿入
      buildBody();
      document.querySelectorAll('tr.row').forEach(tr=>{if(blockObjs.includes(rows[+tr.dataset.idx]))tr.classList.add('dragging');});
      break;
    }
  }
}

function onGripUp(e){
  clearTimeout(lpTimer);
  document.removeEventListener('pointermove',onGripMove);
  document.removeEventListener('pointerup',onGripUp);
  if(dragging){
    document.querySelectorAll('tr.dragging').forEach(tr=>tr.classList.remove('dragging'));
    if(blockDrag){mvPicks=blockObjs?blockObjs.slice():[];mvAnchor=null;applyPicks();}  // 移動後も選択は維持
    dragEl=null;dragIdx=null;blockObjs=null;
    saveRows();
  }else if(!lpFired && mvAnchor!=null){           // 長押し後の2点目タップ＝範囲確定
    setRange(mvAnchor,downIdx);
  }
  dragging=false;blockDrag=false;lpFired=false;downIdx=null;
}

// ── インライン編集 ──
let activeCell=null;

function getEditableCells(){
  return [...document.querySelectorAll('[data-edit]')];
}

function startEdit(el, prefill){
  // rebuild:false → el がデタッチされないよう遷移時はリビルドしない
  if(activeCell) commitEdit(activeCell, false);
  const idx=+el.dataset.idx;
  const field=el.dataset.edit;
  const isDate=(field==='ac'||field==='ad'||field==='af');
  const curVal=prefill!==undefined ? prefill : (isDate?(rows[idx][field]||''):(rows[idx][field]??0));

  el.classList.add('editing','selected-cell');
  const input=document.createElement('input');
  input.type=isDate?'text':'number';
  input.value=curVal;
  if(!isDate){input.min=0; if(field==='done')input.max=rows[idx].qty; if(field==='shohi')input.max=rows[idx].kyukyu||9999;}
  if(isDate)input.placeholder='MM/DD';
  el.innerHTML='';
  el.appendChild(input);
  input.focus();input.select();
  activeCell={el,idx,field,isDate};

  input.addEventListener('keydown',e=>{
    const navKeys=['Enter','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    if(navKeys.includes(e.key)){
      e.preventDefault();
      // Enter on ac/ad → 確定値を下セルに引き継ぐ
      const _doCarry = e.key==='Enter' && (field==='ac'||field==='ad');
      const _carryIdx = idx, _carryField = field;
      commitEdit(activeCell, false);
      const all=getEditableCells();
      const cur=all.indexOf(el);
      const renderedRows=document.getElementById('body').querySelectorAll('tr.row').length;
      const fpr=renderedRows>0?Math.round(all.length/renderedRows):6; // fields per row
      let targetIdx=null;
      if(e.key==='Enter'||e.key==='ArrowDown')                              targetIdx=cur+fpr;
      else if(e.key==='ArrowUp')                                             targetIdx=cur-fpr;
      else if((e.key==='Tab'&&!e.shiftKey)||e.key==='ArrowRight')           targetIdx=cur+1;
      else if((e.key==='Tab'&&e.shiftKey)||e.key==='ArrowLeft')             targetIdx=cur-1;
      buildBody();
      if(targetIdx!=null&&targetIdx>=0){
        const newAll=getEditableCells();
        if(newAll[targetIdx]){
          if(_doCarry) startEdit(newAll[targetIdx], rows[_carryIdx][_carryField]||'');
          else startEdit(newAll[targetIdx]);
        }
      }
    }
    if(e.key==='Escape'){cancelEdit(activeCell);}
    e.stopPropagation();
  });
  input.addEventListener('blur',()=>{
    setTimeout(()=>{if(activeCell&&activeCell.el===el)commitEdit(activeCell);},100);
  });
}

function commitEdit(ac, rebuild=true){
  if(!ac)return;
  const {el,idx,field,isDate}=ac;
  const input=el.querySelector('input');
  if(!input){activeCell=null;return;}
  let v=input.value.trim();

  if(isDate){
    // 日数のみ入力 (1〜31) → 当月 MM/DD に自動変換（引取・納品列のみ）
    if(v && /^\d{1,2}$/.test(v) && (field==='ac'||field==='ad')){
      const _d=parseInt(v,10);
      if(_d>=1&&_d<=31){const _now=new Date();v=String(_now.getMonth()+1).padStart(2,'0')+'/'+String(_d).padStart(2,'0');}
    }
    if(v&&!/^\d{1,2}\/\d{1,2}$/.test(v)){toast('MM/DD 形式で入力（例 06/12）');cancelEdit(ac);return;}
    if(v){const[m,d]=v.split('/');v=m.padStart(2,'0')+'/'+d.padStart(2,'0');}
    if(!v && field==='af'){const orig=original.find(o=>o.no===rows[idx].no);v=orig?.af||null;}
    rows[idx][field]=v||null;
    if(field==='ad'){ rows[idx].denno=null; autoAssignDenno(true); } // 納品日変更→その行のdennoをリセットして再採番
  } else if(field==='qty'){
    let n=parseInt(v||'0',10);if(isNaN(n)||n<0)n=0;
    rows[idx].qty=n;
    if(rows[idx].done>n)rows[idx].done=n;
  } else if(field==='kyukyu'){
    let n=parseInt(v||'0',10);if(isNaN(n)||n<0)n=0;
    rows[idx].kyukyu=n;
  } else if(field==='shohi'){
    let n=parseInt(v||'0',10);if(isNaN(n)||n<0)n=0;
    rows[idx].shohi=n;
  } else {
    let n=parseInt(v||'0',10);if(isNaN(n)||n<0)n=0;if(n>rows[idx].qty)n=rows[idx].qty;
    rows[idx].done=n;
  }
  activeCell=null;
  if(rebuild){
    buildBody();
    saveRows();
  }
}

function cancelEdit(ac){
  if(!ac)return;
  activeCell=null;
  buildBody();
}

// セルクリック→編集開始 / キー入力で即編集開始
document.addEventListener('click',e=>{
  // 編集中セルの内部クリック（input上でのカーソル移動等）は無視
  if(activeCell && activeCell.el.contains(e.target)) return;
  const el=e.target.closest('[data-edit]');
  if(el){startEdit(el);return;}
  if(activeCell&&!e.target.closest('.editing'))commitEdit(activeCell);
});
document.addEventListener('keydown',e=>{
  if(activeCell)return; // 編集中は干渉しない
  const focused=document.activeElement;
  if(focused&&focused.dataset&&focused.dataset.edit){
    if(/^[\d]$/.test(e.key)||e.key==='Backspace'){
      startEdit(focused);
    }
  }
});

// ── 伝票No列 表示切替 ──
function toggleDenno(){
  // 後方互換用（直接呼び出し不要だが残しておく）
  toggleDetail();
}

// ── 伝票No 自動採番 ──
// 月ごとに納品日順で 1 から振り直す。同じ納品日は同じ伝票No、7件で次のNoへ。
// 既存のNoがあっても無視して振り直す（ゴミNo・月跨ぎ混入を一掃するため）。
// silent=true のときは buildBody/markDirty/toast を呼ばない（commitEdit から呼ぶ時用）
function autoAssignDenno(silent=false){
  // 納品日(ad)を持つ行が対象。ad の無い行の denno は触らない
  const targets=rows.filter(r=>r.ad);
  if(!targets.length){
    if(!silent)toast('採番対象の行がありません');
    return;
  }

  // 月でグループ化（納品日の先頭が月）
  const byMonth={}; // { 月: [行,...] }
  targets.forEach(r=>{
    const m=parseInt(r.ad.split('/')[0],10);
    if(isNaN(m))return;
    (byMonth[m]=byMonth[m]||[]).push(r);
  });

  let changed=0;
  // 月を昇順に処理。各月は連番 1 から
  Object.keys(byMonth).map(Number).sort((a,b)=>a-b).forEach(m=>{
    const prefix=m+'-';
    // 納品日昇順（同日内は元の並び維持）
    const grp=byMonth[m].slice().sort((a,b)=>{
      const[am,ad]=a.ad.split('/').map(Number);
      const[bm,bd]=b.ad.split('/').map(Number);
      return(am*100+ad)-(bm*100+bd);
    });

    let seq=0,count=0,cur=null,lastDate=null;
    grp.forEach(r=>{
      // 納品日が変わる or 同日でも7件超で新しい伝票Noへ
      if(cur===null||lastDate!==r.ad||count>=7){
        seq++;
        cur=prefix+seq;
        count=0;
        lastDate=r.ad;
      }
      if(r.denno!==cur)changed++;
      r.denno=cur;
      count++;
    });
  });

  if(!silent){buildBody();toast('伝票Noを再採番しました（'+changed+'件変更）');saveRows();}
}

function resetOrder(){rows=JSON.parse(JSON.stringify(original));markClean();buildBody();toast("元に戻したで");}

let _dirty = false;
function markDirty(){
  _dirty = true;
  const btn = document.getElementById('save-btn');
  if(btn) btn.textContent = '保存 *';
  window.parent.postMessage({type:'nittei_dirty', dirty:true}, '*');
}
function markClean(){
  _dirty = false;
  const btn = document.getElementById('save-btn');
  if(btn) btn.textContent = '保存';
  window.parent.postMessage({type:'nittei_dirty', dirty:false}, '*');
}

async function saveRows(){
  // 編集中セルの値を保存前に確定（blur遅延コミット待ちで入力値が消えるのを防ぐ）
  if(activeCell){ try{ commitEdit(activeCell, false); }catch(_){} }
  const btn = document.getElementById('save-btn');
  if(btn){ btn.disabled=true; btn.textContent='保存中…'; }
  try {
    const resp = await fetch('http://localhost:8512/', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(rows)
    });
    if(resp.ok){ markClean(); toast('保存しました ✓'); }
    else { toast('保存エラー: サーバー応答 '+resp.status); }
  } catch(e) {
    toast('保存エラー: '+e.message);
  } finally {
    if(btn){ btn.disabled=false; btn.textContent=_dirty?'保存 *':'保存'; }
  }
}

window.addEventListener('beforeunload', e=>{
  if(_dirty){ e.preventDefault(); e.returnValue=''; }
});

// ── 休日設定（年間カレンダーで選択→デイラインから除外） ──
let holidayYear = new Date().getFullYear();
let customHolidays = new Set();
let holidayDirty = false;

async function openHolidayModal(){
  document.getElementById('holidayModal').classList.add('on');
  try{
    const resp = await fetch('http://localhost:8512/holidays', {cache:'no-store'});
    if(resp.ok){ customHolidays = new Set(await resp.json()); }
  }catch(e){
    toast('休日データの取得に失敗: '+e.message);
  }
  holidayDirty = false;
  renderHolidayCalendar();
}
function closeHolidayModal(){
  document.getElementById('holidayModal').classList.remove('on');
}
function shiftHolidayYear(n){
  holidayYear += n;
  renderHolidayCalendar();
}
function hymd(y,m,d){
  return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function renderHolidayCalendar(){
  document.getElementById('holidayYearLabel').textContent = holidayYear+'年';
  const todayStr = (()=>{const t=new Date();return hymd(t.getFullYear(),t.getMonth(),t.getDate());})();
  let html='';
  for(let m=0;m<12;m++){
    const nDays = new Date(holidayYear,m+1,0).getDate();
    const startWk = new Date(holidayYear,m,1).getDay();
    html+=`<div class="hmonth"><div class="hm-title">${m+1}月</div>
      <div class="hm-week"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div>
      <div class="hm-days">`;
    for(let i=0;i<startWk;i++) html+=`<span class="hday blank"></span>`;
    for(let d=1;d<=nDays;d++){
      const dt=hymd(holidayYear,m,d);
      const wk=new Date(holidayYear,m,d).getDay();
      const isWkend=(wk===0||wk===6);
      const isNatl=NATIONAL_HOLIDAYS.has(dt);
      const isCustom=customHolidays.has(dt);
      let cls='hday';
      if(isWkend) cls+=' wknd';
      if(isNatl) cls+=' natl';
      if(isCustom) cls+=' custom';
      if(dt===todayStr) cls+=' today';
      const clickable = !isWkend && !isNatl;
      html+=`<span class="${cls}"${clickable?` onclick="toggleHoliday('${dt}')"`:''} title="${dt}${isWkend?'（週末・除外済）':isNatl?'（祝日・除外済）':''}">${d}</span>`;
    }
    html+=`</div></div>`;
  }
  document.getElementById('holidayGrid').innerHTML=html;
  document.getElementById('holidayStatus').textContent=`休日設定：${customHolidays.size}件（クリックで追加/解除）`;
}
async function toggleHoliday(dt){
  if(customHolidays.has(dt)) customHolidays.delete(dt);
  else customHolidays.add(dt);
  holidayDirty=true;
  renderHolidayCalendar();
  try{
    const resp = await fetch('http://localhost:8512/holidays', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(Array.from(customHolidays))
    });
    if(!resp.ok) toast('休日の保存エラー: サーバー応答 '+resp.status);
  }catch(e){
    toast('休日の保存に失敗: '+e.message);
  }
}
function applyHolidayReload(){
  if(_dirty){
    toast('未保存の変更があるで。先に「保存」してから反映してや');
    return;
  }
  try{ (window.parent||window).location.reload(); }catch(e){ location.reload(); }
}

// ── リマインダー（日時+内容を登録→デイラインの一致日をハイパーリンク化） ──
let reminders = [];
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function remMmdd(dateStr){
  const p = String(dateStr||'').split('-');
  return p.length===3 ? p[1]+'/'+p[2] : '';
}
function reminderDatesSet(){
  return new Set(reminders.map(r=>remMmdd(r.date)));
}
function reminderTitleForMmdd(mmdd){
  // その日のリマインダーを時刻順に並べて改行区切りで返す（title属性のhoverで内容確認用）
  return reminders
    .filter(r=>remMmdd(r.date)===mmdd)
    .sort((a,b)=>(a.time||'').localeCompare(b.time||''))
    .map(r=>`${r.time?r.time+' ':''}${r.text}`)
    .join('\n');
}
async function loadReminders(){
  try{
    const resp = await fetch('http://localhost:8512/reminders', {cache:'no-store'});
    if(resp.ok){ reminders = await resp.json(); }
  }catch(e){ /* サーバー未起動時は空のまま */ }
}
async function openReminderModal(focusMmdd){
  document.getElementById('reminderModal').classList.add('on');
  await loadReminders();
  if(focusMmdd){
    const [mm,dd]=focusMmdd.split('/');
    const y=new Date().getFullYear();
    document.getElementById('remDateInput').value=`${y}-${mm}-${dd}`;
  }
  renderReminderList(focusMmdd);
}
function closeReminderModal(){
  document.getElementById('reminderModal').classList.remove('on');
}
function renderReminderList(focusMmdd){
  const list=document.getElementById('reminderList');
  if(!reminders.length){ list.innerHTML='<div class="rem-empty">リマインダーはまだ無いで</div>'; return; }
  const sorted=[...reminders].sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
  list.innerHTML=sorted.map(r=>{
    const mmdd=remMmdd(r.date);
    const hl=focusMmdd && mmdd===focusMmdd ? ' rem-hl' : '';
    return `<div class="rem-item${hl}">
      <span class="rem-date">${mmdd}${r.time?(' '+r.time):''}</span>
      <span class="rem-text">${escapeHtml(r.text)}</span>
      <button class="rem-del" onclick="deleteReminder('${r.id}')" title="削除">✕</button>
    </div>`;
  }).join('');
}
async function addReminder(){
  const date=document.getElementById('remDateInput').value;
  const time=document.getElementById('remTimeInput').value;
  const text=document.getElementById('remTextInput').value.trim();
  if(!date || !text){ toast('日付と内容を入力してや'); return; }
  reminders.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), date, time, text, created:new Date().toISOString()});
  document.getElementById('remTextInput').value='';
  await saveReminders();
  renderReminderList();
  buildHead(); buildBody();
}
async function deleteReminder(id){
  reminders=reminders.filter(r=>r.id!==id);
  await saveReminders();
  renderReminderList();
  buildHead(); buildBody();
}
async function saveReminders(){
  try{
    const resp=await fetch('http://localhost:8512/reminders', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(reminders)
    });
    if(!resp.ok) toast('リマインダーの保存エラー: サーバー応答 '+resp.status);
  }catch(e){
    toast('リマインダーの保存に失敗: '+e.message);
  }
}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2800);}
// 別ウィンドウ化の事前テスト：ポップアップを開く許可があるか確認
function testPopup(){
  try{
    const w = window.open('about:blank','kr_test','width=440,height=320');
    if(w && !w.closed){
      w.document.write('<div style="font-family:sans-serif;padding:20px;font-size:15px;line-height:1.6">✅ ポップアップ開けたで！<br>別ウィンドウ化いけるわ 👍<br><br>このウィンドウは閉じてOK（4秒で自動で閉じます）</div>');
      toast('✅ ポップアップ許可あり！別ウィンドウ化いけるで');
      setTimeout(()=>{ try{w.close();}catch(_){} }, 4000);
    }else{
      toast('🚫 ブロックされた…リンク式に切替が要るわ');
    }
  }catch(e){
    toast('🚫 ブロック（'+e.message+'）…リンク式に切替が要るわ');
  }
}

// ── 削除 ──
let pendingDeleteIdx=null;
let pendingDeleteObjs=null;   // 複数削除用
function askDelete(idx){
  const r=rows[idx];
  // 複数選択中かつ対象行が選択内に含まれる→一括削除モード
  if(mvPicks.length>=2 && mvPicks.includes(r)){
    pendingDeleteObjs=mvPicks.slice();
    pendingDeleteIdx=null;
    document.getElementById('ctitleText').textContent=`${pendingDeleteObjs.length}件のタスクを削除しますか？`;
    document.getElementById('confirmItem').textContent=pendingDeleteObjs.map(o=>o.nm).join('、');
  }else{
    pendingDeleteIdx=idx;
    pendingDeleteObjs=null;
    document.getElementById('ctitleText').textContent='タスクを削除しますか？';
    document.getElementById('confirmItem').textContent=r.nm+'  '+r.qty+'本';
  }
  document.getElementById('confirmModal').classList.add('on');
}
function confirmDelete(){
  if(pendingDeleteObjs){
    const delSet=new Set(pendingDeleteObjs);
    const cnt=pendingDeleteObjs.length;
    for(let i=rows.length-1;i>=0;i--){if(delSet.has(rows[i]))rows.splice(i,1);}
    pendingDeleteObjs=null;
    clearPicks();
    closeConfirm();
    buildBody();
    toast(`${cnt}件を削除しました`);
    saveRows();
  }else if(pendingDeleteIdx!==null){
    rows.splice(pendingDeleteIdx,1);
    pendingDeleteIdx=null;
    closeConfirm();
    buildBody();
    toast('削除しました');
    saveRows();
  }
}
function closeConfirm(){
  pendingDeleteIdx=null;
  pendingDeleteObjs=null;
  document.getElementById('confirmModal').classList.remove('on');
}


// ══════════════════════════════════════════════
// 加工記録 別窓化 v3
// ══════════════════════════════════════════════
const KAKOU_PORT    = 8513;
const KR_FIXED_ROWS = 10;
const KR_LOT_ROWS   = 5;
const KR_MAX_COL    = 4;
let _kirokuWin = null;
let _tokkiMap = new Map(); // 明細No → ④特記事項テキスト（明細Noリンクの黄色ハイライト・品名ホバー表示用）
// 特記事項ツールチップ：body直下の1個を使い回し、遅延なしで即表示
(function initTokkiFloat(){
  let tip = null;
  const ensure = () => {
    if(!tip){ tip = document.createElement('div'); tip.id = 'tokki-float'; document.body.appendChild(tip); }
    return tip;
  };
  document.addEventListener('mouseover', e => {
    const nm = e.target.closest && e.target.closest('.fld.nm.has-tokki');
    if(!nm || !nm.dataset.tokki) return;
    const t = ensure();
    t.textContent = nm.dataset.tokki;
    const r = nm.getBoundingClientRect();
    t.style.display = 'block';
    // まず表示してサイズ確定→はみ出し補正
    let top = r.bottom + 4, left = r.left;
    if(left + t.offsetWidth > window.innerWidth - 8) left = window.innerWidth - 8 - t.offsetWidth;
    if(top + t.offsetHeight > window.innerHeight - 8) top = r.top - 4 - t.offsetHeight;
    t.style.left = Math.max(4, left) + 'px';
    t.style.top  = Math.max(4, top) + 'px';
  });
  document.addEventListener('mouseout', e => {
    const nm = e.target.closest && e.target.closest('.fld.nm.has-tokki');
    if(nm && tip) tip.style.display = 'none';
  });
})();
async function syncTokkiHighlight(){
  try{
    const resp = await fetch('http://localhost:'+KAKOU_PORT+'/', {cache:'no-store'});
    if(!resp.ok) return;
    const all = await resp.json();
    _tokkiMap = new Map(
      all.filter(rec => (rec?.tokki||'').trim())
         .map(rec => [String(rec.meisai_no), rec.tokki.trim()])
    );
  }catch(e){ /* 加工記録サーバー未起動時などは静かにスキップ */ }
}

const _normNmP = s => String(s||'').normalize('NFKC').replace(/\s+/g,'');

const SCHEDULE_BASE_YEAR = 2026; // 日程表の基準年（年明けの表に切り替えたらここを更新）
// 納品日 mm/dd → yy/mm/dd。先頭日より月が戻っていたら翌年扱い（12→1の年またぎ対策）
function adToYYMMDD(mmdd){
  if(!mmdd) return '';
  const parts = String(mmdd).split('/');
  if(parts.length < 2) return '';
  const m = parseInt(parts[0],10), d = parseInt(parts[1],10);
  if(!m || !d) return '';
  const baseM = parseInt(days[0][0].split('/')[0],10);
  let y = SCHEDULE_BASE_YEAR;
  if(m < baseM) y += 1;
  return String(y).slice(-2) + '/' + String(m).padStart(2,'0') + '/' + String(d).padStart(2,'0');
}
function openKiroku(idx) {
  const r = rows[idx];
  // 直前タスクのNoを渡す（準備時間算出に使用）
  let prevNo = null;
  for(let pi = idx - 1; pi >= 0; pi--) {
    if(showHidden || !isAutoHide(rows[pi])) { prevNo = rows[pi].no; break; }
  }
  const meta = {no: r.no, nm: r.nm, qty: r.qty, grp: r.grp||'', ad: adToYYMMDD(r.ad), idx: idx, prevNo};

  // ポップアップをユーザー操作コンテキスト内で即座に開く（ブロック回避）
  let win;
  if (_kirokuWin && !_kirokuWin.closed) {
    win = _kirokuWin;
    win.focus();
  } else {
    const fw = window.screen.availWidth, fh = window.screen.availHeight;
    win = window.open('', 'kirokuWin', `width=${fw},height=${fh},left=0,top=0,resizable=yes`);
    if (!win) { toast('ポップアップがブロックされました。ブラウザの設定をご確認ください。'); return; }
    _kirokuWin = win;
  }

  // 最新の vfdb_spec をサーバーから取得してから遷移
  fetch('http://localhost:' + KAKOU_PORT + '/vfdb_spec')
    .then(res => res.ok ? res.json() : null)
    .catch(() => null)
    .then(liveSpec => {
      const specSrc = (liveSpec && !Array.isArray(liveSpec) && Object.keys(liveSpec).length) ? liveSpec : VFDB_SPEC;
      const spec = (specSrc && specSrc[_normNmP(r.nm)]) || null;
      const params = new URLSearchParams({
        meta: JSON.stringify(meta),
        spec: JSON.stringify(spec)
      });
      win.location.href = 'http://localhost:' + KAKOU_PORT + '/ui?' + params.toString();
    });
}

// 加工記録入力ページの保存/完了(修正)ボタン押下時に日程ページをリロードして最新データに更新
function reloadNitteiPage(){
  if(_dirty){ toast('未保存の変更があるで。保存してから開き直してや'); return; }
  try{ (window.parent||window).location.reload(); }catch(e){ location.reload(); }
}

// 加工記録ウィンドウから前後タスクへのナビゲーション
function openKirokuNeighbor(currentIdx, dir) {
  let idx = currentIdx + dir;
  while(idx >= 0 && idx < rows.length) {
    if(showHidden || !isAutoHide(rows[idx])) { openKiroku(idx); return; }
    idx += dir;
  }
}
window.addEventListener('message', e => {
  if(e.data?.type === 'krNav') openKirokuNeighbor(e.data.idx, e.data.dir);
  if(e.data?.type === 'krSaved') reloadNitteiPage();
});

// 左パネル（品目スペック）：品名を空白無視で正規化→VFDB_SPEC引き→各セルへ。未ヒットは「—」
const _normNm = s => String(s||'').normalize('NFKC').replace(/\s+/g,'');
function fillKrSpec(nm){
  const sp = (VFDB_SPEC && VFDB_SPEC[_normNm(nm)]) || null;
  const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=(v==null||v==='')?'—':v; };
  set('k2-lsun',   sp && sp.center);
  set('k2-setdan', sp && sp.setdan);
  set('k2-toru',   sp && sp.toru);
  set('k2-ondo-k', sp && sp.ondo);
  set('k2-plus-k', sp && sp.plus);
  set('k2-minus-k',sp && sp.minus);
  set('k2-konpo-su', sp && sp.hakosu);
  set('k2-konpo-h1', sp && sp.hoho1);   // 梱包方法
  set('k2-konpo-h2', sp && sp.hoho2);   // 備考１
  set('k2-konpo-h3', sp && sp.hoho3);   // 備考２
  const sel = document.getElementById('k2-konpo-hako');   // 梱包箱はselect：箱名を1択で
  if(sel){
    sel.innerHTML = '<option value="">—</option>';
    if(sp && sp.hako){ const o=document.createElement('option'); o.value=sp.hako; o.textContent=sp.hako; o.selected=true; sel.appendChild(o); }
  }
}

function closeKiroku() {
  document.getElementById('kirokuModal').classList.remove('on');
  _kirokuIdx = null;
}

async function _fetchKiroku(meisaiNo) {
  try {
    const resp = await fetch('http://localhost:' + KAKOU_PORT + '/', {cache:'no-store'});
    if (!resp.ok) return null;
    const all = await resp.json();
    return all.find(r => String(r.meisai_no) === String(meisaiNo)) || null;
  } catch(e) { return null; }
}

function _fillKrForm(d) {
  const set = (id, v) => { const e = document.getElementById(id); if(e) e.value = (v ?? ''); };
  set('k2-nyuko-bi', d?.nyuko_bi);
  set('k2-nyuko-su', d?.nyuko_su   != null ? d.nyuko_su   : '');
  set('k2-kizai-f',  d?.kizai_furyou != null ? d.kizai_furyou : '');
  set('k2-biko',     d?.biko);
  set('k2-kakoubi',  d?.kakoubi);
  set('k2-lot2',     d?.lot2);
  set('k2-hotensuu', d?.hotensuu != null ? d.hotensuu : '');
  // 作業者4人
  const sakushas = d?.sakushas || (d?.sakusha ? [d.sakusha] : []);
  for(let i = 0; i < 4; i++) set('k2-sakusha-'+i, sakushas[i] || '');
  // 不良内訳
  const f = d?.furyou || {};
  ['kizu','kubomi','imono','kake','meyani','peko','sonota'].forEach(k => {
    const el = document.getElementById('f2-'+k);
    if(el) el.value = f[k] ? f[k] : '';
  });
  calcKrFuryou();
  // 加工Lot・箱数（5行）
  _buildLotRows(d);
  updateNyukoBi();   // 入庫日＝加工Lotの最も遅い日付
  // 作業明細（固定8行）
  const daily = d?.daily || [];
  const tbody = document.getElementById('k2-daily-body');
  tbody.innerHTML = '';
  for(let i = 0; i < KR_FIXED_ROWS; i++) _addKrRow(daily[i] || null, i);
  updateKrSummary();
  setTimeout(() => {
    const first = document.querySelector('#k2-daily-body input[data-row="0"][data-col="0"]');
    if(first) first.focus();
  }, 50);
}

function _buildLotRows(d) {
  const tbody = document.getElementById('k2-lot-body');
  if(!tbody) return;
  tbody.innerHTML = '';
  const lots = d?.lots || [];
  if(lots.length === 0 && (d?.kakou_lot || d?.hako_su))
    lots.push({lot: d.kakou_lot || '', hako: d.hako_su || ''});
  for(let i = 0; i < KR_LOT_ROWS; i++) {
    const tr = document.createElement('tr');
    const lot  = lots[i]?.lot  || '';
    const hako = (lots[i]?.hako != null && lots[i]?.hako !== 0) ? lots[i].hako : '';
    tr.innerHTML = `
      <td><input type="text" id="k2-lot-${i}"  value="${lot}"  style="width:88px"></td>
      <td><input type="text" id="k2-hako-${i}" value="${hako}"    style="width:36px"></td>
    `;
    tbody.appendChild(tr);
  }
}

const _kv = x => (x != null && x !== 0 && x !== '') ? x : '';

function _addKrRow(data, ri) {
  const tbody = document.getElementById('k2-daily-body');
  const tr = document.createElement('tr');
  if(ri === 0) {
    // 1行目：温度・換算・計測値は空白、薄暗いオレンジ背景
    tr.className = 'kr-row-special';
    tr.innerHTML = `
      <td><input type="text" value="${_kv(data?.sakugyobi)}"   data-row="0" data-col="0" style="width:58px"></td>
      <td><input type="text" value="${_kv(data?.keisoku_lot)}" data-row="0" data-col="1" style="width:96px"></td>
      <td class="ac"></td>
      <td class="ac"></td>
      <td class="ac"></td>
      <td><input type="text" value="${_kv(data?.kakou_su)}"    data-row="0" data-col="4" style="width:56px" oninput="updateKrSummary()"></td>
      <td class="ac"></td>
    `;
  } else {
    tr.innerHTML = `
      <td><input type="text" value="${_kv(data?.sakugyobi)}"   data-row="${ri}" data-col="0" style="width:58px"></td>
      <td><input type="text" value="${_kv(data?.keisoku_lot)}" data-row="${ri}" data-col="1" style="width:96px"></td>
      <td><input type="text" value="${_kv(data?.ondo)}"        data-row="${ri}" data-col="2" style="width:54px"></td>
      <td class="ac">${data?.kansan ?? ''}</td>
      <td><input type="text" value="${_kv(data?.keisoku)}"     data-row="${ri}" data-col="3" style="width:56px"></td>
      <td><input type="text" value="${_kv(data?.kakou_su)}"    data-row="${ri}" data-col="4" style="width:56px" oninput="updateKrSummary()"></td>
      <td class="ac">${data?.kizai_kans ?? ''}</td>
    `;
  }
  tbody.appendChild(tr);
}

// 基材換算：各行 加工数÷取数。2〜10行目=切り上げ、1行目・補填(11行目)=切り捨て。取数0/空は空欄。
const _kzNum = v => { const n = parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:NaN; };
function calcKizaiKans(){
  const toru = _kzNum(document.getElementById('k2-toru')?.textContent);
  let sum = 0;
  document.querySelectorAll('#k2-daily-body tr, #k2-hoten-body tr').forEach(tr => {
    const cell = tr.cells[tr.cells.length - 1];           // 基材換算＝各行の最終マス
    if(!cell) return;
    const kin = tr.querySelector('input[data-col="4"]');  // 加工数（補填行は補填数）
    const ri  = parseInt(kin?.dataset.row ?? '-1', 10);
    const kakou = _kzNum(kin?.value);
    let out = '';
    if(isFinite(kakou) && kakou > 0 && isFinite(toru) && toru > 0){
      const v = kakou / toru;
      const floor = (ri === 0 || ri === 10);              // 1行目・補填(11行目)は切り捨て、他は切り上げ
      out = floor ? Math.floor(v) : Math.ceil(v);
      sum += out;
    }
    cell.textContent = out;
  });
  const se = document.getElementById('k2-kizai-s');
  if(se) se.textContent = sum || '—';
}

function calcKrFuryou() {
  const keys = ['kizu','kubomi','imono','kake','meyani','peko','sonota'];
  const total = keys.reduce((s,k) => s + (parseInt(document.getElementById('f2-'+k)?.value||'0',10)||0), 0);
  const tel = document.getElementById('f2-total'); if(tel) tel.value = total || '';
  const sel = document.getElementById('k2-sei-s'); if(sel) sel.textContent = total || '';
}

function updateKrSummary() {
  let kakouSum = 0;
  document.querySelectorAll('#k2-daily-body tr').forEach(tr => {
    const ins = tr.querySelectorAll('input');
    kakouSum += parseInt(ins[4]?.value||'0',10)||0;
  });
  const ke = document.getElementById('k2-kakou-s'); if(ke) ke.textContent = kakouSum || '';
  calcKrFuryou();
  calcKizaiKans();
}

async function saveKiroku() {
  if(_kirokuIdx === null) return;
  const r = rows[_kirokuIdx];
  // 作業明細
  const daily = [];
  document.querySelectorAll('#k2-daily-body tr').forEach(tr => {
    const ins = tr.querySelectorAll('input');
    const sakugyobi = ins[0]?.value?.trim() || '';
    const kakou_su  = parseInt(ins[4]?.value||'0',10)||0;
    if(!sakugyobi && !kakou_su) return;
    daily.push({ sakugyobi, keisoku_lot: (ins[1]?.dataset.draft==='1') ? '' : (ins[1]?.value?.trim()||''),
      ondo: parseFloat(ins[2]?.value||'0')||0, keisoku: parseFloat(ins[3]?.value||'0')||0, kakou_su });
  });
  // 加工Lot
  const lots = [];
  for(let i = 0; i < KR_LOT_ROWS; i++) {
    const lot  = document.getElementById('k2-lot-'+i)?.value?.trim()||'';
    const hako = parseInt(document.getElementById('k2-hako-'+i)?.value||'0',10)||0;
    if(lot || hako) lots.push({lot, hako});
  }
  // 作業者4人
  const sakushas = [];
  for(let i = 0; i < 4; i++)
    sakushas.push(document.getElementById('k2-sakusha-'+i)?.value?.trim()||'');
  const iv = id => parseInt(document.getElementById(id)?.value||'0',10)||0;
  const sv = id => document.getElementById(id)?.value?.trim()||'';
  const record = {
    meisai_no: String(r.no), hinmei: r.nm, qty: r.qty, grp: r.grp||'',
    kakou_lot: lots[0]?.lot||'', hako_su: lots[0]?.hako||0, lots,
    nyuko_bi: sv('k2-nyuko-bi'), nyuko_su: iv('k2-nyuko-su'),
    kizai_furyou: iv('k2-kizai-f'), daily,
    furyou:{ kizu:iv('f2-kizu'), kubomi:iv('f2-kubomi'), imono:iv('f2-imono'),
             kake:iv('f2-kake'), meyani:iv('f2-meyani'), peko:iv('f2-peko'), sonota:iv('f2-sonota') },
    sakusha: sakushas[0]||'', sakushas,
    biko: sv('k2-biko'), kakoubi: sv('k2-kakoubi'), lot2: sv('k2-lot2'),
    hotensuu: iv('k2-hotensuu'), updated_at: new Date().toISOString(),
  };
  try {
    const resp = await fetch('http://localhost:'+KAKOU_PORT+'/', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(record)
    });
    if(resp.ok){ toast('加工記録を保存しました ✓'); closeKiroku(); }
    else toast('保存エラー: '+resp.status);
  } catch(e){ toast('保存エラー: '+e.message); }
}

// ── 並行タスク：右クリックメニュー ──
let _ctxMenu=null;
function attachContextMenu(){
  document.querySelectorAll('tr.row').forEach(tr=>{
    tr.addEventListener('contextmenu',e=>{
      e.preventDefault();
      showParallelMenu(e.clientX,e.clientY,+tr.dataset.idx);
    });
  });
}
function showParallelMenu(x,y,idx){
  closeParallelMenu();
  const r=rows[idx];
  const menu=document.createElement('div');
  menu.id='parallel-ctx-menu';
  const vw=window.innerWidth,vh=window.innerHeight;
  const left=x+160>vw?Math.max(0,vw-164):x;
  const top=y+280>vh?Math.max(0,vh-284):y;
  menu.style.left=left+'px';menu.style.top=top+'px';
  // ── 分納（最上段）──
  const bn=document.createElement('div');bn.className='ctx-bunno';bn.textContent='⑂ 分納（納品を分ける）';
  bn.addEventListener('click',()=>{ doBunno(idx); closeParallelMenu(); });
  menu.appendChild(bn);
  const bsep=document.createElement('div');bsep.className='ctx-sep';menu.appendChild(bsep);
  if(r.parallelFrom){
    const clr=document.createElement('div');clr.className='ctx-clear';clr.textContent='並行設定をクリア';
    clr.addEventListener('click',()=>{
      delete rows[idx].parallelFrom;
      buildBody();markDirty();
      toast('並行設定をクリア');
      closeParallelMenu();
    });
    menu.appendChild(clr);
    const csep=document.createElement('div');csep.className='ctx-sep';menu.appendChild(csep);
  }
  const title=document.createElement('div');
  title.className='ctx-title';title.textContent='並行開始日を設定';
  menu.appendChild(title);
  days.forEach(([mmdd,dow])=>{
    const item=document.createElement('div');
    item.className='ctx-item'+(r.parallelFrom===mmdd?' ctx-active':'');
    item.textContent=mmdd+'('+dow+')';
    item.addEventListener('click',()=>{
      rows[idx].parallelFrom=mmdd;
      buildBody();markDirty();
      toast('並行開始: '+mmdd+' に設定');
      closeParallelMenu();
    });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);_ctxMenu=menu;
  setTimeout(()=>document.addEventListener('click',closeParallelMenu,{once:true}),0);
}
function closeParallelMenu(){
  if(_ctxMenu){_ctxMenu.remove();_ctxMenu=null;}
}

// ── 分納：元行を「明細No-1」にリネームし、直下に「-2」(次番)のコピーを挿入 ──
// 枝番ありが分納のしるし。納品日/数量はユーザーが各行を後から編集する想定。
function doBunno(idx){
  const r=rows[idx];
  const base=String(r.no).replace(/-\d+$/,'');          // 枝番を除いた元No
  const esc=base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); // 正規表現用エスケープ
  const re=new RegExp('^'+esc+'-(\\d+)$');
  if(!/-\d+$/.test(String(r.no))){ r.no=base+'-1'; }    // 初回分納→元を-1化
  let maxN=0;                                            // 既存の最大枝番
  rows.forEach(x=>{const m=String(x.no).match(re);if(m)maxN=Math.max(maxN,+m[1]);});
  const copy=JSON.parse(JSON.stringify(r));
  copy.no=base+'-'+(maxN+1);                             // 次の枝番
  copy.done=0;                                           // 新しい納品分は未加工
  if(copy.parallelFrom) delete copy.parallelFrom;
  rows.splice(idx+1,0,copy);                             // 元行の直下に挿入
  buildBody();markDirty();
  toast('分納: '+r.no+' / '+copy.no+' に分割しました');
}

// キーボードナビゲーション + Esc
document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('kirokuModal');
  if(!modal?.classList.contains('on')) return;
  if(e.key === 'Escape'){ closeKiroku(); e.preventDefault(); return; }
  const el = e.target;
  const ri = parseInt(el.dataset?.row ?? '-1', 10);
  const ci = parseInt(el.dataset?.col ?? '-1', 10);
  if(ri < 0 || ci < 0) return;
  let nr = ri, nc = ci;
  if     (e.key === 'Enter'    || e.key === 'ArrowDown')                nr = Math.min(ri+1, KR_FIXED_ROWS-1);
  else if(e.key === 'ArrowUp')                                           nr = Math.max(ri-1, 0);
  else if((e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') { nc = ci+1; if(nc > KR_MAX_COL){ nc=0; nr=Math.min(ri+1,KR_FIXED_ROWS-1); } }
  else if((e.key === 'Tab' &&  e.shiftKey) || e.key === 'ArrowLeft')  { nc = ci-1; if(nc < 0){ nc=KR_MAX_COL; nr=Math.max(ri-1,0); } }
  else return;
  e.preventDefault();
  function _goCell(nr, nc, dir) {
    for(let i = 0; i <= KR_MAX_COL; i++) {
      const t = document.querySelector('#k2-daily-body input[data-row="'+nr+'"][data-col="'+nc+'"]');
      if(t){ t.focus(); t.select(); return; }
      nc += dir;
      if(nc < 0 || nc > KR_MAX_COL) return;
    }
  }
  const isRight = (e.key==='Enter'||e.key==='ArrowDown') ? false
    : ((e.key==='Tab'&&!e.shiftKey)||e.key==='ArrowRight') ? true : false;
  _goCell(nr, nc, isRight ? 1 : -1);
});
// 加工記録ページの③入庫数と進捗(done)を連動させる
async function syncDoneFromKakou(rebuild=true){
  try{
    const resp = await fetch('http://localhost:'+KAKOU_PORT+'/', {cache:'no-store'});
    if(!resp.ok) return;
    const all = await resp.json();
    let changed = false;
    all.forEach(rec=>{
      if(rec?.nyuko_su == null) return;
      const idx = rows.findIndex(r=>String(r.no)===String(rec.meisai_no));
      if(idx < 0) return;
      let n = parseInt(rec.nyuko_su, 10);
      if(isNaN(n) || n < 0) n = 0;
      if(n > rows[idx].qty) n = rows[idx].qty;
      if(rows[idx].done !== n){ rows[idx].done = n; changed = true; }
    });
    if(changed && rebuild && !activeCell) buildBody();
  }catch(e){ /* 加工記録サーバー未起動時などは静かにスキップ */ }
}
// [自動上書き撤去] フォーカス時のdone自動同期を停止（加工記録保存時のみ反映する方針）
// window.addEventListener('focus', ()=>syncDoneFromKakou());

// ── 起動時: サーバーから nittei.json を取得して rows を完全置換 ──
(async function initRows(){
  try {
    const resp = await fetch('http://localhost:8512/', {cache:'no-store'});
    if(resp.ok){
      const data = await resp.json();
      if(Array.isArray(data) && data.length > 0){
        // saveRows() は rows 全体を保存しているので、リロード時も全体を差し替える
        // （一部マージだと Streamlit 注入タイミングにより古いデータが残る場合がある）
        rows.length = 0;
        data.forEach(r => rows.push(r));
      }
    }
  } catch(e){ /* サーバー未起動時はハードコードのままフォールバック */ }
  await loadReminders();
  await loadWeekdayHl();
  await syncTokkiHighlight();
  autoAssignDenno(true);
  buildHead(); buildBody();
  syncSimUI();
})();

// ── (旧・第2<script>ブロック: ガントエリア ドラッグスクロール) ──
// ── ガントエリア ドラッグスクロール ──
(function(){
  const wrap = document.querySelector('.wrap');
  if(!wrap) return;
  let active=false, moved=false, startX, startY, scrollLeft, scrollTop;
  wrap.addEventListener('pointerdown', e=>{
    if(e.target.closest('[data-grip],.fld,.dchip,button,input,select,textarea')) return;
    if(!e.target.closest('td.cell')) return;
    active=true; moved=false;
    startX=e.clientX; startY=e.clientY;
    scrollLeft=wrap.scrollLeft; scrollTop=wrap.scrollTop;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e=>{
    if(!active) return;
    const dx=e.clientX-startX, dy=e.clientY-startY;
    if(!moved && Math.abs(dx)<5 && Math.abs(dy)<5) return;
    moved=true;
    wrap.style.cursor='grabbing';
    wrap.scrollLeft=scrollLeft-dx;
    wrap.scrollTop =scrollTop -dy;
  });
  const stop=()=>{ if(!active)return; active=false; wrap.style.cursor=''; };
  wrap.addEventListener('pointerup',   stop);
  wrap.addEventListener('pointercancel',stop);
})();