import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "./App.tsx";
import "./index.css";
import "./CodeEditor.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider withGlobalStyles withNormalizeCSS>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </MantineProvider>
);
