import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react";
import { ThemeProvider } from "./components/theme-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RadixDirectionProvider dir="rtl">
      <BaseDirectionProvider direction="rtl">
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </BaseDirectionProvider>
    </RadixDirectionProvider>
  </StrictMode>,
);
