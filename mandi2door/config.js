// Mandi2Door settings. Edit these values, then re-deploy.
window.M2D_CONFIG = {
  // Paste your Google Apps Script web-app URL here (see README.md).
  // Leave empty to run in DEMO mode (data stays on this phone only).
  SHEETS_URL: "https://script.google.com/macros/s/AKfycbzt7BYD2kuNNy5pFNcsMY2nw5xe8Lt5DXTIX_o2bhC6J77On6FX2xsT9BuEQM9NM_C2GQ/exec",

  BRAND: "Mandi2Door",
  SOCIETY: "Balaji Symphony",
  WHATSAPP: "919999999999",       // your business WhatsApp number, with 91, no +
  UPI_ID: "mandi2door@upi",        // your UPI ID for payments
  UPI_NAME: "Mandi2Door",
  CUTOFF_HOUR: 22,                 // orders close at 10 PM for next-day delivery
  DELIVERY_SLOT: "6–8 AM",
  FREE_DELIVERY_ABOVE: 149,
  DELIVERY_FEE: 15,
  DEMO_ADMIN_PIN: "1234"           // demo mode only; live mode uses the key in Apps Script
};
