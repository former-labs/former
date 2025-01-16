import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

export default {
  packagerConfig: {
    name: "Former",
    executableName: "Former",
    appBundleId: "com.formerlabs.app",
    icon: "resources/icon",
    asar: true,
    protocols: [
      {
        name: "Former Custom Protocol",
        schemes: ["former"],
      },
    ],
    ignore: [
      /^\/src/,
      /^\/node_modules\/(pg|postgres|@google-cloud\/bigquery)\/build\/Release/,
    ],
    osxSign: {},
    osxNotarize: {
      keychainProfile: "FormerLabs-Keychain-Profile",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
    },
    // {
    //   name: "@electron-forge/maker-zip",
    //   platforms: ["darwin"],
    // },
    {
      name: "@electron-forge/maker-dmg",
      config: {},
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
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
