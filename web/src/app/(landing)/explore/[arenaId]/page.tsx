"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ArenaDetail from "@/components/explore/ArenaDetail";

export default function ExploreArenaPage({
  params,
}: {
  params: Promise<{ arenaId: string }>;
}) {
  const { arenaId } = use(params);
  const id = Number(arenaId);
  if (!Number.isInteger(id) || id < 0) notFound();
  return <ArenaDetail arenaId={id} />;
}
