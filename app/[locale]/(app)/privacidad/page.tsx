import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacidad · Cromio",
};

export default function PrivacidadPage() {
  return (
    <LegalShell
      title="Política de privacidad"
      subtitle="Qué datos guardamos, para qué, y cómo borrarlos."
    >
      <p>
        Cromio recoge el mínimo de datos necesario para que la app funcione.
        Nada se vende, nada se comparte con terceros para publicidad.
      </p>

      <h2>1. Qué guardamos</h2>
      <ul>
        <li>
          <strong>Email</strong> y método de inicio de sesión (email + contraseña
          o Google).
        </li>
        <li>
          <strong>Alias, nombre visible, color y avatar opcional.</strong>
        </li>
        <li>
          <strong>Ubicación aproximada</strong> (latitud/longitud guardada como
          un punto). La usamos para calcular distancias relativas con otros
          coleccionistas. No mostramos tu calle exacta.
        </li>
        <li>
          <strong>Tu álbum</strong> (qué cromos tienes y cuántos repetidos) y
          tus favoritos.
        </li>
        <li>
          <strong>Tus chats</strong> y los mensajes que envías. El contenido es
          visible solo para ti y la persona con la que chateas, y para
          moderación cuando alguien denuncia.
        </li>
        <li>
          <strong>Quedadas e intercambios</strong> que has marcado, con sus
          valoraciones.
        </li>
        <li>
          <strong>Endpoints de notificaciones push</strong> si activas el aviso
          (no exponen tu identidad pública).
        </li>
      </ul>

      <h2>2. Para qué lo usamos</h2>
      <ul>
        <li>Emparejarte con coleccionistas cercanos.</li>
        <li>Mostrarte tu álbum y el de quien chateas.</li>
        <li>
          Enviarte notificaciones de mensajes y matches si las has activado.
        </li>
        <li>
          Detectar abusos y bloquear a cuentas malintencionadas cuando alguien
          denuncia.
        </li>
      </ul>

      <h2>3. Quién lo ve</h2>
      <ul>
        <li>
          <strong>Otros coleccionistas</strong> ven tu alias, tu color/avatar y
          un pin aproximado en el mapa.
        </li>
        <li>
          <strong>La persona con la que chateas</strong> ve tu álbum (cromos
          que tienes y repetidos), valoraciones recibidas y mensajes que envías.
        </li>
        <li>
          <strong>Nadie más</strong>. No vendemos datos a anunciantes ni a
          brokers de marketing.
        </li>
      </ul>

      <h2>4. Tus derechos</h2>
      <ul>
        <li>
          <strong>Editar</strong> tu alias, foto, color y ubicación cuando
          quieras desde <strong>Perfil → Editar</strong>.
        </li>
        <li>
          <strong>Borrar</strong> tu cuenta y todos tus datos escribiendo a{" "}
          <a href="mailto:hola@cromio.app">hola@cromio.app</a>.
        </li>
        <li>
          <strong>Exportar</strong> tus datos en formato JSON bajo petición.
        </li>
        <li>
          <strong>Bloquear y denunciar</strong> a otros usuarios desde el menú
          "⋮" de su perfil.
        </li>
      </ul>

      <h2>5. Dónde se guardan</h2>
      <p>
        Los datos viven en <strong>Supabase</strong> (proveedor de base de datos
        que cumple GDPR) en servidores de la UE. El alojamiento web y la entrega
        de assets es vía <strong>Vercel</strong>. Las fotos de perfil viven en
        el bucket de Supabase Storage <code>avatars</code>, con lectura pública
        para que se vean en chats.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Solo usamos cookies <strong>imprescindibles</strong> para mantener tu
        sesión iniciada. No usamos cookies de tracking ni de publicidad.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para cualquier consulta sobre datos personales escribe a{" "}
        <a href="mailto:hola@cromio.app">hola@cromio.app</a>.
      </p>
    </LegalShell>
  );
}
