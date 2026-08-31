const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const projectPathPattern = (directories) =>
  new RegExp(
    `^(?:${directories
      .map((directory) =>
        path.resolve(__dirname, directory).split(path.sep).map(escapeRegExp).join("[\\\\/]"),
      )
      .join("|")})(?:[\\\\/]|$)`,
  );

const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];

// File Provider can evict generated output while leaving placeholder metadata. Metro
// must not crawl those caches and wait for macOS to hydrate thousands of irrelevant
// files. Absolute paths keep this valid for both Watchman and Node-based crawling.
config.resolver.blockList = [
  ...defaultBlockList,
  projectPathPattern([".build", "DerivedData", ".expo", "dist", "coverage"]),
];

module.exports = config;
