import type { Locale, Messages } from "./types";
import { fr } from "./messages/fr";
import { en } from "./messages/en";
import { ln } from "./messages/ln";

export const messages: Record<Locale, Messages> = { fr, en, ln };
export type { Locale, Messages };
