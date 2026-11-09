/**
 * Mandi2Door backend on Google Sheets (free).
 * Setup: see ../README.md. In short:
 *  1. Create a Google Sheet, open Extensions > Apps Script, paste this file.
 *  2. Project Settings > Script properties: add ADMIN_KEY = a long secret only you know.
 *  3. Run setup() once (creates the tabs and all 33 products with sample prices).
 *  4. Deploy > New deployment > Web app: Execute as "Me", Access "Anyone". Copy the URL into config.js.
 */

const PRODUCT_COLS = ["id", "cat", "emoji", "en", "mr", "hi", "unit", "price", "cost", "blinkit", "instamart", "zepto", "local", "active"];
const ORDER_COLS = ["id", "createdAt", "deliveryDate", "name", "phone", "wing", "flat", "note", "itemsText", "items", "subtotal", "fee", "total", "savings", "payment", "status"];
const SUB_COLS = ["id", "createdAt", "phone", "name", "wing", "flat", "productId", "qty", "freq", "days", "start", "status", "pauseUntil"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const req = JSON.parse(e.postData.contents);
    return json(route(req));
  } catch (err) {
    return json({ error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}
function doGet() { return json(route({ action: "products" })); }

function route(req) {
  const a = req.action;
  if (a === "products") return { products: readAll("Products").filter(p => p.id), pricesUpdated: prop("PRICES_UPDATED") || today() };
  if (a === "placeOrder") return placeOrder(req.order);
  if (a === "myOrders") return { orders: readAll("Orders").filter(o => String(o.phone) === String(req.phone) && String(o.flat) === String(req.flat)).map(fixOrder).reverse().slice(0, 30) };
  if (a === "mySubs") return { subs: readAll("Subscriptions").filter(s => String(s.phone) === String(req.phone) && String(s.flat) === String(req.flat) && s.status !== "cancelled").map(fixSub) };
  if (a === "saveSub") return saveSub(req.sub);

  // Everything below needs the admin key.
  if (!req.key || req.key !== prop("ADMIN_KEY")) throw new Error("Unauthorized");
  if (a === "adminPing") return { ok: true };
  if (a === "adminOrders") return { orders: readAll("Orders").filter(o => fmtDate(o.deliveryDate) === req.date).map(fixOrder) };
  if (a === "adminSubs") return { subs: readAll("Subscriptions").map(fixSub) };
  if (a === "adminUpdateOrder") return updateRow("Orders", ORDER_COLS, req.id, req.fields);
  if (a === "adminSaveProducts") {
    writeAll("Products", PRODUCT_COLS, req.products);
    PropertiesService.getScriptProperties().setProperty("PRICES_UPDATED", today());
    return { ok: true };
  }
  throw new Error("Unknown action");
}

function placeOrder(o) {
  // Re-price on the server so nobody can change prices in their browser.
  const prices = {};
  readAll("Products").forEach(p => prices[p.id] = p);
  let subtotal = 0, savings = 0;
  const items = (o.items || []).map(i => {
    const p = prices[i.id];
    if (!p || p.active === false || String(p.active).toUpperCase() === "FALSE") throw new Error("Item unavailable: " + i.id);
    const qty = Math.max(1, Math.min(50, Math.floor(Number(i.qty))));
    const others = ["blinkit", "instamart", "zepto", "local"].map(k => Number(p[k])).filter(v => v > 0);
    const save = Math.max(0, (others.length ? Math.min.apply(null, others) : Number(p.price)) - Number(p.price));
    subtotal += Number(p.price) * qty; savings += save * qty;
    return { id: p.id, name: p.en, unit: p.unit, qty, price: Number(p.price), cost: Number(p.cost), save };
  });
  if (!items.length) throw new Error("Empty order");
  const phone = String(o.phone || "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) throw new Error("Invalid phone");
  const freeAbove = Number(prop("FREE_DELIVERY_ABOVE") || 149), feeAmt = Number(prop("DELIVERY_FEE") || 15);
  const fee = subtotal >= freeAbove ? 0 : feeAmt;
  const row = {
    id: o.id, createdAt: new Date().toISOString(), deliveryDate: o.deliveryDate, name: clean(o.name), phone, wing: clean(o.wing), flat: clean(o.flat),
    note: clean(o.note), itemsText: items.map(i => `${i.name} ${i.unit} x${i.qty}`).join(", "), items: JSON.stringify(items),
    subtotal, fee, total: subtotal + fee, savings, payment: "pending", status: "placed",
  };
  sheet("Orders").appendRow(ORDER_COLS.map(c => row[c]));
  return { ok: true, id: row.id, total: row.total };
}

function saveSub(s) {
  const phone = String(s.phone || "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) throw new Error("Invalid phone");
  const existing = readAll("Subscriptions").find(x => x.id === s.id);
  if (existing && String(existing.phone) !== phone) throw new Error("Not allowed");
  const row = {
    id: s.id, createdAt: s.createdAt || new Date().toISOString(), phone, name: clean(s.name), wing: clean(s.wing), flat: clean(s.flat),
    productId: s.productId, qty: Math.max(1, Math.min(10, Number(s.qty) || 1)), freq: s.freq, days: String(s.days || ""),
    start: s.start, status: ["active", "paused", "cancelled"].indexOf(s.status) >= 0 ? s.status : "active", pauseUntil: s.pauseUntil || "",
  };
  if (existing) return updateRow("Subscriptions", SUB_COLS, s.id, row);
  sheet("Subscriptions").appendRow(SUB_COLS.map(c => row[c]));
  return { ok: true };
}

// ---------- helpers ----------
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function prop(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function sheet(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function tz() { return SpreadsheetApp.getActive().getSpreadsheetTimeZone() || "Asia/Kolkata"; }
function today() { return Utilities.formatDate(new Date(), tz(), "yyyy-MM-dd"); }
function fmtDate(v) { return v instanceof Date ? Utilities.formatDate(v, tz(), "yyyy-MM-dd") : String(v || ""); }
function clean(s) { return String(s || "").replace(/^[=+\-@]/, "'").slice(0, 120); } // blocks spreadsheet formula injection

function readAll(name) {
  const v = sheet(name).getDataRange().getValues();
  const h = v.shift();
  return v.map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
}
function writeAll(name, cols, list) {
  const sh = sheet(name);
  sh.clearContents();
  const rows = [cols].concat(list.map(o => cols.map(c => c === "active" ? o[c] !== false : (typeof o[c] === "string" ? clean(o[c]) : o[c]))));
  sh.getRange(1, 1, rows.length, cols.length).setValues(rows);
}
function updateRow(name, cols, id, fields) {
  const sh = sheet(name), ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let r = 1; r < ids.length; r++) {
    if (ids[r][0] === id) {
      Object.keys(fields).forEach(k => { const c = cols.indexOf(k); if (c > 0) sh.getRange(r + 1, c + 1).setValue(fields[k]); });
      return { ok: true };
    }
  }
  throw new Error("Not found");
}
function fixOrder(o) {
  o.deliveryDate = fmtDate(o.deliveryDate); o.phone = String(o.phone);
  try { o.items = JSON.parse(o.items); } catch (e) { o.items = []; }
  ["subtotal", "fee", "total", "savings"].forEach(k => o[k] = Number(o[k]) || 0);
  o.wing = String(o.wing); o.flat = String(o.flat);
  return o;
}
function fixSub(s) {
  s.start = fmtDate(s.start); s.pauseUntil = fmtDate(s.pauseUntil); s.phone = String(s.phone);
  s.qty = Number(s.qty) || 1; s.days = String(s.days); s.wing = String(s.wing); s.flat = String(s.flat);
  return s;
}

/** Run once from the editor to create tabs and sample prices. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  [["Products", PRODUCT_COLS], ["Orders", ORDER_COLS], ["Subscriptions", SUB_COLS]].forEach(([n, cols]) => {
    const sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getLastRow() === 0) sh.appendRow(cols);
    sh.setFrozenRows(1);
  });
  // Keep dates, phones, flats and day lists as plain text.
  ["B:C", "E:G"].forEach(r => ss.getSheetByName("Orders").getRange(r).setNumberFormat("@"));
  ["B:C", "E:F", "J:M"].forEach(r => ss.getSheetByName("Subscriptions").getRange(r).setNumberFormat("@"));
  if (sheet("Products").getLastRow() < 2) {
    const sample = [
      ["onion","veg","🧅","Onion","कांदा","प्याज","1 kg",32,24,45,44,43,40,true],
      ["potato","veg","🥔","Potato","बटाटा","आलू","1 kg",30,22,42,40,39,36,true],
      ["tomato","veg","🍅","Tomato","टोमॅटो","टमाटर","1 kg",36,26,52,50,49,45,true],
      ["chilli","veg","🌶️","Green Chilli","हिरवी मिरची","हरी मिर्च","100 g",8,5,14,13,12,10,true],
      ["coriander","veg","🌿","Coriander","कोथिंबीर","धनिया","1 bunch",10,6,18,17,16,15,true],
      ["ginger","veg","🫚","Ginger","आलं","अदरक","100 g",12,8,20,19,18,15,true],
      ["garlic","veg","🧄","Garlic","लसूण","लहसुन","100 g",18,13,30,28,27,25,true],
      ["lemon","veg","🍋","Lemon","लिंबू","नींबू","4 pcs",14,9,24,22,21,20,true],
      ["cauliflower","veg","🥦","Cauliflower","फ्लॉवर","फूलगोभी","1 pc",30,20,45,42,40,40,true],
      ["cabbage","veg","🥬","Cabbage","कोबी","पत्तागोभी","1 pc",25,16,38,36,35,30,true],
      ["brinjal","veg","🍆","Brinjal","वांगी","बैंगन","500 g",25,17,38,36,35,30,true],
      ["bhindi","veg","🫛","Lady Finger","भेंडी","भिंडी","500 g",30,21,45,44,42,40,true],
      ["capsicum","veg","🫑","Capsicum","ढोबळी मिरची","शिमला मिर्च","250 g",20,14,32,30,29,25,true],
      ["carrot","veg","🥕","Carrot","गाजर","गाजर","500 g",25,17,38,36,35,30,true],
      ["cucumber","veg","🥒","Cucumber","काकडी","खीरा","500 g",20,13,30,29,28,25,true],
      ["palak","veg","🥬","Spinach","पालक","पालक","1 bunch",15,9,25,24,23,20,true],
      ["methi","veg","🌱","Methi","मेथी","मेथी","1 bunch",15,9,25,24,22,20,true],
      ["dudhi","veg","🥒","Bottle Gourd","दुधी भोपळा","लौकी","1 pc",25,16,40,38,36,30,true],
      ["beans","veg","🫘","French Beans","फरसबी","फ्रेंच बीन्स","250 g",22,15,35,33,32,28,true],
      ["banana","fruit","🍌","Banana","केळी","केला","1 dozen",48,36,68,65,62,60,true],
      ["apple","fruit","🍎","Apple (Shimla)","सफरचंद","सेब","1 kg",140,110,200,190,185,180,true],
      ["pomegranate","fruit","🔴","Pomegranate","डाळिंब","अनार","500 g",80,62,120,115,110,100,true],
      ["papaya","fruit","🥭","Papaya","पपई","पपीता","1 pc",45,32,70,65,62,60,true],
      ["orange","fruit","🍊","Orange (Nagpur)","संत्री","संतरा","1 kg",70,52,110,105,99,90,true],
      ["guava","fruit","🍐","Guava","पेरू","अमरूद","500 g",40,29,60,58,55,50,true],
      ["chikoo","fruit","🟤","Chikoo","चिकू","चीकू","500 g",45,33,70,66,64,60,true],
      ["cowmilk","dairy","🥛","Cow Milk","गाईचे दूध","गाय का दूध","500 ml",28,25.5,30,30,30,30,true],
      ["bufmilk","dairy","🥛","Buffalo Milk","म्हशीचे दूध","भैंस का दूध","500 ml",36,33,38,38,38,38,true],
      ["curd","dairy","🥣","Curd","दही","दही","400 g",38,32,45,45,44,42,true],
      ["paneer","dairy","🧀","Paneer","पनीर","पनीर","200 g",80,65,100,98,95,90,true],
      ["eggs6","eggs","🥚","Eggs","अंडी","अंडे","6 pcs",42,34,54,52,51,48,true],
      ["eggs12","eggs","🥚","Eggs","अंडी","अंडे","12 pcs",80,66,104,100,98,90,true],
      ["eggs30","eggs","🥚","Eggs Tray","अंड्यांचा ट्रे","अंडे ट्रे","30 pcs",190,160,255,245,240,220,true],
    ];
    sheet("Products").getRange(2, 1, sample.length, PRODUCT_COLS.length).setValues(sample);
  }
  PropertiesService.getScriptProperties().setProperty("PRICES_UPDATED", today());
}
