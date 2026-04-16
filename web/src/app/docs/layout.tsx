import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              letterSpacing: "0.15em",
              fontSize: "1rem",
            }}
          >
            RITARENA
          </span>
        ),
        url: "/",
      }}
    >
      {children}
    </DocsLayout>
  );
}
