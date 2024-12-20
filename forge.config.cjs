module.exports = {
  packagerConfig: {
    name: "Yerve",
    executableName: "yerve",
    appBundleId: "com.yerve.app",
    icon: "resources/icon",
    asar: true,
    osxSign: {
      optionsForFile: () => {
        return {
          entitlements: "build/entitlements.mac.plist",
        };
      },
    },
    osxNotarize: {
      keychainProfile: "Yerve-Keychain-Profile",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
