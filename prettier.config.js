/** @type {import('prettier').Config} */
const config = {
  tabWidth: 2,
  useTabs: false,
  importOrder: [
    "^@core/(.*)$",
    "^@server/(.*)$",
    "^@ui/(.*)$",
    "~/server/(.*)$",
    "~/apps/(.*)$",
    "~/pages/(.*)$",
    "~/components/ui/(.*)$",
    "~/(.*)",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderCaseInsensitive: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};

export default config;
