import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      "base64-js",
      "@react-pdf/renderer",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip"
    ],
    force: true,
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          const modulePath = id.split("node_modules/")[1] || "";
          const parts = modulePath.split("/");
          const pkg = parts[0]?.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];

          if (!pkg) return;

          if (pkg === "@react-pdf/renderer") return "react-pdf";
          if (pkg === "react" || pkg === "react-dom" || pkg === "scheduler") return "react-core";
          if (pkg === "react-router" || pkg === "react-router-dom") return "router";
          if (pkg === "@tanstack/react-query") return "query";
          if (pkg === "recharts" || pkg.startsWith("d3-")) return "charts";
          if (pkg === "framer-motion") return "motion";
          if (pkg.startsWith("@radix-ui/")) return "radix";
        },
      },
    },
  },
})
