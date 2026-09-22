# Backdrop Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the first fold of the backdrop product page with a guided 4-step configurator (Size → Print & Frame → Artwork → Review & Add to Cart) plus native-form Custom Size Quote and Free 2D Design Review modals.

**Architecture:** One new Dawn section (`main-product-configurator`) rendered by a new product template. A `<bds-configurator>` custom element owns selection state and maps option positions → variant id, writing into a standard Dawn `<product-form>` so Add to Cart reuses Dawn's cart drawer/notification. Styles are scoped under `.bds-config` using backdropsource.com tokens.

**Tech Stack:** Shopify Liquid (Dawn 16), vanilla JS custom elements, CSS, Shopify CLI (`theme check`, `theme dev`).

**Spec:** `docs/superpowers/specs/2026-09-22-backdrop-configurator-design.md`

## Global Constraints
- Only the first fold changes; no edits to other sections, global settings, header/footer, cart.
- Options are addressed by position (option1 = size, option2 = printing, option3 = hardware).
- Printing value index 2 (frame only) is only valid with hardware index 0 (with frame).
- Visual tokens: font Inter; primary #000F9F; button radius 14px; border #E6E6E6; selected = black border.
- Copy: quote reply "1–2 hrs"; design review "reply in ~2 hrs, mock-up within 24 hrs"; production "24 business hrs after artwork approval"; delivery "5–7 business days".

---

### Task 1: Section skeleton, template, gallery
**Files:** Create `sections/main-product-configurator.liquid`, `templates/product.backdrop-configurator.json`, `assets/product-configurator.css`
- [ ] Section with two-column `.bds-config` layout, custom lightweight gallery (main image + thumbnails), title, price, trust line, schema settings (trust texts, popular size index, step copy).
- [ ] Template: `main` = `main-product-configurator`, then `related-products` as in `product.json`.
- [ ] Verify: `shopify theme check --path .` → no errors in new files.
- [ ] Commit.

### Task 2: Steps markup + variant data
**Files:** Modify `sections/main-product-configurator.liquid`
- [ ] Step 1 size cards (from `product.options_with_values[0]`), "from" price = min variant price per size; custom quote link.
- [ ] Step 2 printing + frame radio groups with price-delta slots.
- [ ] Step 3 artwork choice cards, dropzone `<input type=file name="properties[Artwork]" form=...>`, design-help hidden property.
- [ ] Step 4 summary, quantity, delivery line, Dawn `<product-form>` with hidden `id`, error wrapper, submit + `loading-spinner`.
- [ ] `<script type="application/json" data-bds-variants>` with `{id, price, available, options:[o1,o2,o3], image}` per variant.
- [ ] Commit.

### Task 3: Configurator behaviour
**Files:** Create `assets/product-configurator.js`
- [ ] `BdsConfigurator` custom element: `state = {size, print, frame, artwork}` (indices / `'upload'|'design'`); `findVariant()`; `render()` updates hidden id, price, deltas, disabled combos, step ✓ labels, summary, artwork-step skip for frame only, gallery image, URL `?variant=`.
- [ ] Dropzone: click/drag, show filename + remove, 20 MB guard.
- [ ] Modals: `<dialog>` open/close for `[data-bds-open="quote|design"]`, fill hidden `contact[Current selection]`, reopen on `#bds-quote`/`#bds-design` after post.
- [ ] Commit.

### Task 4: Assisted-sales modals
**Files:** Modify `sections/main-product-configurator.liquid`
- [ ] Quote dialog: `{% form 'contact', id: 'BdsQuoteForm' %}` name/email/phone/width/height/notes + hidden request type/product/selection; success + error states.
- [ ] Design dialog: same pattern with name/email/phone/notes.
- [ ] Commit.

### Task 5: Verify
- [ ] `shopify theme check` clean for new files.
- [ ] `shopify theme dev` walkthrough: all 30 combos price-match CSV; invalid combo disabled; add to cart with/without file; both forms show success.
- [ ] Commit fixes.
