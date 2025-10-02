"use client";

import { useEffect } from "react";

export function AxeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      import("@axe-core/react")
        .then(async (axe) => {
          const React = await import("react");
          const ReactDOM = await import("react-dom");
          axe.default(React, ReactDOM, 1000);
          // eslint-disable-next-line no-console
          console.log("🔍 axe-core initialized for accessibility testing");
        })
        .catch((error) => {
          console.warn("Failed to load axe-core:", error);
        });
    }
  }, []);

  return <>{children}</>;
}
