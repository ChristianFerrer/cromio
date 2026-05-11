import type { Sticker, StickerPosition } from "../types";
import { COUNTRIES } from "./countries";

const POSITIONS: StickerPosition[] = ["GK", "DEF", "MID", "FWD"];

// Intros (n=1..20). Matches the real Panini 2026 album:
//   - 1 album cover ("00")
//   - 5 generic foils (Emblem ×2, Mascots, Slogan, Trionda)  → FWC1..FWC5
//   - 3 host-country cards (CAN, MEX, USA)                   → FWC6/7/8
//   - 11 FIFA Museum past-champions                          → FWC9..FWC19
// Every entry has its `n` pinned explicitly so the country block below
// can never be silently renumbered if someone tweaks this list.
const INTRO_STICKERS: Sticker[] = [
  { n:  1, code: "00",    team_code: null,  type: "foil_intro", player_name: "Album Cover",    position: null, city: null, rarity: "legendary" },
  { n:  2, code: "FWC1",  team_code: null,  type: "foil_intro", player_name: "Official Emblem", position: null, city: null, rarity: "legendary" },
  { n:  3, code: "FWC2",  team_code: null,  type: "foil_intro", player_name: "Official Emblem", position: null, city: null, rarity: "special"   },
  { n:  4, code: "FWC3",  team_code: null,  type: "foil_intro", player_name: "Mascots",         position: null, city: null, rarity: "legendary" },
  { n:  5, code: "FWC4",  team_code: null,  type: "foil_intro", player_name: "Official Slogan", position: null, city: null, rarity: "special"   },
  { n:  6, code: "FWC5",  team_code: null,  type: "foil_intro", player_name: "Trionda",         position: null, city: null, rarity: "legendary" },
  { n:  7, code: "FWC6",  team_code: "CAN", type: "host_city",  player_name: "Canada",          position: null, city: null, rarity: "special"   },
  { n:  8, code: "FWC7",  team_code: "MEX", type: "host_city",  player_name: "Mexico",          position: null, city: null, rarity: "special"   },
  { n:  9, code: "FWC8",  team_code: "USA", type: "host_city",  player_name: "USA",             position: null, city: null, rarity: "special"   },
  { n: 10, code: "FWC9",  team_code: null,  type: "foil_intro", player_name: "Italy 1934",      position: null, city: null, rarity: "common"    },
  { n: 11, code: "FWC10", team_code: null,  type: "foil_intro", player_name: "Uruguay 1950",    position: null, city: null, rarity: "common"    },
  { n: 12, code: "FWC11", team_code: null,  type: "foil_intro", player_name: "West Germany 1954", position: null, city: null, rarity: "common"  },
  { n: 13, code: "FWC12", team_code: null,  type: "foil_intro", player_name: "Brazil 1962",     position: null, city: null, rarity: "common"    },
  { n: 14, code: "FWC13", team_code: null,  type: "foil_intro", player_name: "West Germany 1974", position: null, city: null, rarity: "common"  },
  { n: 15, code: "FWC14", team_code: null,  type: "foil_intro", player_name: "Argentina 1986",  position: null, city: null, rarity: "common"    },
  { n: 16, code: "FWC15", team_code: null,  type: "foil_intro", player_name: "Brazil 1994",     position: null, city: null, rarity: "common"    },
  { n: 17, code: "FWC16", team_code: null,  type: "foil_intro", player_name: "Brazil 2002",     position: null, city: null, rarity: "common"    },
  { n: 18, code: "FWC17", team_code: null,  type: "foil_intro", player_name: "Italy 2006",      position: null, city: null, rarity: "common"    },
  { n: 19, code: "FWC18", team_code: null,  type: "foil_intro", player_name: "Germany 2014",    position: null, city: null, rarity: "common"    },
  { n: 20, code: "FWC19", team_code: null,  type: "foil_intro", player_name: "Argentina 2022",  position: null, city: null, rarity: "common"    },
];

// Country block starts at this fixed offset. Locking it here means a
// later intro tweak can't shift the 960 country stickers downstream
// (which would corrupt every user_stickers / user_wishlist row).
const COUNTRY_BASE_N = 21;
const STICKERS_PER_COUNTRY = 20;

function buildStickerSet(): Sticker[] {
  const out: Sticker[] = [...INTRO_STICKERS];

  const sorted = [...COUNTRIES].sort((a, b) => a.code.localeCompare(b.code));
  sorted.forEach((country, idx) => {
    const base = COUNTRY_BASE_N + idx * STICKERS_PER_COUNTRY;
    out.push({
      n: base,
      code: `${country.code}1`,
      team_code: country.code,
      type: "team_badge",
      player_name: null,
      position: null,
      city: null,
      rarity: "special",
    });
    out.push({
      n: base + 1,
      code: `${country.code}2`,
      team_code: country.code,
      type: "team_photo",
      player_name: null,
      position: null,
      city: null,
      rarity: "special",
    });
    for (let i = 3; i <= 20; i++) {
      out.push({
        n: base + i - 1,
        code: `${country.code}${i}`,
        team_code: country.code,
        type: "player",
        player_name: null,
        position: POSITIONS[i % POSITIONS.length],
        city: null,
        rarity: i === 20 ? "legendary" : "common",
      });
    }
  });

  return out;
}

export const STICKERS: Sticker[] = buildStickerSet();
export const TOTAL_STICKERS = STICKERS.length;
export const STICKERS_BY_N: Map<number, Sticker> = new Map(STICKERS.map((s) => [s.n, s]));
