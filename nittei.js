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
  days.forEach((d,i)=>{
    h1+=`<th class="day" colspan="2">${d[0]}<small>(${d[1]})</small></th>`;
    // 1日2マス＝累計4の倍数の目盛り（getColOffsetで午前/午後/シミュ切替）
    const CO=getColOffset();
    const a=cum+CO; cum+=HRS_PER_SLOT; const b=cum+CO; cum+=HRS_PER_SLOT;
    h2+=`<th>${a}</th><th>${b}</th>`;
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
  let cumH=0; // 累計工数は常に0から（表示される「累X.Xh」の基準）
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
      const _pi=days.findIndex(d=>d[0]===r.parallelFrom);
      // parallelFrom 行も +4h/+8h シミュ連動でバーをずらす（-BAR_OFFSET 除去）
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
      <span class="fld no kiroku-trigger${noIsBunno(r)?' no-bunno':''}" onclick="openKiroku(${idx});event.stopPropagation();">${noDisplayStr(r)}</span>
      <span class="fld nm${r.nm&&r.nm.includes('PC IN')?' nm-pcin':''}"><span class="nmtxt">${r.nm}</span></span>
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
            cells+=`<td class="cell${de}" data-s="${s}"></td>`;
    }
    tr.innerHTML=cells;tb.appendChild(tr);
    const fc=tr.querySelectorAll('td.cell')[0];
    // 工程バー：累計工数から自動連結（1h = CW/4 px）。進捗100%は非表示
    if(!pct100){
      const pxPerH=CW/HRS_PER_SLOT;
      const bar=document.createElement('div');bar.className="bar";
      bar.style.left=((startH+BAR_OFFSET)*pxPerH+1)+"px";
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
      const visEndH=endH+BAR_OFFSET;        // 画面上のバー終端
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
  applyDelivFilter();
  attachColHover();
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

// ── 納品日ハイライトフィルター ──
let delivFilterDate='';
function applyDelivFilter(){
  const f=delivFilterDate.trim();
  document.querySelectorAll('tr.row').forEach(tr=>{
    const r=rows[+tr.dataset.idx];
    if(!r)return;
    tr.classList.toggle('deliv-match', !!f && r.ad===f);
  });
  const clearBtn=document.getElementById('deliv-filter-clear');
  if(clearBtn) clearBtn.style.display=f?'':'none';
}
function clearDelivFilter(){
  delivFilterDate='';
  const inp=document.getElementById('deliv-filter-input');
  if(inp) inp.value='';
  applyDelivFilter();
}
function setDelivFilterToday(){
  const t=new Date();
  const mm=String(t.getMonth()+1).padStart(2,'0');
  const dd=String(t.getDate()).padStart(2,'0');
  delivFilterDate=mm+'/'+dd;
  const inp=document.getElementById('deliv-filter-input');
  if(inp) inp.value=delivFilterDate;
  applyDelivFilter();
}
document.addEventListener('DOMContentLoaded',()=>{
  const wrapEl=document.querySelector('.wrap');
  if(wrapEl){
    wrapEl.addEventListener('pointerdown',()=>wrapEl.classList.add('no-select'));
    document.addEventListener('pointerup',()=>wrapEl.classList.remove('no-select'));
  }
  const inp=document.getElementById('deliv-filter-input');
  if(!inp)return;
  inp.addEventListener('input',e=>{
    let v=e.target.value.replace(/[^0-9/]/g,'');
    // 数字4桁→自動スラッシュ挿入（例:0612→06/12）
    if(/^\d{4}$/.test(v)) v=v.slice(0,2)+'/'+v.slice(2);
    if(v!==e.target.value) e.target.value=v;
    delivFilterDate=v;
    applyDelivFilter();
  });
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
  buildBody();markDirty();
  toast(`選択${sorted.length}行を期限${mvSortDir>0?'昇順':'降順'}でソート`);
  mvSortDir*=-1;                                                  // 次回は逆向き
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
    markDirty();
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
    if(field==='done'){ saveRows(); }
    else { markDirty(); toast('更新しました（保存ボタンで書き込み）'); }
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
// silent=true のときは buildBody/markDirty/toast を呼ばない（commitEdit から呼ぶ時用）
function autoAssignDenno(silent=false){
  // 未採番行がなければ終了
  const unassigned=rows.filter(r=>!r.denno&&r.ad);
  if(!unassigned.length){
    if(!silent)toast('未採番の行がありません');
    return;
  }

  // 月ごとの既存 denno 最大連番を集計（納品日の月を使う）
  const monthMaxSeq={}; // { 月: maxSeq }
  rows.forEach(r=>{
    if(r.denno&&r.ad){
      const m=parseInt(r.ad.split('/')[0],10);
      const prefix=m+'-';
      if(r.denno.startsWith(prefix)){
        const n=parseInt(r.denno.split('-')[1],10);
        if(!isNaN(n))monthMaxSeq[m]=Math.max(monthMaxSeq[m]||0,n);
      }
    }
  });

  // 既存の denno 使用数を納品日ごとに集計（空きスロット把握のため）
  const adDennoCount={}; // { ad: { denno: count } }
  rows.forEach(r=>{
    if(r.denno&&r.ad){
      if(!adDennoCount[r.ad])adDennoCount[r.ad]={};
      adDennoCount[r.ad][r.denno]=(adDennoCount[r.ad][r.denno]||0)+1;
    }
  });

  // 未採番行を納品日でグループ化して日付昇順に処理
  const groups={};
  unassigned.forEach(r=>{if(!groups[r.ad])groups[r.ad]=[];groups[r.ad].push(r);});
  const sortedDates=Object.keys(groups).sort((a,b)=>{
    const[am,ad]=a.split('/').map(Number);
    const[bm,bd]=b.split('/').map(Number);
    return(am*100+ad)-(bm*100+bd);
  });

  let changed=0;
  sortedDates.forEach(date=>{
    // 納品日の月を取得してその月の prefix と連番を使う
    const m=parseInt(date.split('/')[0],10);
    const prefix=m+'-';
    if(!monthMaxSeq[m])monthMaxSeq[m]=0;

    const grp=groups[date];
    const existing=adDennoCount[date]||{};

    // 同じ納品日に既存 denno があれば空きスロット（<7件）を先に使う
    const sortedExisting=Object.keys(existing).sort((a,b)=>
      parseInt(a.split('-')[1])-parseInt(b.split('-')[1])
    );
    let curDenno=null,curCount=0;
    for(const d of sortedExisting){
      if(existing[d]<7){curDenno=d;curCount=existing[d];break;}
    }

    grp.forEach(r=>{
      if(!curDenno||curCount>=7){
        monthMaxSeq[m]++;
        curDenno=prefix+monthMaxSeq[m];
        curCount=0;
        if(!adDennoCount[date])adDennoCount[date]={};
      }
      r.denno=curDenno;
      if(!adDennoCount[date])adDennoCount[date]={};
      adDennoCount[date][curDenno]=(adDennoCount[date][curDenno]||0)+1;
      curCount++;
      changed++;
    });
  });

  if(!silent){buildBody();markDirty();toast(changed+'件に伝票Noを採番しました');}
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

// ── 加工記録のbikoマップ（引取表示用）─────────────────────────────────────────
let _kakouBikoMap = new Map(); // meisai_no(string) → biko(string)
async function _loadKakouBikoMap() {
  try {
    const resp = await fetch('http://localhost:' + KAKOU_PORT + '/', { cache: 'no-store' });
    if (!resp.ok) return;
    const all = await resp.json();
    _kakouBikoMap = new Map(all.map(r => [String(r.meisai_no || ''), r.biko || '']));
  } catch(e) { /* 取得できなくてもnmにフォールバック */ }
}
_loadKakouBikoMap(); // ページ起動時に先読み

// ── モバイル閲覧用 描画データを生成 ──────────────────────────────────────────
// buildBody()と同じ計算ロジックでstartH/remainingを算出し、
// モバイル側が再計算なしにそのまま描けるデータを返す。
function computeGanttRender() {
  const BAR_OFFSET = getSimOffset();
  let cumH = 0;
  const ganttRows = [];
  const acSide = [], adSide = [];

  rows.forEach(r => {
    const pct100 = (r.qty > 0 && r.done >= r.qty);
    const remaining = pct100 ? 0 : (r.qty > 0 ? r.hours * (r.qty - r.done) / r.qty : r.hours);

    let startH, endH;
    if (r.parallelFrom) {
      const _pi = days.findIndex(d => d[0] === r.parallelFrom);
      startH = (_pi >= 0) ? (_pi * 8) : cumH;
      endH = startH + remaining;
      cumH = endH;
    } else {
      startH = cumH;
      cumH += remaining;
      endH = cumH;
    }

    // 自動非表示行はganttから除外（buildBodyと同じ挙動）
    if (!showHidden && isAutoHide(r)) return;

    ganttRows.push({
      nm:          r.nm || '',
      startH:      Math.round((startH + BAR_OFFSET) * 100) / 100,
      remaining:   Math.round(remaining * 100) / 100,
      pct:         pct(r),
      qty:         r.qty  || 0,
      done:        r.done || 0,
      ac:          r.ac  || null,
      ad:          r.ad  || null,
      af:          r.af  || null,
      parallelFrom: r.parallelFrom || null,
      color:       (r.nm || '').includes('灯具') ? 'proc1' : 'proc2',
    });

    // 配送一覧（autoHide行も含める）
    // 引取の表示名：vfdb備考 → 品名 の優先順
    if (r.ac) {
      const _vsp = VFDB_SPEC && VFDB_SPEC[_normNmP(r.nm)];
      acSide.push({ date: r.ac, ag: (_vsp && _vsp.biko) || r.nm || '' });
    }
    if (r.ad) adSide.push({ date: r.ad, d: r.nm || '', u: `${r.done}/${r.qty}` });
  });

  return {
    saved_at:    new Date().toISOString(),
    bar_offset:  BAR_OFFSET,
    hrs_per_slot: HRS_PER_SLOT,
    days:        days,
    gantt:       ganttRows,
    haiso:       { ac_side: acSide, ad_side: adSide },
  };
}

async function saveRows(){
  // 編集中セルの値を保存前に確定（blur遅延コミット待ちで入力値が消えるのを防ぐ）
  if(activeCell){ try{ commitEdit(activeCell, false); }catch(_){} }
  const btn = document.getElementById('save-btn');
  if(btn){ btn.disabled=true; btn.textContent='保存中…'; }
  try {
    await _loadKakouBikoMap(); // 保存直前にbikoを最新化
    const payload = { rows: rows, gantt_render: computeGanttRender() };
    const resp = await fetch('http://localhost:8512/', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
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
    markDirty();toast(`${cnt}件を削除しました（保存で確定）`);
  }else if(pendingDeleteIdx!==null){
    rows.splice(pendingDeleteIdx,1);
    pendingDeleteIdx=null;
    closeConfirm();
    buildBody();
    markDirty();toast('削除しました（保存で確定）');
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
  const spec = (VFDB_SPEC && VFDB_SPEC[_normNmP(r.nm)]) || null;
  // meta は必要なフィールドだけ渡す（URL 長さ節約）
  // 直前タスクのNoを渡す（準備時間算出に使用）
  let prevNo = null;
  for(let pi = idx - 1; pi >= 0; pi--) {
    if(showHidden || !isAutoHide(rows[pi])) { prevNo = rows[pi].no; break; }
  }
  const meta = {no: r.no, nm: r.nm, qty: r.qty, grp: r.grp||'', ad: adToYYMMDD(r.ad), idx: idx, prevNo};
  const params = new URLSearchParams({
    meta: JSON.stringify(meta),
    spec: JSON.stringify(spec)
  });
  const url = 'http://localhost:' + KAKOU_PORT + '/ui?' + params.toString();

  if(_kirokuWin && !_kirokuWin.closed) {
    _kirokuWin.location.href = url;
    _kirokuWin.focus();
    return;
  }
  _kirokuWin = window.open(url, 'kirokuWin', 'width=1240,height=820,resizable=yes');
  if(!_kirokuWin){ toast('ポップアップがブロックされました。ブラウザの設定をご確認ください。'); return; }
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
  if(r.parallelFrom){
    const sep=document.createElement('div');sep.className='ctx-sep';menu.appendChild(sep);
    const clr=document.createElement('div');clr.className='ctx-clear';clr.textContent='並行設定をクリア';
    clr.addEventListener('click',()=>{
      delete rows[idx].parallelFrom;
      buildBody();markDirty();
      toast('並行設定をクリア');
      closeParallelMenu();
    });
    menu.appendChild(clr);
  }
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
    const all = await resp.json