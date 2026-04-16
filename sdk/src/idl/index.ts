import type { Idl } from "@coral-xyz/anchor";
import idlJson from "./ritarena.json";

export const IDL = idlJson as Idl;
export type RitarenaIDL = typeof idlJson;
