# Backdrop Product Configurator — First-Fold Redesign

**Date:** 2026-09-22
**Source brief:** BackdropSource Dev Assignment (Optimize Our Product Ordering Experience)

## Goal
Redesign only the first fold of the Tension Fabric Backdrop product page (product info → Add to Cart) so first-time buyers understand the product, configure it confidently and reach Add to Cart with less friction. Assisted-sales paths (Custom Size Quote, Free 2D Design Review) stay clearly available but secondary. Desktop is the target; mobile must not break.

## Product data (set up by the store owner via `setup/backdrop-product-import.csv`)
- Option 1 `Choose Size (W x H)`: 6.5ft, 8ft, 9.8ft, 13.2ft, 16.4ft, 19.5ft W x 7.5ft H
- Option 2 `Choose Printing Option`: Single side graphic printed / Double side graphics printed / No fabric (frame only)
- Option 3 `Choose Hardware Option`: With aluminum frame / Replacement print only (no frame)
- 30 variants; "No fabric (frame only)" + "Replacement print only (no frame)" does not exist.

## Architecture
- `sections/main-product-configurator.liquid` — new section, replaces `main-product` only in a new template.
- `templates/product.backdrop-configurator.json` — uses the new section; keeps `related-products` below it. Assigned to the product in admin.
- `assets/product-configurator.css` — all styles scoped under `.bds-config`, tokens copied from backdropsource.com (Inter, primary #000F9F, 14px button radius, #E6E6E6 borders, black selected state).
- `assets/product-configurator.js` — `<bds-configurator>` custom element: reads variant JSON, maps choices → variant id, updates price/summary/step state, disables invalid combos, handles artwork mode, file dropzone and modals.
- Reuses Dawn's `product-form` custom element / `product-form.js` for Add to Cart (cart drawer / notification + errors) and `product-media-gallery` snippet for the gallery.
- Options are matched by **position** (option1/2/3), not name, so renaming options in admin doesn't break it. Size card labels and hints come from section settings / sensible parsing of the value.

## Layout (desktop)
Two columns: left sticky media gallery; right configurator.

1. **Header:** title, live price ("From $X" until fully configured — always configured due to defaults, so shows exact price), trust line (Printed in 24 business hrs · Free shipping · 1-yr warranty — section settings).
2. **Step 1 — Size:** 3×2 cards: big width ("10 ft"), full dimension, "from $X". "Most popular" badge (setting, default 3rd size). Below: secondary text link "Need a different size? Request a custom size quote — reply in 1–2 hrs" → quote modal.
3. **Step 2 — Print & Frame:** row "Printing" (3 options), row "Frame" (2 options). Each option shows price delta vs. current variant. Invalid combo is disabled with a helper line ("Frame only already includes the frame"). Selecting "Frame only" forces "With aluminum frame".
4. **Step 3 — Artwork:** two cards — "I have my artwork" (reveals dropzone, `properties[Artwork]`, optional; helper "or send it after checkout") and "I need design help" (sets `properties[Design help]=Free 2D design review requested`, shows CTA "Request free 2D design review — reply ~2 hrs, mock-up within 24 hrs" → design modal). If Printing = Frame only, the step collapses to "No artwork needed for frame only".
5. **Step 4 — Review & add to cart:** summary list (size, printing, frame, artwork), quantity, total, delivery line ("Production: 24 business hrs after artwork approval · Delivery: 5–7 business days in US"), primary Add to Cart.

Each step header shows number → ✓ + chosen value once complete. Defaults preselected: most popular size, single-sided, with frame, "I have my artwork".

## Assisted-sales forms
Native `{% form 'contact' %}` inside `<dialog>` modals. Fields — Quote: name, email, phone, width, height, notes. Design review: name, email, phone, notes. Hidden `contact[Request type]`, `contact[Product]`, `contact[Current selection]` (filled by JS). Return to `#bds-quote` / `#bds-design`; on `form.posted_successfully?` the modal reopens with a success state stating the promised response time. Errors from `form.errors` render inline.

## Out of scope
Anything below the first fold, global theme settings, header/footer, cart page, checkout.

## Verification
- `shopify theme check` passes with no errors for new files.
- `shopify theme dev`: every size × printing × frame combo resolves to the right variant/price; invalid combo is disabled; Add to Cart works with and without a file; both forms submit and show success.
