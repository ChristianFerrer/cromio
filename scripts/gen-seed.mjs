import { writeFileSync } from "node:fs";

const COUNTRIES_CODES = [
  "ARG","AUS","AUT","BEL","BIH","BRA","CAN","CIV","COD","COL","CPV","CRO",
  "CUW","CZE","ECU","EGY","ENG","ESP","FRA","GER","GHA","HAI","IRN","IRQ",
  "JOR","JPN","KOR","KSA","MAR","MEX","NED","NOR","NZL","PAN","PAR","POR",
  "QAT","RSA","SCO","SEN","SUI","SWE","TUN","TUR","URU","USA","UZB","ALG",
];

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

const INTRO = [
  ["00",   null,  "foil_intro", "Album Cover",          null, null,                  "legendary"],
  ["FWC1", null,  "foil_intro", "Official Emblem",       null, null,                  "legendary"],
  ["FWC2", null,  "foil_intro", "Official Emblem",       null, null,                  "special"],
  ["FWC3", null,  "foil_intro", "Mascots",                null, null,                  "legendary"],
  ["FWC4", null,  "foil_intro", "Official Slogan",        null, null,                  "special"],
  ["FWC5", null,  "foil_intro", "Trionda",                 null, null,                  "legendary"],
  ["FWC6", "CAN", "host_city",  "Canada",                  null, "Toronto / Vancouver", "special"],
  ["FWC7", "MEX", "host_city",  "Mexico",                  null, "CDMX / GDL / MTY",    "special"],
  ["FWC8", "USA", "host_city",  "USA",                     null, "11 host cities",       "special"],
  ["FWC9", null,  "foil_intro", "Italy 1934",              null, null,                  "common"],
  ["FWC10",null,  "foil_intro", "Uruguay 1950",            null, null,                  "common"],
  ["FWC11",null,  "foil_intro", "West Germany 1954",       null, null,                  "common"],
  ["FWC12",null,  "foil_intro", "Brazil 1962",             null, null,                  "common"],
  ["FWC13",null,  "foil_intro", "West Germany 1974",       null, null,                  "common"],
  ["FWC14",null,  "foil_intro", "Argentina 1986",          null, null,                  "common"],
  ["FWC15",null,  "foil_intro", "Brazil 1994",             null, null,                  "common"],
  ["FWC16",null,  "foil_intro", "Brazil 2002",             null, null,                  "common"],
  ["FWC17",null,  "foil_intro", "Italy 2006",              null, null,                  "common"],
  ["FWC18",null,  "foil_intro", "Germany 2014",            null, null,                  "common"],
  ["FWC19",null,  "foil_intro", "Argentina 2022",          null, null,                  "common"],
];

const esc = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const rows = [];
let n = 1;
for (const intro of INTRO) {
  rows.push([n, ...intro]);
  n++;
}

const sortedCountries = [...COUNTRIES_CODES].sort();
for (const code of sortedCountries) {
  rows.push([n++, `${code}1`, code, "team_badge", null, null, null, "special"]);
  rows.push([n++, `${code}2`, code, "team_photo", null, null, null, "special"]);
  for (let i = 3; i <= 20; i++) {
    rows.push([
      n++,
      `${code}${i}`,
      code,
      "player",
      null,
      POSITIONS[i % POSITIONS.length],
      null,
      i === 20 ? "legendary" : "common",
    ]);
  }
}

const lines = rows.map((r) => `(${r.map(esc).join(",")})`);
const sql = `insert into public.stickers (n, code, team_code, type, player_name, position, city, rarity) values\n${lines.join(",\n")};\n`;

writeFileSync("/tmp/stickers_seed.sql", sql);
console.log(`generated ${rows.length} rows -> /tmp/stickers_seed.sql`);
