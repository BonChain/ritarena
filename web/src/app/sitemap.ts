import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ritarena.com";

  // Landing pages
  const landingPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/arena`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/creators`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/developers`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  // Docs pages
  const docsSlugs = [
    "",
    "/installation",
    "/glossary",
    "/quick-start",
    "/quick-start/game-builders",
    "/quick-start/bot-builders",
    "/quick-start/bot-api",
    "/quick-start/viewers",
    "/quick-start/game-servers",
    "/snake-game",
    "/snake-game/rules",
    "/snake-game/protocol",
    "/snake-game/starter-bot",
    "/api-reference",
    "/api-reference/constructors",
    "/api-reference/write-methods",
    "/api-reference/read-methods",
    "/api-reference/pda-helpers",
    "/api-reference/game-server",
    "/api-reference/types",
    "/concepts",
    "/concepts/arena-lifecycle",
    "/concepts/fee-math",
    "/concepts/merkle-verification",
    "/concepts/error-handling",
    "/cookbook",
    "/examples",
    "/troubleshooting",
    "/changelog",
  ];

  const docsPages = docsSlugs.map((slug) => ({
    url: `${baseUrl}/docs${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: slug === "" ? 0.9 : 0.7,
  }));

  return [...landingPages, ...docsPages];
}
