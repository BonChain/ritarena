"use client";

// Mermaid diagram component for MDX docs.
// Security note: chart strings are hardcoded in MDX files (not user input).
// Mermaid's securityLevel: "strict" sanitizes SVG output internally.

import { useEffect, useId, useRef, useState } from "react";

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <MermaidRenderer chart={chart} />;
}

function MermaidRenderer({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        fontFamily: "inherit",
        theme: "dark",
        themeVariables: {
          primaryColor: "#14F195",
          primaryTextColor: "#0a0a0f",
          primaryBorderColor: "#14F195",
          lineColor: "#555",
          secondaryColor: "#9945FF",
          tertiaryColor: "#1a1a2e",
          background: "#0a0a0f",
          mainBkg: "#1a1a2e",
          nodeBorder: "#14F195",
          clusterBkg: "#0d0d18",
          titleColor: "#f0f0f0",
          edgeLabelBackground: "#0a0a0f",
        },
      });

      mermaid
        .render(`mermaid-${id}`, chart.replaceAll("\\n", "\n"))
        .then(({ svg }) => {
          if (!cancelled && containerRef.current) {
            // Mermaid sanitizes SVG internally with securityLevel: "strict"
            containerRef.current.replaceChildren();
            const template = document.createElement("template");
            template.innerHTML = svg;
            containerRef.current.appendChild(template.content);
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      style={{ margin: "1.5rem 0", textAlign: "center" }}
    />
  );
}
