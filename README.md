# original-character-generator-web

![Platform](https://img.shields.io/badge/Platform-Web%20App-1f2937?style=flat-square)
![UI](https://img.shields.io/badge/UI-JP%20%2F%20EN-2563eb?style=flat-square)
![Prompt](https://img.shields.io/badge/Prompt-OC%20Generator-0f766e?style=flat-square)
![Mode](https://img.shields.io/badge/Mode-Single%20%2F%20History-7c3aed?style=flat-square)
![Settings](https://img.shields.io/badge/Settings-Export%20%2F%20Import-f59e0b?style=flat-square)
![Storage](https://img.shields.io/badge/Storage-localStorage-374151?style=flat-square)

## Try It Online

- [Open the GitHub Pages version](https://nade-eaf4fc.github.io/original-character-generator-web/)
- [ComfyUI custom node](https://github.com/nade-eaf4fc/comfyui-original-character-generator)
- [Follow the creator on X](https://x.com/nade_eaf4fc)

Static web app for generating original character appearance prompts and exporting local `settings_json` files.

## Quick Start

### Option 1: Open locally

1. Open `index.html` in a browser.
2. Generate a character idea from the main screen.
3. Lock the traits you like and reroll.
4. Use the advanced settings panel to adjust weights, export `settings_json`, or import a saved JSON file.

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
- `settings_json` download and import
- `include_base_prompt` toggle aligned with the current ComfyUI settings format
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
- `include_base_prompt` defaults to off.
- Chest size uses five weighted entries: `flat`, `small`, `medium`, `large`, `xlarge`.
- The raw weights do not need to add up to `1.00`.
- The app normalizes the values internally before generation.
- If the chest weight total is `0.00`, generation falls back to the balanced preset.
- Accessory generation uses one probability input for accessory presence.
- `none` is always calculated as `1 - p`.
- Advanced settings are stored in `localStorage` and restored on reload.

## settings_json

The advanced settings panel can:

- download `settings_json`
- import `settings_json`
- keep the format aligned with the current `comfyui-original-character-generator` settings

Companion repository:

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

## License

This package is released under the MIT License.
