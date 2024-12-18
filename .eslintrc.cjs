/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint", "drizzle"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  rules: {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "drizzle/enforce-delete-with-where": [
      "error",
      {
        drizzleObjectName: ["db", "ctx.db"],
      },
    ],
    "drizzle/enforce-update-with-where": [
      "error",
      {
        drizzleObjectName: ["db", "ctx.db"],
      },
    ],

    /*
      Matty has disabled this because he was trying to use useOnClickOutside
      from usehooks-ts but I think the library isn't typed correctly and so it
      triggers this.

      I don't think it's super useful anyway?
    */
    "@typescript-eslint/no-unsafe-call": "off",

    /*
      Matty has disabled this bc kinda unnecessary.
    */
    "@typescript-eslint/no-empty-function": "off",

    /*
      Matty has disabled these bc of a skill issue.
    */
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-return": "off",

    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-redundant-type-constituents": "off",

    /*
      Matty has disabled this because he tried but its kind of annoying
      but probably a skill issue.
    */
    "@typescript-eslint/prefer-nullish-coalescing": "off",
  },
};
module.exports = config;
