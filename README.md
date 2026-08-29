#  Web Dev Assignment — Custom Theme Files

Custom sections for the Tenovia assignment, built on **Dawn v16.0.0**.

## Custom files

| File | Purpose |
|---|---|
| `sections/assignment-hero.liquid` | Test 1 — Hero |
| `sections/assignment-drop-teaser.liquid` | Test 1 — Drop teaser (§4.2) |
| `sections/assignment-display-text.liquid` | Test 1 — Display text |
| `assets/assignment-countdown.js` | Live countdown web component |
| `snippets/assignment-assets.liquid` | Shared fonts + `assignment-tokens.css` (rendered in theme layout) |
| `assets/assignment-tokens.css` | **Shared fonts, colors, spacing, utilities** |
| `assets/assignment-drop-teaser-form.js` | Newsletter form double-submit guard |
| `snippets/card-product-assignment.liquid` | Test 2 — Product card (214×415) |
| `sections/assignment-collection-grid.liquid` | Test 2 — Collection grid |
| `assets/component-assignment-product-card.css` | Product card + grid styles |
| `assets/assignment-product-card.js` | Swatches + quick add |
| `templates/page.assignment-demo.json` | Demo page template |

## §4.2 Drop teaser — compliance notes

### Countdown labels (Figma ambiguity)

The Figma frame shows four digit groups but label copy varies between frames (`Days` / `Hours` / `Mins` / `Secs` vs lowercase). We implemented **four units** (days, hours, minutes, seconds) with merchant-editable labels defaulting to **Days, Hours, Mins, Secs** — the version that matches the full timer logic.

If a Figma variant omits the minutes column, that appears to be a layout shortcut; hiding minutes would make the countdown inaccurate, so all four units are kept.

### Countdown at zero

When the target date/time is reached:

1. The digit grid hides.
2. The merchant-configured **“Message when countdown ends”** displays (default: `Drop is live`).
3. The interval stops (no further ticks).

Invalid or past dates on load show the same expired state immediately.

### Email capture

Uses Shopify `{% form 'customer' %}` with `contact[tags]=newsletter` (same pattern as Dawn’s newsletter section). Success and error messages render inline after submit.

### Merchant-editable settings

- Countdown date & time
- Countdown labels (4) and expired message
- Left headline, pattern image, left color scheme
- Right image, caption, form heading, placeholder, submit label, success/error copy

### Design size

Desktop target height: **567px** (`56.7rem`) at 1440px design width — two equal full-bleed panels.

## Color schemes

| Scheme | Use |
|---|---|
| scheme-6 | Hero — white text, mint button |
| scheme-7 | Drop teaser left — brown panel |
| scheme-8 | Drop teaser form — white box, black text |

Configure under **Theme settings → Colors**.

## Local development

```bash
shopify theme dev --store YOUR-STORE.myshopify.com
```

Create a page using the **assignment-demo** template to preview Test 1 sections.

## Shared design system (`assignment-tokens.css`)

Loaded once via `snippets/assignment-assets.liquid` → `layout/theme.liquid`.

### Typography scale (all 3 sections)

| Token | Size @ 1440 | Used for |
|---|---|---|
| `--assignment-type-script-xl` | 56px | Drop left headline |
| `--assignment-type-script-lg` | 48px | “Sneak peak…” caption |
| `--assignment-type-serif-hero` | 100px | Hero “Spring Break” |
| `--assignment-type-display-xl` | 180px | “Best sellers” |
| `--assignment-type-ui-2xs` | 11px | Countdown labels, CTA, Reviews tab |
| `--assignment-type-ui-xs` | 12px | NOTIFY ME |
| `--assignment-type-ui-sm` | 13px | Get notified, form messages |
| `--assignment-type-ui-base` | 14px | Email input |
| `--assignment-type-ui-digit` | 24px | Countdown digits |

All sizes use `clamp()` for responsive scaling. Typography rules live in `assignment-tokens.css`; section CSS files only add layout/color.

### Common spacing & layout

| Token | Value | Used for |
|---|---|---|
| `--assignment-section-padding` | 24px | Drop teaser outer inset |
| `--assignment-panel-gap` | 12px | Gap between drop teaser panels |
| `--assignment-panel-radius` | 16px | Panel corner radius |
| `--assignment-field-gap` | 46px | Email field → NOTIFY ME gap |

### Shared classes

- `.assignment-cta-button` — mint CTA styling
- `.assignment-display-heading` — display text base (optional; sections may extend)

Each assignment section only loads its own scoped CSS file on top of the shared tokens.

## Test 2 — Product card

Figma card size: **214 × 415 px**. Reusable via `{% render 'card-product-assignment' %}` or the **Assignment Collection Grid** section.

### Badges (product tags)
| Tag | Badge |
|---|---|
| `clearance` | Clearance |
| `final-sale` / `final sale` | Final Sale |

### Text block
- **Title** — `product.title` (2-line clamp)
- **Secondary line** — `product.type`, or metafield `custom.secondary_line`
- **Compare-at price** — shows when variant `compare_at_price` > price

### Swatches & quick add
- Colour option: product option must be named **`Color`** or **`Colour`**
- Max **4 swatches** + **+** overflow link to PDP
- If no swatch colour is set in admin, the card uses **each variant’s image** as the swatch
- Swatch updates image, links, price, and quick-add variant
- Quick add uses `/cart/add.js` + cart drawer/notification update; handles errors and double-click

### Data cases
Point the grid at products with: 1 vs 12 colours, sold out, compare-at, long titles, missing images.
