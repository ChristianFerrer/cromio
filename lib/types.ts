export type FlagDirection = "h" | "v" | "d" | "cross" | "solid";

export interface Country {
  code: string;
  name: string;
  short: string;
  flag: {
    dir: FlagDirection;
    colors: string[];
    dot?: string;
  };
}

export type StickerCategory = "team" | "stadium" | "intro";
export type StickerType =
  | "foil_intro"
  | "team_badge"
  | "team_photo"
  | "player"
  | "host_city";
export type StickerRarity = "common" | "special" | "legendary";
export type StickerPosition = "GK" | "DEF" | "MID" | "FWD" | "COACH";

export interface Sticker {
  n: number;
  code: string;
  team_code: string | null;
  type: StickerType;
  player_name: string | null;
  position: StickerPosition | null;
  city: string | null;
  rarity: StickerRarity;
}

export interface CollectionEntry extends Sticker {
  count: number;
}

export interface MockUser {
  id: string;
  alias: string;
  color: string;
  distM: number;
  rating: number;
  trades: number;
  pro: boolean;
  bio: string;
  online: boolean;
  position: { x: number; y: number };
}

export type MatchKind = "match" | "lead";

export interface MatchResult {
  youGet: CollectionEntry[];
  theyGet: CollectionEntry[];
}
