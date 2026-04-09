(function () {
  const BUST_KEYS = ["flat", "small", "medium", "large", "xlarge"];
  const state = {
    basePrompt: "",
    config: {
      maxHistory: 8,
      mode: "production",
      defaultPresetKey: "balanced",
      presets: {},
    },
    categories: [],
  };

  function clampChance(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 1;
    }
    return Math.min(1, Math.max(0, numeric));
  }

  function normalizeOption(option) {
    if (typeof option === "string") {
      return {
        key: option,
        prompt: option,
        label: option,
        name: option,
        developmentOnly: false,
      };
    }

    const key = option.key || option.id || option.name || option.label || option.value || option.prompt || "";
    const prompt = option.prompt || option.value || option.label || "";
    const label = option.label || prompt;
    const name = option.name || prompt;

    return {
      key: String(key),
      prompt: String(prompt),
      label: String(label),
      name: String(name),
      developmentOnly: Boolean(option.developmentOnly),
    };
  }

  function normalizePreset(preset) {
    const label = preset && typeof preset.label === "object" ? preset.label : {};
    const bustWeights = {};

    BUST_KEYS.forEach(function (key) {
      bustWeights[key] = clampChance(preset && preset.bustWeights && preset.bustWeights[key]);
    });

    return {
      label: {
        jp: String(label.jp || label.ja || label.en || ""),
        en: String(label.en || label.jp || label.ja || ""),
      },
      bustWeights: bustWeights,
      accessoryProbability: clampChance(preset && preset.accessoryProbability),
    };
  }

  function normalizePresetMap(presets) {
    const nextPresets = {};

    Object.entries(presets || {}).forEach(function (entry) {
      nextPresets[String(entry[0])] = normalizePreset(entry[1]);
    });

    return nextPresets;
  }

  function normalizeCategory(category) {
    return {
      key: String(category.key || `category_${state.categories.length + 1}`),
      label: String(category.label || category.key || "Category"),
      tagType: String(category.tagType || "default"),
      description: String(category.description || ""),
      optional: Boolean(category.optional),
      includeChance: clampChance(category.includeChance),
      emptyLabel: String(category.emptyLabel || "none"),
      includeInName: category.includeInName !== false,
      developmentOnly: Boolean(category.developmentOnly),
      values: Array.isArray(category.values) ? category.values.map(normalizeOption) : [],
    };
  }

  function isAvailable(entry) {
    if (state.config.mode !== "production") {
      return true;
    }
    return !entry.developmentOnly;
  }

  window.OCGeneratorData = {
    configure: function (partialConfig) {
      const nextConfig = Object.assign({}, partialConfig || {});

      if (Object.prototype.hasOwnProperty.call(nextConfig, "presets")) {
        state.config.presets = normalizePresetMap(nextConfig.presets);
        delete nextConfig.presets;
      }

      if (Object.prototype.hasOwnProperty.call(nextConfig, "defaultPresetKey")) {
        state.config.defaultPresetKey = String(nextConfig.defaultPresetKey || "balanced");
        delete nextConfig.defaultPresetKey;
      }

      Object.assign(state.config, nextConfig);
    },
    setBasePrompt: function (basePrompt) {
      state.basePrompt = String(basePrompt || "").trim();
    },
    registerCategory: function (category) {
      state.categories.push(normalizeCategory(category));
    },
    getSnapshot: function () {
      return {
        basePrompt: state.basePrompt,
        config: {
          maxHistory: Number(state.config.maxHistory) || 8,
          mode: state.config.mode,
          defaultPresetKey: state.config.defaultPresetKey,
          presets: Object.fromEntries(
            Object.entries(state.config.presets).map(function (entry) {
              return [
                entry[0],
                {
                  label: {
                    jp: entry[1].label.jp,
                    en: entry[1].label.en,
                  },
                  bustWeights: Object.assign({}, entry[1].bustWeights),
                  accessoryProbability: entry[1].accessoryProbability,
                },
              ];
            })
          ),
        },
        categories: state.categories
          .filter(isAvailable)
          .map(function (category) {
            return {
              key: category.key,
              label: category.label,
              tagType: category.tagType,
              description: category.description,
              optional: category.optional,
              includeChance: category.includeChance,
              emptyLabel: category.emptyLabel,
              includeInName: category.includeInName,
              values: category.values.filter(isAvailable).map(function (option) {
                return {
                  key: option.key,
                  prompt: option.prompt,
                  label: option.label,
                  name: option.name,
                };
              }),
            };
          })
          .filter(function (category) {
            return category.values.length > 0;
          }),
      };
    },
  };
})();
