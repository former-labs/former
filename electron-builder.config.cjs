/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: "com.yerve.app",
  productName: "Verve",
  directories: {
    output: "release/${version}",
    buildResources: "resources",
  },
  extraMetadata: {
    main: "dist/electron/main.js",
  },
  files: ["dist/electron/**/*", "node_modules/**/*"],
  win: {
    icon: "resources/icon.ico",
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
      {
        target: "zip",
        arch: ["x64"],
      },
    ],
  },
  mac: {
    icon: "resources/icon.icns",
    target: ["dmg"],
    category: "public.app-category.developer-tools",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
    identity: "Verve Health, Inc. (RD8795GGW8)",
    timestamp: "http://timestamp.apple.com/ts01",
    notarize: {
      teamId: "RD8795GGW8",
    },
  },
  linux: {
    icon: "resources/icon.png",
    target: ["AppImage", "deb", "rpm"],
    category: "Development",
  },
};
