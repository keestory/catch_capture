const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      ".build/**",
      ".expo/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "CatchCapture/**",
      "CatchCaptureTests/**",
      "CatchCaptureUITests/**",
    ],
  },
]);
