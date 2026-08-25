# Screenshot gallery

These screenshots were captured from the live site at `https://offlinegamenia.com` using Playwright at 1440×900 with the dark color scheme.

## Public storefront

| File | Source URL | What it shows |
|------|------------|---------------|
| `home.png` | `/` | Landing hero, brand, and navigation |
| `shop.png` | `/shop` | Game catalog grid with cards and filters |
| `game-detail.png` | `/games/grand-theft-auto-vi-ultimate-edition` | Game detail page with cover art and pricing |
| `faq.png` | `/faq` | FAQ accordion |
| `contact.png` | `/contact` | Contact form and support links |

## Admin dashboard

| File | What it shows |
|------|---------------|
| `admin-dashboard.png` | Admin dashboard with key metrics and recent audit activity |
| `admin-games.png` | Games management list with platform, price, and pool status |
| `admin-accounts.png` | Steam account pool with capacity and active-user counts |
| `admin-igdb-import.png` | IGDB search and import flow for game metadata |
| `admin-licenses.png` | License key list with owner and source details |

> **Security note:** `admin-licenses.png` contains real customer email addresses in the owner column. Do not embed it in the public README unless the emails are blurred or redacted.

## Missing authenticated flows

- `checkout.png` — `/checkout` (requires a signed-in buyer)
- `my-games.png` — `/my-games` (requires a signed-in buyer)

Keep screenshots focused on the product UI; do not include real customer data or secrets.
