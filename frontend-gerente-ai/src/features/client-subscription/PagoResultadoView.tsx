import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { esperarResultado, type Pago } from './services/pagosApi';

/**
 * Pantalla a la que vuelve la persona después de pagar en Wompi.
 *
 * No decide nada por su cuenta: le pregunta al backend por el estado del cobro.
 * Que Wompi haya devuelto al navegador no significa que el pago esté confirmado
 * —el aviso que activa el plan viaja por otro camino, de Wompi al servidor— así
 * que aquí se espera a que ese aviso llegue.
 */
export function PagoResultadoView() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const referencia = parametros.get('ref');

  const [pago, setPago] = useState<Pago | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referencia) {
      setError('No sabemos qué pago consultar: falta la referencia.');
      return;
    }

    let vigente = true;

    esperarResultado(referencia)
      .then((resultado) => {
        if (vigente) setPago(resultado);
      })
      .catch((e: Error) => {
        if (vigente) setError(e.message);
      });

    // Si la persona se va antes de que termine, no se toca un componente muerto.
    return () => {
      vigente = false;
    };
  }, [referencia]);

  const contenido = () => {
    if (error) {
      return (
        <Estado
          icono="⚠️"
          titulo="No pudimos confirmar el pago"
          detalle={error}
          nota="Si el cobro salió de tu cuenta, escríbenos con la referencia y lo revisamos. No se pierde."
        />
      );
    }

    if (!pago) {
      return (
        <Estado
          icono="⏳"
          titulo="Confirmando tu pago"
          detalle="Estamos esperando la confirmación de Wompi. Puede tardar unos segundos."
          nota="No cierres esta ventana."
        />
      );
    }

    switch (pago.estado) {
      case 'APROBADO':
        return (
          <Estado
            icono="✅"
            titulo="¡Listo, tu plan está activo!"
            detalle="El pago se confirmó y tu negocio ya tiene el plan nuevo."
            nota={`Referencia ${pago.referencia}`}
          />
        );
      case 'RECHAZADO':
        return (
          <Estado
            icono="❌"
            titulo="El pago fue rechazado"
            detalle="Tu banco no autorizó la transacción. No se te cobró nada."
            nota="Puedes intentarlo de nuevo con otro medio de pago."
          />
        );
      case 'PENDIENTE':
        return (
          <Estado
            icono="⏳"
            titulo="Tu pago sigue en proceso"
            detalle="Algunos medios, como PSE, tardan un poco más en confirmarse."
            nota="Cuando se confirme, tu plan se activa solo. Te avisamos por correo."
          />
        );
      default:
        return (
          <Estado
            icono="⚠️"
            titulo="Algo no salió como esperábamos"
            detalle="El pago quedó registrado pero no pudimos activarlo automáticamente."
            nota={`Escríbenos con la referencia ${pago.referencia} y lo resolvemos.`}
          />
        );
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {contenido()}

        <button
          onClick={() => navegar('/subscription')}
          className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Volver a mi suscripción
        </button>
      </div>
    </div>
  );
}

function Estado({
  icono,
  titulo,
  detalle,
  nota,
}: {
  icono: string;
  titulo: string;
  detalle: string;
  nota?: string;
}) {
  return (
    <>
      <div className="text-5xl">{icono}</div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
        {titulo}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{detalle}</p>
      {nota && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{nota}</p>
      )}
    </>
  );
}
