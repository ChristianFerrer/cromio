import type { Sticker, StickerPosition } from "../types";
import { COUNTRIES } from "./countries";

const POSITIONS: StickerPosition[] = ["GK", "DEF", "MID", "FWD"];

const INTRO_STICKERS: Omit<Sticker, "n">[] = [
  { code: "00",    team_code: null,  type: "foil_intro", player_name: "Album Cover",          position: null, city: null, rarity: "legendary" },
  { code: "FWC1",  team_code: null,  type: "foil_intro", player_name: "Official Emblem",       position: null, city: null, rarity: "legendary" },
  { code: "FWC2",  team_code: null,  type: "foil_intro", player_name: "Official Emblem",       position: null, city: null, rarity: "special"   },
  { code: "FWC3",  team_code: null,  type: "foil_intro", player_name: "Mascots",                position: null, city: null, rarity: "legendary" },
  { code: "FWC4",  team_code: null,  type: "foil_intro", player_name: "Official Slogan",        position: null, city: null, rarity: "special"   },
  { code: "FWC5",  team_code: null,  type: "foil_intro", player_name: "Trionda",                 position: null, city: null, rarity: "legendary" },
  { code: "FWC6",  team_code: "CAN", type: "host_city",  player_name: "Canada",                  position: null, city: "Toronto / Vancouver",  rarity: "special"   },
  { code: "FWC7",  team_code: "MEX", type: "host_city",  player_name: "Mexico",                  position: null, city: "CDMX / GDL / MTY",     rarity: "special"   },
  { code: "FWC8",  team_code: "USA", type: "host_city",  player_name: "USA",                     position: null, city: "11 host cities",        rarity: "special"   },
  { code: "FWC9",  team_code: null,  type: "foil_intro", player_name: "Italy 1934",              position: null, city: null, rarity: "common"    },
  { code: "FWC10", team_code: null,  type: "foil_intro", player_name: "Uruguay 1950",            position: null, city: null, rarity: "common"    },
  { code: "FWC11", team_code: null,  type: "foil_intro", player_name: "West Germany 1954",       position: null, city: null, rarity: "common"    },
  { code: "FWC12", team_code: null,  type: "foil_intro", player_name: "Brazil 1962",             position: null, city: null, rarity: "common"    },
  { code: "FWC13", team_code: null,  type: "foil_intro", player_name: "West Germany 1974",       position: null, city: null, rarity: "common"    },
  { code: "FWC14", team_code: null,  type: "foil_intro", player_name: "Argentina 1986",          position: null, city: null, rarity: "common"    },
  { code: "FWC15", team_code: null,  type: "foil_intro", player_name: "Brazil 1994",             position: null, city: null, rarity: "common"    },
  { code: "FWC16", team_code: null,  type: "foil_intro", player_name: "Brazil 2002",             position: null, city: null, rarity: "common"    },
  { code: "FWC17", team_code: null,  type: "foil_intro", player_name: "Italy 2006",              position: null, city: null, rarity: "common"    },
  { code: "FWC18", team_code: null,  type: "foil_intro", player_name: "Germany 2014",            position: null, city: null, rarity: "common"    },
  { code: "FWC19", team_code: null,  type: "foil_intro", player_name: "Argentina 2022",          position: null, city: null, rarity: "common"    },
];

function buildStickerSet(): Sticker[] {
  const out: Sticker[] = [];
  let n = 1;

  for (const intro of INTRO_STICKERS) {
    out.push({ ...intro, n });
    n++;
  }

  const sorted = [...COUNTRIES].sort((a, b) => a.code.localeCompare(b.code));
  for (const country of sorted) {
    out.push({
      n: n++,
      code: `${country.code}1`,
      team_code: country.code,
      type: "team_badge",
      player_name: null,
      position: null,
      city: null,
      rarity: "special",
    });
    out.push({
      n: n++,
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
        n: n++,
        code: `${country.code}${i}`,
        team_code: country.code,
        type: "player",
        player_name: null,
        position: POSITIONS[i % POSITIONS.length],
        city: null,
        rarity: i === 20 ? "legendary" : "common",
      });
    }
  }

  return out;
}

export const STICKERS: Sticker[] = buildStickerSet();
export const TOTAL_STICKERS = STICKERS.length;
export const STICKERS_BY_N: Map<number, Sticker> = new Map(STICKERS.map((s) => [s.n, s]));
