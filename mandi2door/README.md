# Mandi2Door: fresh veg, fruit, milk & eggs for Balaji Symphony

Residents order on their phone by **10 PM**. You buy exactly that at APMC early next morning, and it is delivered **6–8 AM**. Every item shows the price on Blinkit, Instamart, Zepto and the local vendor, plus how much the resident saves.

| Page | Who | What |
|---|---|---|
| `index.html` | Residents | Shop in English, Marathi or Hindi, cart with savings, place order, pay by UPI, milk/eggs subscription, order history and total saved |
| `admin.html` | You | Day's profit, APMC buy list, delivery list by building (send to delivery person on WhatsApp), mark delivered/paid, daily price entry, monthly milk bills |

## Try it now (demo mode)
Open `index.html`, place an order, then open `admin.html` (PIN `1234`) in the same browser. In demo mode, data stays in that browser only.

## Go live (free, about 20 minutes)
1. **Create a Google Sheet** named "Mandi2Door".
2. In the sheet, open **Extensions → Apps Script**. Delete the sample code and paste in the contents of `apps-script/Code.gs`. Save.
3. Click ⚙️ **Project Settings → Script properties → Add**:
   - `ADMIN_KEY` = a long secret (e.g. `m2d-Shree-4821-mango`). This is your admin login. Don't share it.
   - Optional: `FREE_DELIVERY_ABOVE` = `149`, `DELIVERY_FEE` = `15`
4. Back in the editor, pick the `setup` function and click **Run**, then allow the permissions. This creates the Products, Orders and Subscriptions tabs.
5. Click **Deploy → New deployment → Web app**. Set Execute as **Me** and Who has access **Anyone**, then deploy and copy the URL.
6. In `config.js`, paste that URL into `SHEETS_URL` and set your `WHATSAPP` number and `UPI_ID`.
7. Open `admin.html` → **Prices** → **Import CSV** (or type prices in) → **Save prices**. This puts the full catalogue into the sheet.
8. Share the link in the society WhatsApp groups. Residents tap ⋮ → **Add to Home screen** and it works like an app.

> After any change to `Code.gs`, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Daily routine
| Time | Task |
|---|---|
| 9–10 AM | Check Blinkit / Instamart / Zepto / local vendor prices → **Prices** tab → Save (about 15 minutes) |
| 10 PM | Orders close. Open **Buy list**, share it on WhatsApp, keep cash ready |
| 3:30–5 AM | APMC purchase (veg/fruit); dairy distributor drop (milk/eggs) |
| 5–6 AM | Sort and bag by building/flat using the **Delivery** tab |
| 6–8 AM | Delivery person follows the list, collects UPI, and marks delivered/paid |
| 1st of month | **Subscriptions** tab → send each flat its milk bill on WhatsApp |

## Notes
- **Savings are honest**: they're measured against the *cheapest* comparison price, not the most expensive one.
- **Prices can't be tampered with**: the server re-calculates every order from the sheet.
- **Milk subscriptions are billed monthly**, the way a regular milkman works. Daily orders are paid by UPI on delivery.
