// expo-sqlite를 웹에서 쓰려면 wasm 파일을 에셋으로 번들해야 한다(공식 문서).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("wasm");

module.exports = config;
