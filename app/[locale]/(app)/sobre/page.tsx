import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Sobre Cromio",
};

export default function SobrePage() {
  return (
    <LegalShell title="Sobre Cromio" subtitle="Qué es esta app y por qué existe.">
      <p>
        <strong>Cromio</strong> es una app comunitaria que ayuda a los
        coleccionistas del álbum <em>Mundial 2026</em> a encontrarse cerca y
        cambiar cromos en persona, sin pasar por marketplaces ni intermediarios.
      </p>

      <h2>Cómo funciona</h2>
      <ul>
        <li>
          <strong>Cargas tu álbum</strong> y marcas los cromos que tienes,
          incluyendo los repetidos.
        </li>
        <li>
          <strong>Activamos el radar</strong> en el mapa según el radio que
          elijas (200 m, 500 m, 1 km, 2 km, 5 km, 10 km).
        </li>
        <li>
          <strong>Te emparejamos</strong> con otros coleccionistas con los que
          haya match (tú das, te dan) o interés (solo te dan).
        </li>
        <li>
          <strong>Chateáis</strong> dentro de la app y proponéis la quedada.
          Cuando completes el intercambio, lo marcáis "Hecho" y os valoráis.
        </li>
      </ul>

      <h2>Privacidad de ubicación</h2>
      <p>
        Tu ubicación no se comparte con precisión: solo guardamos tu zona y
        calculamos distancias relativas. Otros coleccionistas ven un pin
        aproximado en el mapa, no tu dirección.
      </p>

      <h2>No oficial</h2>
      <p>
        Cromio es una app independiente <strong>sin afiliación con Panini Group,
        FIFA ni la FIFA World Cup 2026™</strong>. Los nombres y diseños de los
        cromos pertenecen a sus respectivos titulares; los usamos solo como
        referencia para facilitar el intercambio entre coleccionistas reales.
      </p>

      <h2>Quién está detrás</h2>
      <p>
        Cromio es un proyecto pequeño construido por una persona, sin inversores
        ni publicidad. Si te falla algo o quieres pedir una mejora, escribe a{" "}
        <a href="mailto:hola@cromio.app">hola@cromio.app</a>.
      </p>
    </LegalShell>
  );
}
