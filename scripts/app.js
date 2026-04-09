window.addEventListener("DOMContentLoaded", function () {
  const promptData = window.OCGeneratorData.getSnapshot();
  const historyList = [];
  const fixedEntries = Object.create(null);
  const categoryMap = Object.fromEntries(
    promptData.categories.map(function (category) {
      return [category.key, category];
    })
  );
  const maxHistory = Number(promptData.config.maxHistory) || 10;
  const STORAGE_KEY = "oc-random-generator-settings-v2";
  const LANGUAGE_STORAGE_KEY = "oc-random-generator-language-v1";
  const BUST_KEYS = ["flat", "small", "medium", "large", "xlarge"];
  const FALLBACK_PRESETS = {
    balanced: {
      label: {
        jp: "Balanced",
        en: "Balanced",
      },
      bustWeights: { flat: 0.18, small: 0.28, medium: 0.26, large: 0.18, xlarge: 0.1 },
      accessoryProbability: 0.58,
    },
    petite: {
      label: {
        jp: "Petite",
        en: "Petite",
      },
      bustWeights: { flat: 0.44, small: 0.28, medium: 0.16, large: 0.08, xlarge: 0.04 },
      accessoryProbability: 0.38,
    },
    curvy: {
      label: {
        jp: "Curvy",
        en: "Curvy",
      },
      bustWeights: { flat: 0.08, small: 0.16, medium: 0.28, large: 0.28, xlarge: 0.2 },
      accessoryProbability: 0.72,
    },
    statement: {
      label: {
        jp: "Statement",
        en: "Statement",
      },
      bustWeights: { flat: 0.04, small: 0.1, medium: 0.2, large: 0.3, xlarge: 0.36 },
      accessoryProbability: 0.86,
    },
  };

  function normalizePresetMap(rawPresets) {
    const nextPresets = {};

    Object.entries(rawPresets || {}).forEach(function (entry) {
      const presetKey = String(entry[0]);
      const preset = entry[1] || {};
      const label = preset.label || {};
      const bustWeights = {};

      BUST_KEYS.forEach(function (key) {
        bustWeights[key] = clampProbability(
          preset.bustWeights && preset.bustWeights[key],
          FALLBACK_PRESETS.balanced.bustWeights[key]
        );
      });

      nextPresets[presetKey] = {
        label: {
          jp: String(label.jp || label.ja || label.en || presetKey),
          en: String(label.en || label.jp || label.ja || presetKey),
        },
        bustWeights: bustWeights,
        accessoryProbability: clampProbability(
          preset.accessoryProbability,
          FALLBACK_PRESETS.balanced.accessoryProbability
        ),
      };
    });

    return Object.keys(nextPresets).length ? nextPresets : FALLBACK_PRESETS;
  }

  const PRESETS = normalizePresetMap(promptData.config.presets);
  const DEFAULT_PRESET_KEY =
    Object.prototype.hasOwnProperty.call(PRESETS, promptData.config.defaultPresetKey)
      ? promptData.config.defaultPresetKey
      : Object.keys(PRESETS)[0];
  const TRANSLATIONS = {
    jp: {
      documentTitle: "オリキャラジェネレーター",
      lang: {
        switch: "言語切り替え",
        jpTitle: "日本語表示に切り替え",
        enTitle: "English表示に切り替え",
      },
      hero: {
        eyebrow: "オリキャラジェネレーター",
        title: "オリキャラジェネレーター",
        body: "髪型・髪色・瞳色・アクセサリー・胸サイズを組み合わせて、オリキャラの外見案を生成します。",
        noteTitle: "Fast, Then Precise",
        noteBody: "まず一度生成して、気に入った要素だけ固定する。流れを止めずに、少しずつ理想へ寄せていけます。",
      },
      section: {
        generator: "ジェネレーター",
        rerollHint: "Space / Enter で再生成",
      },
      button: {
        generate: "生成する",
        copyRaw: "Rawをコピー",
        copyFormatted: "整形版をコピー",
        clearFixed: "固定を解除",
        resetBase: "既定に戻す",
      },
      settingsJson: {
        title: "settings_json",
        body: "現在の詳細設定と属性固定を、現在の ComfyUI 設定に合わせた settings_json として保存・読込できます。",
        presetName: "保存名",
        export: "JSONを書き出し",
        import: "JSONを読む",
        localHint: "ブラウザから JSON ファイルとして保存し、あとで読み戻せます。",
      },
      empty: {
        title: "まだ生成されていません",
        body: "まず1回生成すると、Raw Prompt、整形済み出力、現在の属性セットが表示されます。生成後はタグをクリックして、その属性だけ固定したまま再抽選できます。",
      },
      lock: {
        title: "属性固定",
        idle: "タグをクリックすると次の再生成まで固定できます。",
        one: "1項目を固定中です。もう一度クリックすると解除できます。",
        many: "{count}項目を固定中です。固定中のタグをクリックすると解除できます。",
      },
      output: {
        raw: "Raw Prompt",
        formatted: "整形済み出力",
        formattedNote: "GitHub Pages向けの単一HTMLで利用できます",
        chars: "文字",
      },
      advanced: {
        title: "詳細設定",
        subtitle: "胸サイズの重み、アクセサリー出現率、プリセットを調整します。",
      },
      preset: {
        title: "プリセット",
        body: "各プリセットは胸サイズの重みとアクセサリー出現率をまとめて切り替えます。",
        balanced: "バランス",
        petite: "細身",
        curvy: "メリハリ",
        statement: "強め",
        reset: "リセット",
        note: "設定値はlocalStorageに保存され、再読込時に復元されます。",
      },
      bust: {
        title: "胸サイズの重み",
        body: "0.00から1.00の任意値を入力できます。内部で自動的に正規化されます。",
        rawSum: "Raw合計 {value}",
        caption: {
          flat: "Prompt: flat chest",
          small: "Prompt: small breasts",
          medium: "Prompt: medium breasts",
          large: "Prompt: large breasts",
          xlarge: "Prompt: very large breasts",
        },
        fallback: "フォールバック: {label}",
        live: "現在の重み",
        statusFallback: "Raw合計が0.00のため、生成時は安全策として {label} プリセットにフォールバックします。",
        statusLive: "Raw合計は {value} です。合計を1.00に揃える必要はなく、自動で正規化されます。",
      },
      accessory: {
        title: "アクセサリー出現率",
        body: "アクセサリーが付く確率を設定します。なし は常に 1 - p で自動計算されます。",
        has: "アクセサリーあり",
        note: "なし = 1 - p",
        summary: "あり {has} / なし {none}",
      },
      chart: {
        title: "正規化後の分布",
        body: "グラフはリアルタイムで更新され、生成時に使われる確率をそのまま表示します。",
        bust: "胸サイズ",
        accessory: "アクセサリー",
        has: "あり",
        none: "なし",
      },
      overview: {
        title: "概要",
        subtitle: "現在の候補プール",
      },
      meta: {
        base: "ベースプロンプト",
        includeBasePrompt: "ベースプロンプトを含める",
        includeBasePromptHint: "オフにすると、生成結果と settings_json の両方でベースプロンプトを使いません。",
        baseHint: "ここで変更しても内部ファイルは書き換わらず、この画面上の生成にだけ反映されます。",
        currentSettings: "現在の設定",
        persistence: "保存",
        persistenceBody: "詳細設定はlocalStorageに保存され、再読込時に自動で復元されます。",
      },
      history: {
        title: "履歴",
        subtitle: "最新{count}件",
        clearTitle: "履歴をクリア",
        empty: "まだ履歴はありません。生成すると最新{count}件までここに残ります。",
        copyTitle: "整形済み出力をコピー",
        loadTitle: "この結果を再表示",
        pinTitle: "この履歴をピン留め",
        unpinTitle: "この履歴のピンを外す",
        pinnedLabel: "固定",
      },
      toast: {
        copiedTitle: "コピーしました",
        copiedRaw: "Raw prompt をクリップボードへコピーしました。",
        copiedFormatted: "整形済み出力をクリップボードへコピーしました。",
        copyFailedTitle: "コピー失敗",
        copyFailedBody: "このブラウザではクリップボードへのアクセスが拒否されました。",
        fixedClearedTitle: "固定解除",
        fixedClearedBody: "固定していた属性をすべて解除しました。",
        releasedTitle: "固定解除",
        releasedBody: "{label} は次回以降ふたたび再抽選されます。",
        fixedTitle: "属性を固定",
        fixedBody: "{label} を次の再生成まで維持します。",
        loadedTitle: "履歴を読み込みました",
        loadedBody: "履歴の内容を再表示しました。固定状態はリセットされています。",
        historyPinnedTitle: "ピン留めしました",
        historyPinnedBody: "この履歴を上部に固定して残しやすくしました。",
        historyUnpinnedTitle: "ピンを外しました",
        historyUnpinnedBody: "この履歴は通常の並びに戻ります。",
        missingDataTitle: "データ不足",
        missingDataBody: "少なくとも1つのカテゴリファイルが必要です。",
        historyClearedTitle: "履歴を削除しました",
        historyClearedBody: "保存していた生成結果を消去しました。",
        presetAppliedTitle: "プリセットを適用しました",
        presetAppliedBody: "{label} の設定に切り替えました。",
        settingsResetTitle: "設定をリセットしました",
        settingsResetBody: "{label} プリセットに戻しました。",
        settingsExportedTitle: "書き出しました",
        settingsExportedBody: "settings_json をダウンロードしました。",
        settingsImportedTitle: "読み込みました",
        settingsImportedBody: "settings_json を反映しました。",
        settingsImportFailedTitle: "読み込み失敗",
        settingsImportFailedBody: "JSON の形式を確認してください。",
      },
      storage: {
        saved: "ローカルに保存済み",
        unavailable: "保存領域を利用できません",
        default: "既定",
        custom: "上書き中",
      },
      settingsPreview: {
        text: "プリセット: {preset}。胸サイズのRaw合計: {rawSum}{fallback} アクセサリー出現率: {presence}。",
        fallbackSuffix: "（フォールバック中）。",
        normalSuffix: "。",
        custom: "カスタム",
      },
      common: {
        copied: "完了",
        customProfile: "カスタム設定",
        activePool: "有効な候補群",
      },
      stats: {
        bust: "5段階の重み設定",
        accessory: "出現率 {value}",
        hairStyle: "髪型バリエーション",
        eyeColor: "瞳色候補",
        hairColor: "髪色候補",
      },
      categories: {
        hairStyle: "髪型",
        eyeColor: "瞳色",
        hairColor: "髪色",
        accessory: "アクセサリー",
        bustSize: "胸サイズ",
      },
      bustLabel: {
        flat: "flat",
        small: "small",
        medium: "medium",
        large: "large",
        xlarge: "xlarge",
      },
      tag: {
        fixed: "固定中",
        tapToFix: "クリックで固定",
        noAccessory: "アクセサリーなし",
        titleFixed: "固定を解除",
        titleFree: "この属性を固定",
      },
    },
    en: {
      documentTitle: "Original Character Generator",
      lang: {
        switch: "Language switch",
        jpTitle: "Switch to Japanese",
        enTitle: "Switch to English",
      },
      hero: {
        eyebrow: "Original Character Generator",
        title: "Original Character Generator",
        body: "Generate an original character appearance concept by combining hairstyle, hair color, eye color, accessories, and chest size.",
        noteTitle: "Fast, Then Precise",
        noteBody: "Generate once, lock the traits you like, and keep shaping the result without losing momentum.",
      },
      section: {
        generator: "Generator",
        rerollHint: "Space / Enter to reroll",
      },
      button: {
        generate: "Generate",
        copyRaw: "Copy Raw",
        copyFormatted: "Copy Formatted",
        clearFixed: "Clear Fixed",
        resetBase: "Reset",
      },
      settingsJson: {
        title: "settings_json",
        body: "Export and import the current advanced settings and fixed traits as settings_json aligned with the current ComfyUI settings format.",
        presetName: "File Name",
        export: "Export JSON",
        import: "Import JSON",
        localHint: "Save the current setup as a local JSON file and import it later.",
      },
      empty: {
        title: "No result generated yet",
        body: "Generate once to see the raw prompt, formatted output, and the current attribute set. Click a tag afterward if you want to fix that attribute for the next reroll.",
      },
      lock: {
        title: "Fix Attributes",
        idle: "Click a tag to fix it for the next reroll.",
        one: "1 attribute is fixed. Click it again to release.",
        many: "{count} attributes are fixed. Click any fixed tag to release.",
      },
      output: {
        raw: "Raw Prompt",
        formatted: "Formatted Output",
        formattedNote: "Single-file output ready for GitHub Pages",
        chars: "chars",
      },
      advanced: {
        title: "Advanced Settings",
        subtitle: "Chest weighting, accessory probability, and reusable presets.",
      },
      preset: {
        title: "Presets",
        body: "Each preset updates both chest weights and accessory probability.",
        balanced: "Balanced",
        petite: "Petite",
        curvy: "Curvy",
        statement: "Statement",
        reset: "Reset",
        note: "Values are stored in localStorage and restored on reload.",
      },
      bust: {
        title: "Chest Weight",
        body: "Use any raw values from 0.00 to 1.00. The generator normalizes them internally.",
        rawSum: "Raw sum {value}",
        caption: {
          flat: "Prompt: flat chest",
          small: "Prompt: small breasts",
          medium: "Prompt: medium breasts",
          large: "Prompt: large breasts",
          xlarge: "Prompt: very large breasts",
        },
        fallback: "Fallback: {label}",
        live: "Live weights",
        statusFallback: "Raw total is 0.00. Generation falls back to the {label} preset for safety.",
        statusLive: "Raw total is {value}. Values are normalized automatically, so the total does not need to equal 1.00.",
      },
      accessory: {
        title: "Accessory Chance",
        body: "Set the probability of generating any accessory. None is always calculated as 1 - p.",
        has: "has accessory",
        note: "none = 1 - p",
        summary: "Has {has} / None {none}",
      },
      chart: {
        title: "Normalized Distribution",
        body: "Charts update live and reflect the exact probabilities used during generation.",
        bust: "Chest",
        accessory: "Accessory",
        has: "has",
        none: "none",
      },
      overview: {
        title: "Overview",
        subtitle: "Current pool",
      },
      meta: {
        base: "Base Prompt",
        includeBasePrompt: "Include base prompt",
        includeBasePromptHint: "When disabled, the base prompt is omitted from both generation and settings_json export.",
        baseHint: "Changes here do not rewrite the source file. They only affect generation in this UI.",
        currentSettings: "Current Settings",
        persistence: "Persistence",
        persistenceBody: "Advanced settings are saved to localStorage and restored automatically after reload.",
      },
      history: {
        title: "History",
        subtitle: "Latest {count}",
        clearTitle: "Clear history",
        empty: "No history yet. Generate a result to keep the latest {count}.",
        copyTitle: "Copy formatted output",
        loadTitle: "Load this result",
        pinTitle: "Pin this history item",
        unpinTitle: "Unpin this history item",
        pinnedLabel: "Pinned",
      },
      toast: {
        copiedTitle: "Copied",
        copiedRaw: "Raw prompt copied.",
        copiedFormatted: "Formatted output copied.",
        copyFailedTitle: "Copy failed",
        copyFailedBody: "Clipboard access was denied in this browser.",
        fixedClearedTitle: "Fixed cleared",
        fixedClearedBody: "All fixed attributes were released.",
        releasedTitle: "Released",
        releasedBody: "{label} will reroll again.",
        fixedTitle: "Fixed",
        fixedBody: "{label} will stay on the next reroll.",
        loadedTitle: "Loaded",
        loadedBody: "A history item is back on screen. Fixed attributes were reset.",
        historyPinnedTitle: "Pinned",
        historyPinnedBody: "This history item will stay prioritized at the top.",
        historyUnpinnedTitle: "Unpinned",
        historyUnpinnedBody: "This history item is back in the normal flow.",
        missingDataTitle: "Missing data",
        missingDataBody: "Add at least one category file.",
        historyClearedTitle: "History cleared",
        historyClearedBody: "Saved results were removed.",
        presetAppliedTitle: "Preset applied",
        presetAppliedBody: "{label} settings are now active.",
        settingsResetTitle: "Settings reset",
        settingsResetBody: "{label} preset restored.",
        settingsExportedTitle: "Exported",
        settingsExportedBody: "settings_json was downloaded.",
        settingsImportedTitle: "Imported",
        settingsImportedBody: "settings_json was applied.",
        settingsImportFailedTitle: "Import failed",
        settingsImportFailedBody: "Please check the JSON format.",
      },
      storage: {
        saved: "Saved locally",
        unavailable: "Storage unavailable",
        default: "Default",
        custom: "Override active",
      },
      settingsPreview: {
        text: "Preset: {preset}. Chest raw sum: {rawSum}{fallback} Accessory presence: {presence}.",
        fallbackSuffix: " (fallback active).",
        normalSuffix: ".",
        custom: "Custom",
      },
      common: {
        copied: "Copied",
        customProfile: "Custom profile",
        activePool: "active pool",
      },
      stats: {
        bust: "5 weighted size slots",
        accessory: "presence {value}",
        hairStyle: "shape variations",
        eyeColor: "eye color pool",
        hairColor: "hair color pool",
      },
      categories: {
        hairStyle: "Hair Style",
        eyeColor: "Eye Color",
        hairColor: "Hair Color",
        accessory: "Accessory",
        bustSize: "Bust",
      },
      bustLabel: {
        flat: "flat",
        small: "small",
        medium: "medium",
        large: "large",
        xlarge: "xlarge",
      },
      tag: {
        fixed: "fixed",
        tapToFix: "tap to fix",
        noAccessory: "no accessory",
        titleFixed: "Release fixed attribute",
        titleFree: "Fix this attribute",
      },
    },
  };
  const PRESETS_LEGACY = {
    balanced: {
      label: {
        jp: "バランス",
        en: "Balanced",
      },
      bustWeights: { flat: 0.18, small: 0.28, medium: 0.26, large: 0.18, xlarge: 0.1 },
      accessoryProbability: 0.58,
    },
    petite: {
      label: {
        jp: "細身",
        en: "Petite",
      },
      bustWeights: { flat: 0.44, small: 0.28, medium: 0.16, large: 0.08, xlarge: 0.04 },
      accessoryProbability: 0.38,
    },
    curvy: {
      label: {
        jp: "メリハリ",
        en: "Curvy",
      },
      bustWeights: { flat: 0.08, small: 0.16, medium: 0.28, large: 0.28, xlarge: 0.2 },
      accessoryProbability: 0.72,
    },
    statement: {
      label: {
        jp: "強め",
        en: "Statement",
      },
      bustWeights: { flat: 0.04, small: 0.1, medium: 0.2, large: 0.3, xlarge: 0.36 },
      accessoryProbability: 0.86,
    },
  };
  const storageState = {
    available: true,
  };
  const FIXED_KEY_TO_CATEGORY_KEY = {
    hair_style: "hairStyle",
    hair_color: "hairColor",
    eye_color: "eyeColor",
    accessory: "accessory",
    bust_size: "bustSize",
  };
  const bustCategory = categoryMap.bustSize;
  const accessoryCategory = categoryMap.accessory;
  const bustOptionsByKey = bustCategory
    ? Object.fromEntries(
        bustCategory.values.map(function (option) {
          return [option.key, option];
        })
      )
    : {};
  let currentLanguage = loadStoredLanguage();

  const els = {
    langJaBtn: document.getElementById("langJaBtn"),
    langEnBtn: document.getElementById("langEnBtn"),
    advancedSummaryMeta: document.getElementById("advancedSummaryMeta"),
    bustDistribution: document.getElementById("bustDistribution"),
    bustFallbackBadge: document.getElementById("bustFallbackBadge"),
    bustRawSum: document.getElementById("bustRawSum"),
    bustStatus: document.getElementById("bustStatus"),
    tagRow: document.getElementById("tagRow"),
    lockPanel: document.getElementById("lockPanel"),
    lockStatus: document.getElementById("lockStatus"),
    rawCard: document.getElementById("rawCard"),
    fmtCard: document.getElementById("fmtCard"),
    rawOutput: document.getElementById("rawOutput"),
    fmtOutput: document.getElementById("fmtOutput"),
    rawLength: document.getElementById("rawLength"),
    emptyState: document.getElementById("emptyState"),
    historySubtitle: document.getElementById("historySubtitle"),
    historyList: document.getElementById("historyList"),
    generateBtn: document.getElementById("generateBtn"),
    copyRawBtn: document.getElementById("copyRawBtn"),
    copyFmtBtn: document.getElementById("copyFmtBtn"),
    clearFixedBtn: document.getElementById("clearFixedBtn"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    statsGrid: document.getElementById("statsGrid"),
    includeBasePromptInput: document.getElementById("includeBasePromptInput"),
    basePromptInput: document.getElementById("basePromptInput"),
    basePromptStatus: document.getElementById("basePromptStatus"),
    resetBasePromptBtn: document.getElementById("resetBasePromptBtn"),
    settingsPreview: document.getElementById("settingsPreview"),
    storageBadge: document.getElementById("storageBadge"),
    accessoryRateBadge: document.getElementById("accessoryRateBadge"),
    accessoryProbabilityRange: document.getElementById("accessoryProbabilityRange"),
    accessoryProbabilityInput: document.getElementById("accessoryProbabilityInput"),
    accessoryDistribution: document.getElementById("accessoryDistribution"),
    accessoryDistributionNote: document.getElementById("accessoryDistributionNote"),
    settingsPresetNameInput: document.getElementById("settingsPresetNameInput"),
    exportSettingsJsonBtn: document.getElementById("exportSettingsJsonBtn"),
    importSettingsJsonBtn: document.getElementById("importSettingsJsonBtn"),
    importSettingsJsonInput: document.getElementById("importSettingsJsonInput"),
    directEditTriggers: Array.from(document.querySelectorAll("[data-direct-edit]")),
    presetButtons: Array.from(document.querySelectorAll("[data-preset]")),
    resetSettingsBtn: document.getElementById("resetSettingsBtn"),
    toast: document.getElementById("toast"),
    toastTitle: document.getElementById("toastTitle"),
    toastBody: document.getElementById("toastBody"),
    bustInputs: Object.fromEntries(
      BUST_KEYS.map(function (key) {
        return [key, document.querySelector(`[data-bust-key="${key}"]`)];
      })
    ),
    bustRanges: Object.fromEntries(
      BUST_KEYS.map(function (key) {
        return [key, document.querySelector(`[data-bust-range-key="${key}"]`)];
      })
    ),
  };

  let settings = loadStoredSettings();
  let currentRaw = "";
  let currentFmt = "";
  let currentResult = null;
  let historyIdCounter = 0;
  let toastTimer = null;

  function loadStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return stored === "en" ? "en" : "jp";
    } catch (error) {
      return "jp";
    }
  }

  function saveLanguage() {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch (error) {
      return;
    }
  }

  function getTranslationValue(path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key];
    }, TRANSLATIONS[currentLanguage]) || path;
  }

  function t(path, vars) {
    const template = String(getTranslationValue(path));
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return vars && vars[key] !== undefined ? String(vars[key]) : "";
    });
  }

  function getPresetLabel(presetKey) {
    const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET_KEY];
    return preset.label[currentLanguage];
  }

  function syncPresetButtonLabels() {
    els.presetButtons.forEach(function (button) {
      const preset = PRESETS[button.dataset.preset];

      if (!preset) {
        button.hidden = true;
        return;
      }

      button.hidden = false;
      button.textContent = preset.label[currentLanguage];
    });
  }

  function getCategoryLabel(categoryKey) {
    return t(`categories.${categoryKey}`);
  }

  function getBustLabel(key) {
    return t(`bustLabel.${key}`);
  }

  function applyStaticTranslations() {
    document.documentElement.lang = currentLanguage === "jp" ? "ja" : "en";
    document.title = t("documentTitle");

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      node.innerHTML = t(node.dataset.i18nHtml);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
      node.title = t(node.dataset.i18nTitle);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
      node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
    });

    els.langJaBtn.classList.toggle("is-active", currentLanguage === "jp");
    els.langEnBtn.classList.toggle("is-active", currentLanguage === "en");
    els.langJaBtn.setAttribute("aria-pressed", currentLanguage === "jp" ? "true" : "false");
    els.langEnBtn.setAttribute("aria-pressed", currentLanguage === "en" ? "true" : "false");
    els.historySubtitle.textContent = t("history.subtitle", { count: maxHistory });
    syncPresetButtonLabels();
  }

  function hasOwnKey(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clampProbability(value, fallback) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.min(1, Math.max(0, numeric));
  }

  function formatDecimal(value) {
    return clampProbability(value, 0).toFixed(2);
  }

  function formatRawValue(value) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return "0.00";
    }

    return numeric.toFixed(2);
  }

  function formatPercent(value) {
    return `${(Math.max(0, value) * 100).toFixed(1)}%`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toName(parts) {
    const slug = parts
      .filter(Boolean)
      .join(" ")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .replace(/ +/g, "_")
      .toLowerCase();

    return slug || "oc_prompt";
  }

  function showToast(title, body) {
    els.toastTitle.textContent = title;
    els.toastBody.textContent = body;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove("show");
    }, 1700);
  }

  async function copyToClipboard(text, mode) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast(
        t("toast.copiedTitle"),
        mode === "raw" ? t("toast.copiedRaw") : t("toast.copiedFormatted")
      );
    } catch (error) {
      showToast(t("toast.copyFailedTitle"), t("toast.copyFailedBody"));
    }
  }

  function setCopiedState(button, activeText, baseText) {
    const label = button.querySelector("span:last-child");

    if (!label) {
      return;
    }

    button.classList.add("copied");
    label.textContent = activeText;

    window.setTimeout(function () {
      button.classList.remove("copied");
      label.textContent = baseText;
    }, 1400);
  }

  function cloneSettingsFromPreset(presetKey) {
    const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET_KEY];

    return {
      bustWeights: Object.assign({}, preset.bustWeights),
      accessoryProbability: preset.accessoryProbability,
      includeBasePrompt: false,
      basePromptOverride: "",
      presetName: "",
    };
  }

  function sanitizeSettings(candidate) {
    const defaults = cloneSettingsFromPreset(DEFAULT_PRESET_KEY);
    const nextSettings = {
      bustWeights: {},
      accessoryProbability: clampProbability(
        candidate && candidate.accessoryProbability,
        defaults.accessoryProbability
      ),
      includeBasePrompt:
        candidate && hasOwnKey(candidate, "includeBasePrompt")
          ? Boolean(candidate.includeBasePrompt)
          : true,
      basePromptOverride:
        candidate && typeof candidate.basePromptOverride === "string"
          ? candidate.basePromptOverride
          : "",
      presetName:
        candidate && typeof candidate.presetName === "string"
          ? candidate.presetName.trim()
          : defaults.presetName,
    };

    BUST_KEYS.forEach(function (key) {
      nextSettings.bustWeights[key] = clampProbability(
        candidate && candidate.bustWeights && candidate.bustWeights[key],
        defaults.bustWeights[key]
      );
    });

    return nextSettings;
  }

  function loadStoredSettings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return cloneSettingsFromPreset(DEFAULT_PRESET_KEY);
      }

      return sanitizeSettings(JSON.parse(raw));
    } catch (error) {
      storageState.available = false;
      return cloneSettingsFromPreset(DEFAULT_PRESET_KEY);
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      storageState.available = true;
    } catch (error) {
      storageState.available = false;
    }
  }

  function getActivePresetKey() {
    return Object.keys(PRESETS).find(function (presetKey) {
      const preset = PRESETS[presetKey];

      if (
        Math.abs(settings.accessoryProbability - preset.accessoryProbability) > 0.0001
      ) {
        return false;
      }

      return BUST_KEYS.every(function (key) {
        return Math.abs(settings.bustWeights[key] - preset.bustWeights[key]) <= 0.0001;
      });
    }) || null;
  }

  function getBustDistribution() {
    const rawWeights = {};
    let rawSum = 0;

    BUST_KEYS.forEach(function (key) {
      rawWeights[key] = clampProbability(settings.bustWeights[key], 0);
      rawSum += rawWeights[key];
    });

    if (rawSum <= 0) {
      const fallback = PRESETS[DEFAULT_PRESET_KEY];
      const fallbackSum = BUST_KEYS.reduce(function (sum, key) {
        return sum + fallback.bustWeights[key];
      }, 0);
      const normalizedFallback = {};

      BUST_KEYS.forEach(function (key) {
        normalizedFallback[key] = fallback.bustWeights[key] / fallbackSum;
      });

      return {
        rawSum: 0,
        normalized: normalizedFallback,
        fallbackUsed: true,
      };
    }

    const normalized = {};

    BUST_KEYS.forEach(function (key) {
      normalized[key] = rawWeights[key] / rawSum;
    });

    return {
      rawSum: rawSum,
      normalized: normalized,
      fallbackUsed: false,
    };
  }

  function getAccessoryProbability() {
    return clampProbability(settings.accessoryProbability, PRESETS[DEFAULT_PRESET_KEY].accessoryProbability);
  }

  function getCurrentPresetName() {
    const text = String(settings.presetName || "").trim();
    if (text) {
      return text;
    }

    if (currentResult && currentResult.name) {
      return currentResult.name;
    }

    return "oc_settings";
  }

  function getComfyPresetLabelKey() {
    const activePresetKey = getActivePresetKey();
    const preset = PRESETS[activePresetKey] || PRESETS[DEFAULT_PRESET_KEY];
    return String(preset.label.en || preset.label.jp || "Balanced");
  }

  function getConfiguredBasePrompt() {
    const override = typeof settings.basePromptOverride === "string"
      ? settings.basePromptOverride.trim()
      : "";
    return override || promptData.basePrompt;
  }

  function getEffectiveBasePrompt() {
    return settings.includeBasePrompt ? getConfiguredBasePrompt() : "";
  }

  function clearCurrentResult() {
    currentResult = null;
    currentRaw = "";
    currentFmt = "";
    els.emptyState.hidden = false;
    els.tagRow.hidden = true;
    els.lockPanel.hidden = true;
    els.rawCard.hidden = true;
    els.fmtCard.hidden = true;
    els.copyRawBtn.disabled = true;
    els.copyFmtBtn.disabled = true;
    renderFixedState();
  }

  function getFixedSettingValue(categoryKey) {
    if (!hasOwnKey(fixedEntries, categoryKey)) {
      return "none";
    }

    const entry = fixedEntries[categoryKey];
    if (!entry || !entry.option) {
      return categoryKey === "accessory" ? "__none__" : "none";
    }

    return entry.option.label;
  }

  function buildSettingsJsonPayload() {
    return {
      base_prompt: getConfiguredBasePrompt(),
      include_base_prompt: Boolean(settings.includeBasePrompt),
      preset: getComfyPresetLabelKey(),
      fixed: {
        hair_style: getFixedSettingValue("hairStyle"),
        hair_color: getFixedSettingValue("hairColor"),
        eye_color: getFixedSettingValue("eyeColor"),
        accessory: getFixedSettingValue("accessory"),
        bust_size: getFixedSettingValue("bustSize"),
      },
      weights: Object.fromEntries(
        BUST_KEYS.map(function (key) {
          return [key, clampProbability(settings.bustWeights[key], 0)];
        })
      ),
      accessory_probability: getAccessoryProbability(),
      production_mode: true,
    };
  }

  function resolveCategoryOption(category, rawValue) {
    if (!category) {
      return null;
    }

    if (rawValue === "__none__") {
      return { forcedNone: true };
    }

    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    const candidate = String(rawValue).trim().toLowerCase();
    if (!candidate || candidate === "none" || candidate === "random") {
      return null;
    }

    return category.values.find(function (option) {
      return [option.label, option.key, option.prompt, option.name].some(function (value) {
        return String(value || "").trim().toLowerCase() === candidate;
      });
    }) || null;
  }

  function applyImportedFixedEntries(fixed) {
    Object.keys(fixedEntries).forEach(function (key) {
      delete fixedEntries[key];
    });

    Object.entries(FIXED_KEY_TO_CATEGORY_KEY).forEach(function (entry) {
      const fixedKey = entry[0];
      const categoryKey = entry[1];
      const category = categoryMap[categoryKey];
      const resolved = resolveCategoryOption(category, fixed && fixed[fixedKey]);

      if (!resolved) {
        return;
      }

      fixedEntries[categoryKey] = {
        category: category,
        option: resolved.forcedNone ? null : resolved,
      };
    });
  }

  function sanitizeImportedSettingsPayload(candidate) {
    const payload = candidate && typeof candidate === "object" && candidate.settings
      ? candidate.settings
      : candidate;
    const weights = payload && typeof payload === "object" ? payload.weights : null;

    return {
      basePrompt: payload && typeof payload.base_prompt === "string" ? payload.base_prompt : "",
      includeBasePrompt:
        payload && hasOwnKey(payload, "include_base_prompt")
          ? Boolean(payload.include_base_prompt)
          : Boolean(payload && payload.base_prompt),
      accessoryProbability: clampProbability(
        payload && payload.accessory_probability,
        PRESETS[DEFAULT_PRESET_KEY].accessoryProbability
      ),
      bustWeights: Object.fromEntries(
        BUST_KEYS.map(function (key) {
          return [
            key,
            clampProbability(weights && weights[key], PRESETS[DEFAULT_PRESET_KEY].bustWeights[key]),
          ];
        })
      ),
      fixed: payload && typeof payload.fixed === "object" ? payload.fixed : {},
    };
  }

  function applySettingsJsonPayload(candidate, options) {
    const imported = sanitizeImportedSettingsPayload(candidate);
    settings.bustWeights = Object.assign({}, imported.bustWeights);
    settings.accessoryProbability = imported.accessoryProbability;
    settings.includeBasePrompt = imported.includeBasePrompt;
    settings.basePromptOverride = imported.basePrompt && imported.basePrompt !== promptData.basePrompt
      ? imported.basePrompt
      : "";
    applyImportedFixedEntries(imported.fixed);
    saveSettings();
    renderSettingsUI({ syncInputs: true });
    clearCurrentResult();

    if (!(options && options.skipGenerate)) {
      generate();
    }
  }

  function buildSettingsDownloadName() {
    return `${getCurrentPresetName().replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "_") || "oc_settings"}.json`;
  }

  async function downloadSettingsJson() {
    const payload = `${JSON.stringify(buildSettingsJsonPayload(), null, 2)}\n`;
    const fileName = buildSettingsDownloadName();
    const blob = new Blob([payload], { type: "application/json" });

    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "JSON Files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast(t("toast.settingsExportedTitle"), t("toast.settingsExportedBody"));
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }
      }
    }

    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    showToast(t("toast.settingsExportedTitle"), t("toast.settingsExportedBody"));
  }

  function renderDistributionChart(element, items) {
    element.innerHTML = items
      .map(function (item) {
        return `
          <div class="chart-row">
            <div class="chart-label">${escapeHtml(item.label)}</div>
            <div class="chart-track">
              <div class="chart-fill ${escapeHtml(item.tone)}" style="--fill-width:${(item.value * 100).toFixed(3)}%"></div>
            </div>
            <div class="chart-value">${escapeHtml(formatPercent(item.value))}</div>
          </div>
        `;
      })
      .join("");
  }

  function getStatDescription(category) {
    if (category.key === "bustSize") {
      return t("stats.bust");
    }

    if (category.key === "accessory") {
      return t("stats.accessory", { value: formatPercent(getAccessoryProbability()) });
    }

    if (getTranslationValue(`stats.${category.key}`) !== `stats.${category.key}`) {
      return t(`stats.${category.key}`);
    }

    return category.description || t("common.activePool");
  }

  function renderStats(options) {
    const syncBasePrompt = Boolean(options && options.syncBasePrompt);

    els.statsGrid.innerHTML = promptData.categories
      .map(function (category) {
        return `
          <article class="stat-card">
            <div class="stat-label">${escapeHtml(getCategoryLabel(category.key))}</div>
            <div class="stat-value">${category.values.length}</div>
            <div class="stat-desc">${escapeHtml(getStatDescription(category))}</div>
          </article>
        `;
      })
      .join("");

    const configuredBasePrompt = getConfiguredBasePrompt();
    const hasOverride = configuredBasePrompt !== promptData.basePrompt;

    if (syncBasePrompt) {
      els.basePromptInput.value = settings.basePromptOverride || "";
      els.includeBasePromptInput.checked = Boolean(settings.includeBasePrompt);
    }

    els.basePromptInput.placeholder = promptData.basePrompt;
    els.basePromptStatus.textContent = hasOverride ? t("storage.custom") : t("storage.default");
    els.basePromptStatus.classList.toggle("is-active", hasOverride);
    els.resetBasePromptBtn.disabled = !hasOverride;
    els.settingsPresetNameInput.placeholder = currentResult && currentResult.name ? currentResult.name : "oc_settings";
  }

  function renderSettingsUI(options) {
    const syncInputs = Boolean(options && options.syncInputs);
    const activePresetKey = getActivePresetKey();
    const bustDistribution = getBustDistribution();
    const accessoryProbability = getAccessoryProbability();

    if (syncInputs) {
      BUST_KEYS.forEach(function (key) {
        if (els.bustInputs[key]) {
          els.bustInputs[key].value = formatDecimal(settings.bustWeights[key]);
        }

        if (els.bustRanges[key]) {
          els.bustRanges[key].value = formatDecimal(settings.bustWeights[key]);
        }
      });

      els.accessoryProbabilityInput.value = formatDecimal(accessoryProbability);
      els.accessoryProbabilityRange.value = formatDecimal(accessoryProbability);
      els.includeBasePromptInput.checked = Boolean(settings.includeBasePrompt);
      els.settingsPresetNameInput.value = settings.presetName || "";
    }

    els.presetButtons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.preset === activePresetKey);
    });

    els.advancedSummaryMeta.textContent = activePresetKey
      ? `${getPresetLabel(activePresetKey)}`
      : t("common.customProfile");

    els.bustRawSum.textContent = t("bust.rawSum", { value: formatRawValue(bustDistribution.rawSum) });
    els.accessoryRateBadge.textContent = `${formatPercent(accessoryProbability)} / ${formatPercent(1 - accessoryProbability)}`;
    els.accessoryDistributionNote.textContent = t("accessory.summary", {
      has: formatPercent(accessoryProbability),
      none: formatPercent(1 - accessoryProbability),
    });

    renderDistributionChart(
      els.bustDistribution,
      BUST_KEYS.map(function (key) {
        return {
          label: getBustLabel(key),
          value: bustDistribution.normalized[key],
          tone: "tone-bust",
        };
      })
    );

    renderDistributionChart(els.accessoryDistribution, [
      { label: t("chart.has"), value: accessoryProbability, tone: "tone-accessory" },
      { label: t("chart.none"), value: 1 - accessoryProbability, tone: "tone-none" },
    ]);

    els.bustFallbackBadge.textContent = bustDistribution.fallbackUsed
      ? t("bust.fallback", { label: getPresetLabel(DEFAULT_PRESET_KEY) })
      : t("bust.live");

    els.bustStatus.classList.toggle("is-danger", bustDistribution.fallbackUsed);
    els.bustStatus.textContent = bustDistribution.fallbackUsed
      ? t("bust.statusFallback", { label: getPresetLabel(DEFAULT_PRESET_KEY) })
      : t("bust.statusLive", { value: formatRawValue(bustDistribution.rawSum) });

    els.storageBadge.textContent = storageState.available ? t("storage.saved") : t("storage.unavailable");
    els.storageBadge.classList.toggle("is-warning", !storageState.available);

    els.settingsPreview.textContent = t("settingsPreview.text", {
      preset: activePresetKey ? getPresetLabel(activePresetKey) : t("settingsPreview.custom"),
      rawSum: formatRawValue(bustDistribution.rawSum),
      fallback: bustDistribution.fallbackUsed
        ? t("settingsPreview.fallbackSuffix")
        : t("settingsPreview.normalSuffix"),
      presence: formatPercent(accessoryProbability),
    });

    renderStats({ syncBasePrompt: true });
  }

  function normalizeTagType(type) {
    return /^[a-z0-9_-]+$/i.test(type) ? type : "default";
  }

  function getEntryLabel(entry) {
    if (!entry.option) {
      return entry.category.key === "accessory"
        ? t("tag.noAccessory")
        : entry.category.emptyLabel || t("chart.none");
    }

    return entry.option.label;
  }

  function getEntryTagType(entry) {
    return entry.option ? entry.category.tagType : "none";
  }

  function createTag(entry, options) {
    const interactive = Boolean(options && options.interactive);
    const fixed = Boolean(options && options.fixed);
    const classes = ["tag", normalizeTagType(getEntryTagType(entry))];
    const label = getEntryLabel(entry);

    if (!interactive) {
      return `<span class="${classes.join(" ")}">${escapeHtml(label)}</span>`;
    }

    if (fixed) {
      classes.push("is-fixed");
    }

    return `
      <button
        class="${classes.join(" ")} tag-toggle"
        type="button"
        data-tag-fix="${escapeHtml(entry.category.key)}"
        aria-pressed="${fixed ? "true" : "false"}"
        title="${fixed ? t("tag.titleFixed") : t("tag.titleFree")}"
      >
        <span class="tag-text">${escapeHtml(label)}</span>
        <span class="tag-lock-state">${fixed ? t("tag.fixed") : t("tag.tapToFix")}</span>
      </button>
    `;
  }

  function renderTags(entries, options) {
    return entries
      .map(function (entry) {
        return createTag(entry, {
          interactive: options && options.interactive,
          fixed: hasOwnKey(fixedEntries, entry.category.key),
        });
      })
      .join("");
  }

  function countFixedEntries() {
    return Object.keys(fixedEntries).length;
  }

  function renderFixedState() {
    const fixedCount = countFixedEntries();

    els.lockPanel.hidden = !currentResult;
    els.clearFixedBtn.disabled = fixedCount === 0;

    if (!currentResult) {
      return;
    }

    if (!fixedCount) {
      els.lockStatus.textContent = t("lock.idle");
      return;
    }

    els.lockStatus.textContent =
      fixedCount === 1
        ? t("lock.one")
        : t("lock.many", { count: fixedCount });
  }

  function cloneEntry(entry) {
    return {
      category: entry.category,
      option: entry.option
        ? {
            key: entry.option.key,
            prompt: entry.option.prompt,
            label: entry.option.label,
            name: entry.option.name,
          }
        : null,
    };
  }

  function cloneEntries(entries) {
    return entries.map(cloneEntry);
  }

  function createHistoryItem(result) {
    const historyItem = {
      id: historyIdCounter,
      pinned: false,
      entries: cloneEntries(result.entries),
      raw: result.raw,
      name: result.name,
      fmt: result.fmt,
    };

    historyIdCounter += 1;
    return historyItem;
  }

  function findHistoryItem(historyId) {
    return historyList.find(function (item) {
      return item.id === historyId;
    }) || null;
  }

  function getSortedHistoryItems() {
    return historyList.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return b.id - a.id;
    });
  }

  function trimHistoryList() {
    while (historyList.length > maxHistory) {
      let removalIndex = -1;
      let oldestId = Infinity;

      historyList.forEach(function (item, index) {
        if (!item.pinned && item.id < oldestId) {
          oldestId = item.id;
          removalIndex = index;
        }
      });

      if (removalIndex === -1) {
        historyList.forEach(function (item, index) {
          if (item.id < oldestId) {
            oldestId = item.id;
            removalIndex = index;
          }
        });
      }

      if (removalIndex === -1) {
        break;
      }

      historyList.splice(removalIndex, 1);
    }
  }

  function clearFixedEntries(options) {
    const silent = Boolean(options && options.silent);
    const hadFixedEntries = countFixedEntries() > 0;

    Object.keys(fixedEntries).forEach(function (key) {
      delete fixedEntries[key];
    });

    if (currentResult) {
      els.tagRow.innerHTML = renderTags(currentResult.entries, { interactive: true });
    }

    renderFixedState();

    if (!silent && hadFixedEntries) {
      showToast(t("toast.fixedClearedTitle"), t("toast.fixedClearedBody"));
    }
  }

  function toggleFixedEntry(categoryKey) {
    if (!currentResult) {
      return;
    }

    const currentEntry = currentResult.entries.find(function (entry) {
      return entry.category.key === categoryKey;
    });

    if (!currentEntry) {
      return;
    }

    if (hasOwnKey(fixedEntries, categoryKey)) {
      delete fixedEntries[categoryKey];
      showToast(
        t("toast.releasedTitle"),
        t("toast.releasedBody", { label: getCategoryLabel(currentEntry.category.key) })
      );
    } else {
      fixedEntries[categoryKey] = cloneEntry(currentEntry);
      showToast(
        t("toast.fixedTitle"),
        t("toast.fixedBody", { label: getCategoryLabel(currentEntry.category.key) })
      );
    }

    els.tagRow.innerHTML = renderTags(currentResult.entries, { interactive: true });
    renderFixedState();
  }

  function renderCurrentResult(result) {
    els.emptyState.hidden = true;
    els.tagRow.hidden = false;
    els.lockPanel.hidden = false;
    els.rawCard.hidden = false;
    els.fmtCard.hidden = false;

    currentResult = result;
    currentRaw = result.raw;
    currentFmt = result.fmt;

    els.tagRow.innerHTML = renderTags(result.entries, { interactive: true });
    els.rawOutput.textContent = currentRaw;
    els.rawLength.textContent = `${currentRaw.length} ${t("output.chars")}`;
    els.fmtOutput.innerHTML = [
      `<div class="syntax-line"><span class="key">name:</span> <span class="value">${escapeHtml(result.name)}</span></div>`,
      `<div class="syntax-line"><span class="key">positive:</span> <span class="value">${escapeHtml(result.raw)}</span></div>`,
      `<div class="syntax-line"><span class="key">negative:</span> <span class="value"></span></div>`,
      `<div class="syntax-line"><span class="value">----------</span></div>`,
    ].join("");

    els.copyRawBtn.disabled = false;
    els.copyFmtBtn.disabled = false;
    els.settingsPresetNameInput.placeholder = result.name || "oc_settings";
    renderFixedState();
  }

  function renderHistory() {
    if (!historyList.length) {
      els.historyList.innerHTML =
        `<div class="history-empty">${escapeHtml(t("history.empty", { count: maxHistory }))}</div>`;
      return;
    }

    els.historyList.innerHTML = getSortedHistoryItems()
      .map(function (item) {
        return `
          <article class="history-item${item.pinned ? " is-pinned" : ""}">
            <div class="history-item-top">
              <div class="history-item-name-row">
                <div class="history-item-name">${escapeHtml(item.name)}</div>
                ${item.pinned ? `<span class="history-pin-badge">${escapeHtml(t("history.pinnedLabel"))}</span>` : ""}
              </div>
              <div class="history-actions">
                <button class="icon-btn${item.pinned ? " is-active" : ""}" type="button" data-history-pin="${item.id}" aria-pressed="${item.pinned ? "true" : "false"}" title="${escapeHtml(item.pinned ? t("history.unpinTitle") : t("history.pinTitle"))}">
                  <span class="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M9 3h6l-1.5 5 3.5 3v1H13v8l-1-1-1 1v-8H7v-1l3.5-3L9 3Z"></path></svg>
                  </span>
                </button>
                <button class="icon-btn" type="button" data-history-copy="${item.id}" title="${escapeHtml(t("history.copyTitle"))}">
                  <span class="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M5 15V7a2 2 0 0 1 2-2h8"></path></svg>
                  </span>
                </button>
                <button class="icon-btn" type="button" data-history-load="${item.id}" title="${escapeHtml(t("history.loadTitle"))}">
                  <span class="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </span>
                </button>
              </div>
            </div>
            <div class="tag-row">
              ${renderTags(item.entries, { interactive: false })}
            </div>
            <div class="history-preview">${escapeHtml(item.raw)}</div>
          </article>
        `;
      })
      .join("");
  }

  function addHistory(item) {
    historyList.push(createHistoryItem(item));
    trimHistoryList();
    renderHistory();
  }

  function toggleHistoryPin(historyId) {
    const item = findHistoryItem(historyId);

    if (!item) {
      return;
    }

    item.pinned = !item.pinned;
    trimHistoryList();
    renderHistory();

    showToast(
      item.pinned ? t("toast.historyPinnedTitle") : t("toast.historyUnpinnedTitle"),
      item.pinned ? t("toast.historyPinnedBody") : t("toast.historyUnpinnedBody")
    );
  }

  function shouldIncludeGenericCategory(category) {
    return !category.optional || Math.random() < category.includeChance;
  }

  function buildBustEntry(category) {
    const distribution = getBustDistribution();
    const randomValue = Math.random();
    let cumulative = 0;
    let selectedOption = category.values[0] || null;

    for (let index = 0; index < BUST_KEYS.length; index += 1) {
      const key = BUST_KEYS[index];
      const option = bustOptionsByKey[key];

      if (!option) {
        continue;
      }

      cumulative += distribution.normalized[key];
      selectedOption = option;

      if (randomValue <= cumulative) {
        break;
      }
    }

    return {
      category: category,
      option: selectedOption,
    };
  }

  function buildAccessoryEntry(category) {
    const hasAccessory = Math.random() < getAccessoryProbability();

    if (!hasAccessory) {
      return {
        category: category,
        option: null,
      };
    }

    return {
      category: category,
      option: pick(category.values),
    };
  }

  function buildGenericEntry(category) {
    if (!shouldIncludeGenericCategory(category)) {
      return {
        category: category,
        option: null,
      };
    }

    return {
      category: category,
      option: pick(category.values),
    };
  }

  function buildEntry(category) {
    if (hasOwnKey(fixedEntries, category.key)) {
      return cloneEntry(fixedEntries[category.key]);
    }

    if (category.key === "bustSize" && bustCategory) {
      return buildBustEntry(category);
    }

    if (category.key === "accessory" && accessoryCategory) {
      return buildAccessoryEntry(category);
    }

    return buildGenericEntry(category);
  }

  function generate() {
    const effectiveBasePrompt = getEffectiveBasePrompt();

    if (!promptData.categories.length) {
      showToast(t("toast.missingDataTitle"), t("toast.missingDataBody"));
      return;
    }

    const entries = promptData.categories.map(buildEntry);
    const variableParts = entries
      .filter(function (entry) {
        return Boolean(entry.option);
      })
      .map(function (entry) {
        return entry.option.prompt;
      });
    const nameParts = entries
      .filter(function (entry) {
        return entry.option && entry.category.includeInName;
      })
      .map(function (entry) {
        return entry.option.name;
      });
    const raw = [effectiveBasePrompt].concat(variableParts).filter(Boolean).join(", ");
    const name = toName(nameParts);
    const fmt = `name: ${name}\npositive: ${raw}\nnegative: \n\n----------`;
    const result = {
      entries: entries,
      raw: raw,
      name: name,
      fmt: fmt,
    };

    renderCurrentResult(result);
    addHistory(result);
  }

  function clearHistory() {
    historyList.length = 0;
    renderHistory();
    showToast(t("toast.historyClearedTitle"), t("toast.historyClearedBody"));
  }

  function applyPreset(presetKey, options) {
    const silent = Boolean(options && options.silent);
    const preservedIncludeBasePrompt = settings.includeBasePrompt;
    const preservedBasePromptOverride = settings.basePromptOverride;
    settings = cloneSettingsFromPreset(presetKey);
    settings.includeBasePrompt = preservedIncludeBasePrompt;
    settings.basePromptOverride = preservedBasePromptOverride;
    saveSettings();
    renderSettingsUI({ syncInputs: true });

    if (!silent) {
      showToast(
        t("toast.presetAppliedTitle"),
        t("toast.presetAppliedBody", { label: getPresetLabel(presetKey) })
      );
    }
  }

  function handleBustInput(key, rawValue, options) {
    settings.bustWeights[key] = clampProbability(rawValue, 0);
    saveSettings();
    renderSettingsUI({ syncInputs: Boolean(options && options.syncInputs) });
  }

  function handleAccessoryInput(rawValue, options) {
    settings.accessoryProbability = clampProbability(rawValue, 0);
    saveSettings();
    renderSettingsUI({ syncInputs: Boolean(options && options.syncInputs) });
  }

  function handleBasePromptInput(rawValue) {
    settings.basePromptOverride = typeof rawValue === "string" ? rawValue : "";
    saveSettings();
    renderStats();
  }

  function handleIncludeBasePromptInput(checked) {
    settings.includeBasePrompt = Boolean(checked);
    saveSettings();
    renderStats({ syncBasePrompt: true });
  }

  function handlePresetNameInput(rawValue) {
    settings.presetName = typeof rawValue === "string" ? rawValue.trim() : "";
    saveSettings();
    renderStats();
  }

  function resetBasePromptOverride() {
    settings.basePromptOverride = "";
    saveSettings();
    renderStats({ syncBasePrompt: true });
  }

  function focusDirectInput(inputId) {
    const target = document.getElementById(inputId);

    if (!target) {
      return;
    }

    target.focus();
    target.select();
  }

  function applyLanguage(nextLanguage) {
    currentLanguage = nextLanguage === "en" ? "en" : "jp";
    saveLanguage();
    applyStaticTranslations();
    renderSettingsUI({ syncInputs: true });
    renderHistory();

    if (currentResult) {
      renderCurrentResult(currentResult);
    } else {
      renderFixedState();
    }
  }

  els.generateBtn.addEventListener("click", generate);
  els.langJaBtn.addEventListener("click", function () {
    applyLanguage("jp");
  });
  els.langEnBtn.addEventListener("click", function () {
    applyLanguage("en");
  });

  els.copyRawBtn.addEventListener("click", async function () {
    await copyToClipboard(currentRaw, "raw");
    setCopiedState(els.copyRawBtn, t("common.copied"), t("button.copyRaw"));
  });

  els.copyFmtBtn.addEventListener("click", async function () {
    await copyToClipboard(currentFmt, "fmt");
    setCopiedState(els.copyFmtBtn, t("common.copied"), t("button.copyFormatted"));
  });

  els.clearHistoryBtn.addEventListener("click", clearHistory);
  els.clearFixedBtn.addEventListener("click", function () {
    clearFixedEntries();
  });

  els.tagRow.addEventListener("click", function (event) {
    const tagButton = event.target.closest("[data-tag-fix]");

    if (!tagButton) {
      return;
    }

    toggleFixedEntry(tagButton.dataset.tagFix);
  });

  els.historyList.addEventListener("click", async function (event) {
    const pinButton = event.target.closest("[data-history-pin]");
    const copyButton = event.target.closest("[data-history-copy]");
    const loadButton = event.target.closest("[data-history-load]");

    if (pinButton) {
      const historyId = Number(pinButton.dataset.historyPin);
      toggleHistoryPin(historyId);
      return;
    }

    if (copyButton) {
      const historyId = Number(copyButton.dataset.historyCopy);
      const item = findHistoryItem(historyId);

      if (item) {
        await copyToClipboard(item.fmt, "fmt");
      }

      return;
    }

    if (loadButton) {
      const historyId = Number(loadButton.dataset.historyLoad);
      const item = findHistoryItem(historyId);

      if (item) {
        clearFixedEntries({ silent: true });
        renderCurrentResult(item);
        showToast(t("toast.loadedTitle"), t("toast.loadedBody"));
      }
    }
  });

  els.presetButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyPreset(button.dataset.preset);
    });
  });

  els.resetSettingsBtn.addEventListener("click", function () {
    applyPreset(DEFAULT_PRESET_KEY, { silent: true });
    showToast(
      t("toast.settingsResetTitle"),
      t("toast.settingsResetBody", { label: getPresetLabel(DEFAULT_PRESET_KEY) })
    );
  });

  BUST_KEYS.forEach(function (key) {
    const input = els.bustInputs[key];
    const range = els.bustRanges[key];

    input.addEventListener("input", function () {
      range.value = formatDecimal(input.value);
      handleBustInput(key, input.value);
    });

    input.addEventListener("change", function () {
      handleBustInput(key, input.value, { syncInputs: true });
    });

    input.addEventListener("blur", function () {
      handleBustInput(key, input.value, { syncInputs: true });
    });

    range.addEventListener("input", function () {
      handleBustInput(key, range.value, { syncInputs: true });
    });
  });

  els.accessoryProbabilityInput.addEventListener("input", function () {
    els.accessoryProbabilityRange.value = formatDecimal(els.accessoryProbabilityInput.value);
    handleAccessoryInput(els.accessoryProbabilityInput.value);
  });

  els.accessoryProbabilityInput.addEventListener("change", function () {
    handleAccessoryInput(els.accessoryProbabilityInput.value, { syncInputs: true });
  });

  els.accessoryProbabilityInput.addEventListener("blur", function () {
    handleAccessoryInput(els.accessoryProbabilityInput.value, { syncInputs: true });
  });

  els.accessoryProbabilityRange.addEventListener("input", function () {
    handleAccessoryInput(els.accessoryProbabilityRange.value, { syncInputs: true });
  });

  els.basePromptInput.addEventListener("input", function () {
    handleBasePromptInput(els.basePromptInput.value);
  });

  els.includeBasePromptInput.addEventListener("change", function () {
    handleIncludeBasePromptInput(els.includeBasePromptInput.checked);
  });

  els.resetBasePromptBtn.addEventListener("click", function () {
    resetBasePromptOverride();
  });

  els.settingsPresetNameInput.addEventListener("input", function () {
    handlePresetNameInput(els.settingsPresetNameInput.value);
  });

  els.exportSettingsJsonBtn.addEventListener("click", downloadSettingsJson);

  els.importSettingsJsonBtn.addEventListener("click", function () {
    els.importSettingsJsonInput.click();
  });

  els.importSettingsJsonInput.addEventListener("change", async function () {
    const file = els.importSettingsJsonInput.files && els.importSettingsJsonInput.files[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      settings.presetName = file.name.replace(/\.json$/i, "");
      applySettingsJsonPayload(JSON.parse(text));
      showToast(t("toast.settingsImportedTitle"), t("toast.settingsImportedBody"));
    } catch (error) {
      showToast(t("toast.settingsImportFailedTitle"), t("toast.settingsImportFailedBody"));
    } finally {
      els.importSettingsJsonInput.value = "";
    }
  });

  els.directEditTriggers.forEach(function (trigger) {
    trigger.addEventListener("dblclick", function () {
      focusDirectInput(trigger.dataset.directEdit);
    });
  });

  window.addEventListener("keydown", function (event) {
    const active = document.activeElement;
    const tagName = active && active.tagName;

    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "BUTTON" || tagName === "SUMMARY") {
      return;
    }

    if (event.key === "Enter" || event.code === "Space") {
      event.preventDefault();
      generate();
    }
  });

  if (!promptData.basePrompt || !promptData.categories.length) {
    els.generateBtn.disabled = true;
  }

  applyStaticTranslations();
  renderSettingsUI({ syncInputs: true });
  renderHistory();
});

