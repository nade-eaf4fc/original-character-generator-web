# OC Body Random Generator

Static OC prompt generator for GitHub Pages.

## Structure

- `index.html`
  - Main document and UI markup
- `styles/site.css`
  - Dark UI styling, responsive layout, charts, and controls
- `scripts/data-store.js`
  - Shared registration helper for base prompt and category data
- `scripts/app.js`
  - Generator logic, advanced settings, localStorage persistence, presets, charts, copy flow, and history
- `data/base-prompt.js`
  - Base prompt text
- `data/*.js`
  - Category data files

## Advanced Settings

- The advanced settings panel is closed by default.
- The UI supports `JP / EN` switching and keeps the actual prompt vocabulary in English.
- The base prompt can be overridden from the UI without rewriting `data/base-prompt.js`.
- Chest size uses five weighted entries: `flat`, `small`, `medium`, `large`, `xlarge`.
- Each chest weight accepts `0.00` to `1.00`.
- The raw weights do not need to add up to `1.00`.
- The app normalizes the values internally and shows the normalized distribution as horizontal charts.
- If the chest weight total is `0.00`, generation falls back to the balanced preset and the UI shows that fallback state clearly.
- Accessory generation uses one probability input for `has accessory`.
- `none` is always calculated as `1 - p`.
- Advanced settings are stored in `localStorage` and restored on reload.

## History

- The history keeps up to `10` recent results.
- History items can be pinned to keep them prioritized at the top.
- When the list exceeds the limit, older unpinned entries are removed first.

## Presets

- `Balanced`
- `Petite`
- `Curvy`
- `Statement`

Each preset updates both chest weighting and accessory probability.

## Extending Data

- Add or edit prompt pools in `data/*.js`.
- Mark development-only items with `developmentOnly: true`.
- In `production` mode those entries are filtered automatically.
