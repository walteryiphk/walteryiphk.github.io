
// ===== Fuel Discount Calculator PWA =====
// Formulas reverse-engineered from Caltex energy-card discount worksheet:
//   Paid          = V * (P + D) / P            // D is entered as a NEGATIVE number
//   LitersV       = V / P
//   LitersTotal   = (V + Bonus) / P
//   EffectivePrice= Paid / LitersTotal
//   ActualDiscount= EffectivePrice - P
//   CostPerKm     = EffectivePrice / (km per litre)

const ids = ['p1','p2','d1','d2','v1','v2','b1','b2'];
const els = {};
ids.forEach(id => els[id] = document.getElementById(id));

const outIds = ['paid1','paid2','eff1','eff2','disc1','disc2','litersV1','litersV2','litersT1','litersT2'];
const outs = {};
outIds.forEach(id => outs[id] = document.getElementById(id));

const kmList = [10,12,14,16,18,20];
const tbody = document.querySelector('#kmTable tbody');
kmList.forEach(km => {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${km}</td><td id="km-${km}-1">-</td><td id="km-${km}-2">-</td>`;
  tbody.appendChild(tr);
});

function calcOne(P, D, V, B) {
  P = Number(P); D = Number(D); V = Number(V); B = Number(B);
  if (!P) return null;
  const paid = V * (P + D) / P;
  const litersV = V / P;
  const litersT = (V + B) / P;
  const eff = litersT ? paid / litersT : 0;
  const disc = eff - P;
  return { paid, litersV, litersT, eff, disc };
}

function fmt(n, dp = 2) {
  return Number.isFinite(n) ? n.toFixed(dp) : '-';
}

function recalc() {
  const r1 = calcOne(els.p1.value, els.d1.value, els.v1.value, els.b1.value);
  const r2 = calcOne(els.p2.value, els.d2.value, els.v2.value, els.b2.value);

  if (r1) {
    outs.paid1.textContent = fmt(r1.paid);
    outs.eff1.textContent = fmt(r1.eff);
    outs.disc1.textContent = fmt(r1.disc);
    outs.litersV1.textContent = fmt(r1.litersV, 3);
    outs.litersT1.textContent = fmt(r1.litersT, 3);
  }
  if (r2) {
    outs.paid2.textContent = fmt(r2.paid);
    outs.eff2.textContent = fmt(r2.eff);
    outs.disc2.textContent = fmt(r2.disc);
    outs.litersV2.textContent = fmt(r2.litersV, 3);
    outs.litersT2.textContent = fmt(r2.litersT, 3);
  }

  kmList.forEach(km => {
    document.getElementById(`km-${km}-1`).textContent = r1 ? fmt(r1.eff / km) : '-';
    document.getElementById(`km-${km}-2`).textContent = r2 ? fmt(r2.eff / km) : '-';
  });
}

ids.forEach(id => els[id].addEventListener('input', recalc));
recalc();

// ---- Auto-fetch government pump price (Consumer Council open data) & from https://hkg-deadline.github.io Kudos! ----
const GOV_API = 'https://walteryiphk.github.io/Caltex-Discount-Calculator/json/cc-oilprice.json';
const statusEl = document.getElementById('status');
const VENDOR_KEYWORDS = ['加德士', 'caltex', 'Caltex'];

async function fetchGovPrice() {
  statusEl.className = 'status';
  statusEl.textContent = '讀取中...';
  try {
    const resp = await fetch(GOV_API, { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    // Data shape: [{ type: {en, "zh-Hant", "zh-Hans"}, prices: [{ vendor: {...}, price: number }, ...] }, ...]
    let found = null;
    let foundType = '';
    for (const entry of data) {
      const typeName = entry.type ? (entry.type['zh-Hant'] || entry.type.en || '') : '';
      if (!entry.prices) continue;
      const match = entry.prices.find(p => {
        const vendorName = p.vendor ? (p.vendor['zh-Hant'] || p.vendor.en || '') : '';
        return VENDOR_KEYWORDS.some(k => vendorName.includes(k));
      });
      if (match) {
        // Prefer petrol (汽油) entries over diesel for the "平油/貴油" fields
        if (typeName.includes('汽油') || !found) {
          found = match;
          foundType = typeName;
        }
      }
    }

    if (found && found.price) {
      els.p1.value = Number(found.price).toFixed(2);
      els.p2.value = (Number(found.price) + (Number(els.p2.value) - Number(els.p1.value) || 1.8)).toFixed(2);
      // simpler: just mirror same price into p2 too, user can adjust
      els.p2.value = Number(found.price).toFixed(2);
      recalc();
      statusEl.className = 'status ok';
      statusEl.textContent = `已讀取加德士 ${foundType} 牌價：$${Number(found.price).toFixed(2)}/L（貴油欄請自行調整加幅）`;
    } else {
      throw new Error('搵唔到加德士牌價資料');
    }
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = '自動讀取失敗（可能因為 CORS 限制或離線）。請手動輸入牌價。錯誤：' + err.message;
  }
}

document.getElementById('fetchBtn').addEventListener('click', fetchGovPrice);

// ---- Register service worker for offline / PWA install ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // init price
    fetchGovPrice();
  });
}
