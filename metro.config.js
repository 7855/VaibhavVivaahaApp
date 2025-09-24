const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Allow JSX and SVG imports
config.resolver.sourceExts = [...config.resolver.sourceExts, "jsx", "svg"];
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);

// Extra module mapping for Expo / Gluestack
config.resolver.extraNodeModules = {
  "expo-linear-gradient": require.resolve("expo-linear-gradient"),
  "@expo/html-elements": require.resolve("@expo/html-elements"),
  "@gluestack-ui/actionsheet": require.resolve(
    "@gluestack-ui/actionsheet/lib/index.jsx"
  ),
  "@gluestack-ui/icon": require.resolve("@gluestack-ui/icon/lib/index.jsx"),
};

module.exports = withNativeWind(config, { input: "./app/globals.css" });
