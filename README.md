# original-character-generator-web

Static web app for generating original character appearance prompts and exporting `settings_json` presets.

## Quick Start

### Option 1: Open locally

1. Open `index.html` in a browser.
2. Generate a character idea from the main screen.
3. Lock the traits you like and reroll.
4. Use the advanced settings panel to adjust weights, export `settings_json`, or save presets for ComfyUI.

### Option 2: git clone

```bash
git clone https://github.com/nade-eaf4fc/original-character-generator-web.git
cd original-character-generator-web
```

Then open `index.html` or publish the directory with GitHub Pages.

## Features

- JP / EN UI switching
- Prompt generation from hairstyle, hair color, eye color, accessory, and bust size pools
- Click-to-fix reroll flow
- Preset-based weight switching
- Live bust distribution and accessory probability preview
- `settings_json` export and import
- ComfyUI preset save/load integration through the local ComfyUI server
- Local persistence with `localStorage`

## Structure

- `index.html`
- `styles/site.css`
- `scripts/data-store.js`
- `scripts/app.js`
- `data/base-prompt.js`
- `data/*.js`
- `docs/images`
- `examples`

## Advanced Settings

- The advanced settings panel is closed by default.
- The base prompt can be overridden without rewriting `data/base-prompt.js`.
- Chest size uses five weighted entries: `flat`, `small`, `medium`, `large`, `xlarge`.
- The raw weights do not need to add up to `1.00`.
- The app normalizes the values internally before generation.
- If the chest weight total is `0.00`, generation falls back to the balanced preset.
- Accessory generation uses one probability input for accessory presence.
- `none` is always calculated as `1 - p`.
- Advanced settings are stored in `localStorage` and restored on reload.

## ComfyUI Integration

The advanced settings panel can:

- export `settings_json`
- import `settings_json`
- save presets to ComfyUI
- load presets from ComfyUI

Default ComfyUI target:

- `http://127.0.0.1:8188`

This works with the companion repository:

- `comfyui-original-character-generator`

## History

- The history keeps up to `10` recent results.
- History items can be pinned.
- Older unpinned entries are removed first when the list exceeds the limit.

## Presets

- `Balanced`
- `Petite`
- `Curvy`
- `Statement`

Each preset updates both bust weighting and accessory probability.

## Extending Data

- Add or edit prompt pools in `data/*.js`.
- Mark development-only items with `developmentOnly: true`.
- In production mode those entries are filtered automatically.

## Acknowledgements

Built with development assistance from OpenAI Codex, powered by GPT-5.4.
