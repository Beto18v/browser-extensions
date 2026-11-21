import { defineConfig } from "wxt";
import path from "node:path";

export default defineConfig({
  alias: {
    "@shared": path.resolve(__dirname, "../../shared"),
  },
  vite: () => ({
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "../../shared"),
      },
    },
  }),
  manifest: {
    name: "__MSG_appName__",
    default_locale: "en",
    description: "__MSG_appDesc__",
    version: "2.1.0",
    permissions: ["activeTab", "tabs", "sidePanel"],
    host_permissions: [
      "https://docs.google.com/*",
      "https://*.googleusercontent.com/*",
      "https://*.wikipedia.org/*",
      "https://api.openalex.org/*",
    ],
    action: {
      default_title: "Open DocGuard",
    },
    icons: {
      16: "icons/icon-16.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
});
