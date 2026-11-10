/* Mandi2Door shared code: catalog, translations, data layer, helpers. */
(function () {
  const C = window.M2D_CONFIG;

  // Sample prices (₹). Replace daily from the admin screen or the Google Sheet.
  // cost = what you pay at APMC/wholesale; others = comparison prices.
  const P = (id, cat, emoji, en, mr, hi, unit, price, cost, blinkit, instamart, zepto, local) =>
    ({ id, cat, emoji, en, mr, hi, unit, price, cost, blinkit, instamart, zepto, local, active: true });

  const DEFAULT_PRODUCTS = [
    P("onion", "veg", "🧅", "Onion", "कांदा", "प्याज", "1 kg", 32, 24, 45, 44, 43, 40),
    P("potato", "veg", "🥔", "Potato", "बटाटा", "आलू", "1 kg", 30, 22, 42, 40, 39, 36),
    P("tomato", "veg", "🍅", "Tomato", "टोमॅटो", "टमाटर", "1 kg", 36, 26, 52, 50, 49, 45),
    P("chilli", "veg", "🌶️", "Green Chilli", "हिरवी मिरची", "हरी मिर्च", "100 g", 8, 5, 14, 13, 12, 10),
    P("coriander", "veg", "🌿", "Coriander", "कोथिंबीर", "धनिया", "1 bunch", 10, 6, 18, 17, 16, 15),
    P("ginger", "veg", "🫚", "Ginger", "आलं", "अदरक", "100 g", 12, 8, 20, 19, 18, 15),
    P("garlic", "veg", "🧄", "Garlic", "लसूण", "लहसुन", "100 g", 18, 13, 30, 28, 27, 25),
    P("lemon", "veg", "🍋", "Lemon", "लिंबू", "नींबू", "4 pcs", 14, 9, 24, 22, 21, 20),
    P("cauliflower", "veg", "🥦", "Cauliflower", "फ्लॉवर", "फूलगोभी", "1 pc", 30, 20, 45, 42, 40, 40),
    P("cabbage", "veg", "🥬", "Cabbage", "कोबी", "पत्तागोभी", "1 pc", 25, 16, 38, 36, 35, 30),
    P("brinjal", "veg", "🍆", "Brinjal", "वांगी", "बैंगन", "500 g", 25, 17, 38, 36, 35, 30),
    P("bhindi", "veg", "🫛", "Lady Finger", "भेंडी", "भिंडी", "500 g", 30, 21, 45, 44, 42, 40),
    P("capsicum", "veg", "🫑", "Capsicum", "ढोबळी मिरची", "शिमला मिर्च", "250 g", 20, 14, 32, 30, 29, 25),
    P("carrot", "veg", "🥕", "Carrot", "गाजर", "गाजर", "500 g", 25, 17, 38, 36, 35, 30),
    P("cucumber", "veg", "🥒", "Cucumber", "काकडी", "खीरा", "500 g", 20, 13, 30, 29, 28, 25),
    P("palak", "veg", "🥬", "Spinach", "पालक", "पालक", "1 bunch", 15, 9, 25, 24, 23, 20),
    P("methi", "veg", "🌱", "Methi", "मेथी", "मेथी", "1 bunch", 15, 9, 25, 24, 22, 20),
    P("dudhi", "veg", "🥒", "Bottle Gourd", "दुधी भोपळा", "लौकी", "1 pc", 25, 16, 40, 38, 36, 30),
    P("beans", "veg", "🫘", "French Beans", "फरसबी", "फ्रेंच बीन्स", "250 g", 22, 15, 35, 33, 32, 28),
    P("banana", "fruit", "🍌", "Banana", "केळी", "केला", "1 dozen", 48, 36, 68, 65, 62, 60),
    P("apple", "fruit", "🍎", "Apple (Shimla)", "सफरचंद", "सेब", "1 kg", 140, 110, 200, 190, 185, 180),
    P("pomegranate", "fruit", "🔴", "Pomegranate", "डाळिंब", "अनार", "500 g", 80, 62, 120, 115, 110, 100),
    P("papaya", "fruit", "🥭", "Papaya", "पपई", "पपीता", "1 pc", 45, 32, 70, 65, 62, 60),
    P("orange", "fruit", "🍊", "Orange (Nagpur)", "संत्री", "संतरा", "1 kg", 70, 52, 110, 105, 99, 90),
    P("guava", "fruit", "🍐", "Guava", "पेरू", "अमरूद", "500 g", 40, 29, 60, 58, 55, 50),
    P("chikoo", "fruit", "🟤", "Chikoo", "चिकू", "चीकू", "500 g", 45, 33, 70, 66, 64, 60),
    P("cowmilk", "dairy", "🥛", "Cow Milk", "गाईचे दूध", "गाय का दूध", "500 ml", 28, 25.5, 30, 30, 30, 30),
    P("bufmilk", "dairy", "🥛", "Buffalo Milk", "म्हशीचे दूध", "भैंस का दूध", "500 ml", 36, 33, 38, 38, 38, 38),
    P("curd", "dairy", "🥣", "Curd", "दही", "दही", "400 g", 38, 32, 45, 45, 44, 42),
    P("paneer", "dairy", "🧀", "Paneer", "पनीर", "पनीर", "200 g", 80, 65, 100, 98, 95, 90),
    P("eggs6", "eggs", "🥚", "Eggs", "अंडी", "अंडे", "6 pcs", 42, 34, 54, 52, 51, 48),
    P("eggs12", "eggs", "🥚", "Eggs", "अंडी", "अंडे", "12 pcs", 80, 66, 104, 100, 98, 90),
    P("eggs30", "eggs", "🥚", "Eggs Tray", "अंड्यांचा ट्रे", "अंडे ट्रे", "30 pcs", 190, 160, 255, 245, 240, 220),
  ];

  const T = {
    en: {
      tagline: "APMC-fresh to your door · Order by 10 PM", shop: "Shop", subs: "Daily Milk", orders: "My Orders", cart: "Cart",
      veg: "Vegetables", fruit: "Fruits", dairy: "Milk & Dairy", eggs: "Eggs", all: "All",
      add: "Add", save: "Save", cheapestElse: "cheapest elsewhere", youSave: "You save", onThisOrder: "on this order",
      cutoffIn: "Order closes in", deliveryOn: "Delivery", subtotal: "Items total", delivery: "Delivery", free: "FREE",
      total: "To pay", placeOrder: "Place order · Pay on delivery", empty: "Your cart is empty",
      addMore: "Add ₹{n} more for free delivery", yourDetails: "Your details", name: "Name", phone: "Mobile number",
      wing: "Building / Wing", flat: "Flat no.", note: "Note for delivery (optional)", continue: "Continue",
      placed: "Order placed!", placedMsg: "We'll deliver {date}, {slot}. Pay by UPI when it arrives.",
      payUpi: "Pay now by UPI", shareWa: "Send copy on WhatsApp", done: "Done", noOrders: "No orders yet",
      totalSaved: "Total saved with Mandi2Door", subTitle: "Milk & eggs subscription",
      subHelp: "Set once, delivered every morning. Pause anytime.", product: "Item", qty: "Qty", freq: "Days",
      daily: "Daily", alt: "Alternate days", custom: "Pick days", startSub: "Start subscription", pause: "Pause",
      resume: "Resume", cancel: "Cancel", active: "Active", paused: "Paused", noSubs: "No subscriptions yet",
      search: "Search tomato, milk, eggs…", demo: "Demo mode: data is saved on this phone only.",
      pricesNote: "Comparison prices checked {date}. Savings shown against the cheapest other app/vendor.",
      status: "Status", perDay: "/delivery", edit: "Edit", lang: "भाषा",
      privacy: "We count visits anonymously to improve Mandi2Door. No name or phone is shared.",
    },
    mr: {
      tagline: "APMC मधून ताजं थेट घरी · रात्री १० पर्यंत ऑर्डर", shop: "खरेदी", subs: "रोजचं दूध", orders: "माझ्या ऑर्डर", cart: "कार्ट",
      veg: "भाज्या", fruit: "फळे", dairy: "दूध व डेअरी", eggs: "अंडी", all: "सर्व",
      add: "घ्या", save: "बचत", cheapestElse: "इतरत्र सर्वात स्वस्त", youSave: "तुमची बचत", onThisOrder: "या ऑर्डरवर",
      cutoffIn: "ऑर्डर बंद होईल", deliveryOn: "डिलिव्हरी", subtotal: "एकूण", delivery: "डिलिव्हरी", free: "मोफत",
      total: "भरायचे", placeOrder: "ऑर्डर करा · डिलिव्हरीला पैसे द्या", empty: "कार्ट रिकामे आहे",
      addMore: "मोफत डिलिव्हरीसाठी ₹{n} ची खरेदी वाढवा", yourDetails: "तुमची माहिती", name: "नाव", phone: "मोबाईल नंबर",
      wing: "बिल्डिंग / विंग", flat: "फ्लॅट नं.", note: "डिलिव्हरीसाठी सूचना (ऐच्छिक)", continue: "पुढे",
      placed: "ऑर्डर झाली!", placedMsg: "{date}, {slot} डिलिव्हरी. सामान आल्यावर UPI ने पैसे द्या.",
      payUpi: "UPI ने पैसे द्या", shareWa: "WhatsApp वर कॉपी पाठवा", done: "ठीक", noOrders: "अजून ऑर्डर नाही",
      totalSaved: "Mandi2Door मुळे एकूण बचत", subTitle: "दूध व अंडी सबस्क्रिप्शन",
      subHelp: "एकदा सेट करा, रोज सकाळी घरी. कधीही थांबवा.", product: "वस्तू", qty: "संख्या", freq: "दिवस",
      daily: "रोज", alt: "एक दिवसाआड", custom: "दिवस निवडा", startSub: "सुरू करा", pause: "थांबवा",
      resume: "पुन्हा सुरू", cancel: "रद्द", active: "चालू", paused: "थांबवले", noSubs: "सबस्क्रिप्शन नाही",
      search: "टोमॅटो, दूध, अंडी शोधा…", demo: "डेमो: माहिती फक्त या फोनवर साठवली जाते.",
      pricesNote: "तुलनात्मक किंमती {date} रोजी तपासल्या. बचत इतर ॲप/विक्रेत्यांच्या सर्वात स्वस्त किमतीशी.",
      status: "स्थिती", perDay: "/डिलिव्हरी", edit: "बदला", lang: "Language",
      privacy: "सेवा सुधारण्यासाठी आम्ही भेटींची निनावी नोंद ठेवतो. नाव किंवा फोन शेअर होत नाही.",
    },
    hi: {
      tagline: "APMC से ताज़ा सीधे घर · रात 10 बजे तक ऑर्डर", shop: "खरीदें", subs: "रोज़ दूध", orders: "मेरे ऑर्डर", cart: "कार्ट",
      veg: "सब्ज़ियाँ", fruit: "फल", dairy: "दूध व डेयरी", eggs: "अंडे", all: "सभी",
      add: "जोड़ें", save: "बचत", cheapestElse: "बाहर सबसे सस्ता", youSave: "आपकी बचत", onThisOrder: "इस ऑर्डर पर",
      cutoffIn: "ऑर्डर बंद होगा", deliveryOn: "डिलीवरी", subtotal: "कुल सामान", delivery: "डिलीवरी", free: "मुफ़्त",
      total: "देना है", placeOrder: "ऑर्डर करें · डिलीवरी पर भुगतान", empty: "कार्ट खाली है",
      addMore: "मुफ़्त डिलीवरी के लिए ₹{n} और जोड़ें", yourDetails: "आपकी जानकारी", name: "नाम", phone: "मोबाइल नंबर",
      wing: "बिल्डिंग / विंग", flat: "फ्लैट नं.", note: "डिलीवरी के लिए नोट (वैकल्पिक)", continue: "आगे",
      placed: "ऑर्डर हो गया!", placedMsg: "{date}, {slot} डिलीवरी. सामान आने पर UPI से भुगतान करें.",
      payUpi: "UPI से भुगतान करें", shareWa: "WhatsApp पर कॉपी भेजें", done: "ठीक है", noOrders: "अभी कोई ऑर्डर नहीं",
      totalSaved: "Mandi2Door से कुल बचत", subTitle: "दूध व अंडे सब्सक्रिप्शन",
      subHelp: "एक बार सेट करें, हर सुबह घर पर. कभी भी रोकें.", product: "सामान", qty: "मात्रा", freq: "दिन",
      daily: "रोज़", alt: "एक दिन छोड़कर", custom: "दिन चुनें", startSub: "शुरू करें", pause: "रोकें",
      resume: "फिर शुरू", cancel: "रद्द", active: "चालू", paused: "रुका हुआ", noSubs: "कोई सब्सक्रिप्शन नहीं",
      search: "टमाटर, दूध, अंडे खोजें…", demo: "डेमो: जानकारी सिर्फ़ इसी फ़ोन में सेव है.",
      pricesNote: "तुलना की कीमतें {date} को जाँची गईं. बचत बाकी ऐप/विक्रेताओं की सबसे सस्ती कीमत से.",
      status: "स्थिति", perDay: "/डिलीवरी", edit: "बदलें", lang: "Language",
      privacy: "सेवा बेहतर बनाने के लिए हम विज़िट की गुमनाम गिनती करते हैं. नाम या फ़ोन साझा नहीं होता.",
    },
  };

  // ---------- helpers ----------
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const rupee = (n) => (n < 0 ? "−₹" : "₹") + (Math.round(Math.abs(n) * 100) / 100).toLocaleString("en-IN");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const COMPARE = ["blinkit", "instamart", "zepto", "local"];
  const COMPARE_LABEL = { blinkit: "Blinkit", instamart: "Instamart", zepto: "Zepto", local: "Local vendor" };

  function cheapestElsewhere(p) {
    const vals = COMPARE.map((k) => Number(p[k])).filter((v) => v > 0);
    return vals.length ? Math.min(...vals) : Number(p.price);
  }
  function saving(p) { return Math.max(0, cheapestElsewhere(p) - Number(p.price)); }

  // Next delivery date: before cutoff -> tomorrow, after -> day after tomorrow.
  function nextDeliveryDate(now = new Date()) {
    const base = ymd(now);
    return now.getHours() < C.CUTOFF_HOUR ? addDays(base, 1) : addDays(base, 2);
  }
  function cutoffMoment(now = new Date()) {
    const d = new Date(now); d.setHours(C.CUTOFF_HOUR, 0, 0, 0);
    if (now >= d) d.setDate(d.getDate() + 1);
    return d;
  }
  function deliveryFee(subtotal) { return subtotal === 0 || subtotal >= C.FREE_DELIVERY_ABOVE ? 0 : C.DELIVERY_FEE; }

  // Does a subscription deliver on a given date?
  function subOn(sub, date) {
    if (sub.status !== "active") return false;
    if (date < sub.start) return false;
    if (sub.pauseUntil && date <= sub.pauseUntil) return false;
    if (sub.freq === "daily") return true;
    if (sub.freq === "alt") {
      const diff = Math.round((parseYmd(date) - parseYmd(sub.start)) / 86400000);
      return diff % 2 === 0;
    }
    const days = String(sub.days || "").split(",").map(Number);
    return days.includes(parseYmd(date).getDay());
  }

  function upiLink(amount, note) {
    const q = new URLSearchParams({ pa: C.UPI_ID, pn: C.UPI_NAME, am: Number(amount).toFixed(2), cu: "INR", tn: note });
    return "upi://pay?" + q.toString();
  }
  function waLink(text, number = C.WHATSAPP) { return `https://wa.me/${number}?text=${encodeURIComponent(text)}`; }
  const uid = (prefix) => prefix + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase();

  // ---------- data layer ----------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("m2d_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("m2d_" + k, JSON.stringify(v)); } catch (e) {} },
  };

  const Local = {
    async products() {
      return { products: LS.get("products", DEFAULT_PRODUCTS), pricesUpdated: LS.get("pricesUpdated", ymd(new Date())) };
    },
    async placeOrder(o) { const all = LS.get("orders", []); all.push(o); LS.set("orders", all); return { ok: true, id: o.id }; },
    async myOrders(phone) { return LS.get("orders", []).filter((o) => o.phone === phone).reverse(); },
    async mySubs(phone) { return LS.get("subs", []).filter((s) => s.phone === phone && s.status !== "cancelled"); },
    async saveSub(s) {
      const all = LS.get("subs", []); const i = all.findIndex((x) => x.id === s.id);
      if (i >= 0) all[i] = s; else all.push(s); LS.set("subs", all); return { ok: true };
    },
    admin: {
      async login(key) { return key === C.DEMO_ADMIN_PIN ? true : "Wrong PIN. Demo PIN is " + C.DEMO_ADMIN_PIN; },
      async orders(key, date) { return LS.get("orders", []).filter((o) => o.deliveryDate === date); },
      async subs() { return LS.get("subs", []); },
      async updateOrder(key, id, fields) {
        const all = LS.get("orders", []); const o = all.find((x) => x.id === id); if (o) Object.assign(o, fields);
        LS.set("orders", all); return { ok: true };
      },
      async saveProducts(key, list) { LS.set("products", list); LS.set("pricesUpdated", ymd(new Date())); return { ok: true }; },
      async events(key, days) {
        const from = addDays(ymd(new Date()), -(days - 1));
        return LS.get("events", []).map((x) => { const d = new Date(x.t); return [ymd(d), d.getHours(), x.v, x.s, x.e, x.src, x.lang, x.a, x.n]; }).filter((r) => r[0] >= from);
      },
    },
  };

  async function call(action, payload = {}) {
    // text/plain avoids a CORS preflight, which Apps Script does not support.
    const r = await fetch(C.SHEETS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j;
  }
  const Sheets = {
    async products() { return call("products"); },
    async placeOrder(o) { return call("placeOrder", { order: o }); },
    async myOrders(phone, flat) { return (await call("myOrders", { phone, flat })).orders; },
    async mySubs(phone, flat) { return (await call("mySubs", { phone, flat })).subs; },
    async saveSub(s) { return call("saveSub", { sub: s }); },
    admin: {
      async login(key) {
        try { await call("adminPing", { key }); return true; }
        catch (e) { return e.message === "Unauthorized" ? "Key doesn't match ADMIN_KEY in Apps Script. Check spelling and capitals." : "Can't reach your Google Sheet (" + e.message + "). Check internet, or the deployment access is not set to Anyone."; }
      },
      async orders(key, date) { return (await call("adminOrders", { key, date })).orders; },
      async subs(key) { return (await call("adminSubs", { key })).subs; },
      async updateOrder(key, id, fields) { return call("adminUpdateOrder", { key, id, fields }); },
      async saveProducts(key, list) { return call("adminSaveProducts", { key, products: list }); },
      async events(key, days) { return (await call("adminEvents", { key, days })).events; },
    },
  };

  window.M2D = {
    C, T, DEFAULT_PRODUCTS, COMPARE, COMPARE_LABEL, LS,
    api: C.SHEETS_URL ? Sheets : Local, demo: !C.SHEETS_URL,
    ymd, parseYmd, addDays, rupee, esc, cheapestElsewhere, saving, nextDeliveryDate, cutoffMoment,
    deliveryFee, subOn, upiLink, waLink, uid,
  };
})();
