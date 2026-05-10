import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Términos · Cromio",
};

export default function TerminosPage() {
  return (
    <LegalShell
      title="Términos y condiciones"
      subtitle="Última actualización: mayo 2026."
    >
      <p>
        Al usar Cromio aceptas estos términos. No son letra pequeña — los
        escribimos en lenguaje claro porque queremos que los leas.
      </p>

      <h2>1. Quién puede usar Cromio</h2>
      <ul>
        <li>
          Debes tener al menos <strong>14 años</strong>. Si eres menor de edad,
          úsalo con permiso de tu madre, padre o tutor legal.
        </li>
        <li>
          Una cuenta por persona. No suplantes a nadie ni inventes perfiles
          falsos.
        </li>
      </ul>

      <h2>2. Intercambios físicos</h2>
      <p>
        Cromio facilita el contacto pero <strong>no participa en los
        intercambios</strong>. Cuando quedéis para cambiar cromos en persona:
      </p>
      <ul>
        <li>
          Quedad en <strong>lugares públicos y con luz</strong> (una cafetería,
          un parque concurrido, la entrada de un centro comercial).
        </li>
        <li>
          Si eres menor, acude <strong>acompañado por un adulto</strong>.
        </li>
        <li>
          Cromio <strong>no se hace responsable</strong> de daños, pérdidas o
          desencuentros derivados de un intercambio realizado fuera de la app.
        </li>
      </ul>

      <h2>3. Convivencia</h2>
      <ul>
        <li>
          Sin acoso, lenguaje de odio, spam, contenido inapropiado ni venta
          comercial. Esto es para intercambiar, no para hacer dinero.
        </li>
        <li>
          Puedes <strong>bloquear y denunciar</strong> a cualquiera desde el
          menú "⋮" de su perfil. Las denuncias llegan a moderación.
        </li>
        <li>
          Podemos suspender o eliminar cuentas que incumplan estas normas, sin
          aviso previo si la situación lo requiere.
        </li>
      </ul>

      <h2>4. Tu contenido</h2>
      <p>
        Sigues siendo dueño de tu alias, foto y datos. Al subirlos nos das
        permiso para mostrarlos a otros coleccionistas dentro de la app. No los
        vendemos ni los compartimos con terceros (ver Privacidad).
      </p>

      <h2>5. Cuenta y baja</h2>
      <p>
        Puedes pedir la eliminación de tu cuenta y todos tus datos en cualquier
        momento escribiendo a{" "}
        <a href="mailto:hola@cromio.app">hola@cromio.app</a>. Te confirmaremos
        el borrado en un plazo razonable.
      </p>

      <h2>6. Garantías</h2>
      <p>
        Cromio se ofrece "tal cual". Hacemos lo posible para que funcione, pero
        no podemos garantizar ausencia total de errores o caídas. Si encuentras
        un bug, dínoslo.
      </p>

      <h2>7. Cambios</h2>
      <p>
        Si actualizamos estos términos te avisaremos dentro de la app antes de
        que entren en vigor.
      </p>
    </LegalShell>
  );
}
