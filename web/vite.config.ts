import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/exile-leveling/",
  build: {
    manifest: true,
    sourcemap: false,
  },
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PoE Tools",
        short_name: "PoE Tools",
        description:
          "Path of Exile leveling, build and regex tools / Прокачка, билды и regex-инструменты для Path of Exile",
        theme_color: "#222222",
        background_color: "#171717",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
