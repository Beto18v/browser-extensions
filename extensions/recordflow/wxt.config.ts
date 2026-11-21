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
    name: "RecordFlow — Screen & Camera Recorder",
    description:
      "Free, unlimited, local-first screen and circular webcam recording. No time limits, no 25-video caps, 100% private.",
    version: "1.0.0",
    permissions: ["storage", "activeTab", "tabs"],
    action: {
      default_title: "RecordFlow",
    },
    icons: {
      16: "icon-16.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
  },
});
