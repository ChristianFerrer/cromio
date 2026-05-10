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
  { code: "FWC6",  team_code: "CAN", type: "host_city",  player_name: "Toronto",                 position: null, city: "BMO Field",             rarity: "special"   },
  { code: "FWC7",  team_code: "CAN", type: "host_city",  player_name: "Vancouver",               position: null, city: "BC Place",              rarity: "special"   },
  { code: "FWC8",  team_code: "MEX", type: "host_city",  player_name: "Mexico City",             position: null, city: "Estadio Azteca",        rarity: "special"   },
  { code: "FWC9",  team_code: "MEX", type: "host_city",  player_name: "Guadalajara",             position: null, city: "Estadio Akron",         rarity: "special"   },
  { code: "FWC10", team_code: "MEX", type: "host_city",  player_name: "Monterrey",               position: null, city: "Estadio BBVA",          rarity: "special"   },
  { code: "FWC11", team_code: "USA", type: "host_city",  player_name: "Atlanta",                 position: null, city: "Mercedes-Benz Stadium", rarity: "special"   },
  { code: "FWC12", team_code: "USA", type: "host_city",  player_name: "Boston",                  position: null, city: "Gillette Stadium",      rarity: "special"   },
  { code: "FWC13", team_code: "USA", type: "host_city",  player_name: "Dallas",                  position: null, city: "AT&T Stadium",          rarity: "special"   },
  { code: "FWC14", team_code: "USA", type: "host_city",  player_name: "Houston",                 position: null, city: "NRG Stadium",           rarity: "special"   },
  { code: "FWC15", team_code: "USA", type: "host_city",  player_name: "Kansas City",             position: null, city: "Arrowhead Stadium",     rarity: "special"   },
  { code: "FWC16", team_code: "USA", type: "host_city",  player_name: "Los Angeles",             position: null, city: "SoFi Stadium",          rarity: "special"   },
  { code: "FWC17", team_code: "USA", type: "host_city",  player_name: "Miami",                   position: null, city: "Hard Rock Stadium",     rarity: "special"   },
  { code: "FWC18", team_code: "USA", type: "host_city",  player_name: "New York / New Jersey",   position: null, city: "MetLife Stadium",       rarity: "special"   },
  { code: "FWC19", team_code: "USA", type: "host_city",  player_name: "Philadelphia",            position: null, city: "Lincoln Financial Field", rarity: "special" },
  { code: "FWC20", team_code: "USA", type: "host_city",  player_name: "San Francisco Bay Area",  position: null, city: "Levi's Stadium",        rarity: "special"   },
  { code: "FWC21", team_code: "USA", type: "host_city",  player_name: "Seattle",                 position: null, city: "Lumen Field",           rarity: "special"   },
  { code: "FWC22", team_code: null,  type: "foil_intro", player_name: "Italy 1934",              position: null, city: null, rarity: "common"    },
  { code: "FWC23", team_code: null,  type: "foil_intro", player_name: "Uruguay 1950",            position: null, city: null, rarity: "common"    },
  { code: "FWC24", team_code: null,  type: "foil_intro", player_name: "West Germany 1954",       position: null, city: null, rarity: "common"    },
  { code: "FWC25", team_code: null,  type: "foil_intro", player_name: "Brazil 1962",             position: null, city: null, rarity: "common"    },
  { code: "FWC26", team_code: null,  type: "foil_intro", player_name: "West Germany 1974",       position: null, city: null, rarity: "common"    },
  { code: "FWC27", team_code: null,  type: "foil_intro", player_name: "Argentina 1986",          position: null, city: null, rarity: "common"    },
  { code: "FWC28", team_code: null,  type: "foil_intro", player_name: "Brazil 1994",             position: null, city: null, rarity: "common"    },
  { code: "FWC29", team_code: null,  type: "foil_intro", player_name: "Brazil 2002",             position: null, city: null, rarity: "common"    },
  { code: "FWC30", team_code: null,  type: "foil_intro", player_name: "Italy 2006",              position: null, city: null, rarity: "common"    },
  { code: "FWC31", team_code: null,  type: "foil_intro", player_name: "Germany 2014",            position: null, city: null, rarity: "common"    },
  { code: "FWC32", team_code: null,  type: "foil_intro", player_name: "Argentina 2022",          position: null, city: null, rarity: "common"    },
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
