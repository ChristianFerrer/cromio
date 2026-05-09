import type { MockUser } from "../types";

export const MOCK_USERS: MockUser[] = [
  { id: "u_maria",  alias: "maria_22",     color: "#E5006D", distM: 280,  rating: 4.9, trades: 32, pro: true,  bio: "Coleccionista desde el 98. Cambio sin ánimo de lucro.", online: true,  position: { x: 52, y: 38 } },
  { id: "u_carlos", alias: "carlosbcn",    color: "#1E5FBF", distM: 540,  rating: 4.7, trades: 17, pro: false, bio: "Padre coleccionando con mi hija.",                       online: true,  position: { x: 30, y: 55 } },
  { id: "u_pedro",  alias: "pedro.x",      color: "#117C4E", distM: 820,  rating: 5.0, trades: 64, pro: true,  bio: "Solo intercambios en lugares públicos.",                  online: false, position: { x: 70, y: 60 } },
  { id: "u_anna",   alias: "annacollect",  color: "#D4AF37", distM: 1200, rating: 4.6, trades: 9,  pro: false, bio: "Empezando — paciencia conmigo!",                          online: true,  position: { x: 42, y: 70 } },
  { id: "u_jordi",  alias: "jordi_fcb",    color: "#E63946", distM: 1900, rating: 4.8, trades: 28, pro: false, bio: "Solo cambio repetidos.",                                  online: false, position: { x: 78, y: 35 } },
  { id: "u_lola",   alias: "lolaperez",    color: "#3A3A3A", distM: 2200, rating: 4.5, trades: 5,  pro: false, bio: "",                                                         online: false, position: { x: 22, y: 30 } },
];

export const MOCK_USERS_BY_ID: Record<string, MockUser> = Object.fromEntries(
  MOCK_USERS.map((u) => [u.id, u]),
);
