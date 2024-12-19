/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: "com.yerve.yerve",
  productName: "Yerve",
  directories: {
    output: "release/${version}",
    buildResources: "resources",
  },
  extraMetadata: {
    main: "dist/electron/main.js",
  },
  files: ["dist/electron/**/*", "node_modules/**/*"],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
  },
  mac: {
    category: "public.app-category.developer-tools",
    target: ["dmg"],
  },
  linux: {
    target: ["AppImage"],
    category: "Development",
  },
};
