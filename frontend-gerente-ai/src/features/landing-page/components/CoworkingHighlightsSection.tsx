"use client";

import { useEffect, useRef } from "react";

const rowOne = [
  {
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    text: "Ahora puedo saber cuánto vendí sin sacar cuentas.",
  },
  {
    avatar: null,
    initials: "C",
    text: "Luka me ayuda a controlar los gastos de mi negocio.",
  },
  {
    avatar: null,
    initials: "AR",
    text: "Por fin tengo claro qué productos se están vendiendo más.",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    text: "Es como tener un administrador pendiente del negocio.",
  },
  {
    avatar: null,
    initials: "L",
    text: "Puedo preguntarle a Luka cómo va mi negocio y me responde.",
  },
  {
    avatar: null,
    initials: "S",
    text: "Me facilita mucho llevar el control de mis ventas.",
  },
];

const rowTwo = [
  {
    avatar: null,
    initials: "D",
    text: "Ahora tengo mucho más control sobre mis finanzas.",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80",
    text: "Luka me ayuda a entender mejor mis gastos.",
  },
  {
    avatar: null,
    initials: "J",
    text: "Ya no tengo que revisar todo manualmente.",
  },
  {
    avatar: null,
    initials: "P",
    text: "Puedo consultar mi negocio desde WhatsApp.",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=100&q=80",
    text: "Me ayuda a tomar mejores decisiones todos los días.",
  },
  {
    avatar: null,
    initials: "G",
    text: "Es rápido, sencillo y muy fácil de usar.",
  },
];

function TestimonialCard({
  avatar,
  initials,
  text,
}: {
  avatar: string | null;
  initials?: string;
  text: string;
}) {
  return (
    <div
      className="
        flex
        h-[58px]
        shrink-0
        items-center
        gap-3
        rounded-full
        border
        border-slate-200/80
        bg-white/75
        px-3
        pr-5
        shadow-sm
        backdrop-blur-md
        transition-all
        duration-300
        hover:border-[#006940]/30
        hover:shadow-md

        dark:border-white/[0.08]
        dark:bg-slate-900/60
        dark:hover:border-[#006940]/40
      "
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          loading="lazy"
          className="
            h-9
            w-9
            shrink-0
            rounded-full
            object-cover
            ring-2
            ring-white/80

            dark:ring-slate-800
          "
        />
      ) : (
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#006940]
            text-[10px]
            font-bold
            text-white
            ring-2
            ring-white/80

            dark:ring-slate-800
          "
        >
          {initials}
        </div>
      )}

      <p
        className="
          whitespace-nowrap
          text-[13px]
          font-medium
          leading-none
          text-slate-700

          dark:text-slate-200
        "
      >
        {text}
      </p>
    </div>
  );
}

export function CoworkingHighlightsSection() {
  const rowOneRef = useRef<HTMLDivElement>(null);
  const rowTwoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrame: number;

    let positionOne = 0;
    let positionTwo = 0;

    const speedOne = 0.45;
    const speedTwo = 0.35;

    let initializedRowTwo = false;

    const animate = () => {
      /* =====================================================
         PRIMERA FILA
         Movimiento continuo hacia la izquierda
         ===================================================== */

      positionOne -= speedOne;

      if (rowOneRef.current) {
        const width = rowOneRef.current.scrollWidth / 2;

        if (Math.abs(positionOne) >= width) {
          positionOne = 0;
        }

        rowOneRef.current.style.transform = `translate3d(${positionOne}px, 0, 0)`;
      }

      /* =====================================================
         SEGUNDA FILA
         Movimiento continuo hacia la derecha

         IMPORTANTE:
         Comenzamos en -50% del contenido duplicado.
         De esta forma siempre existe una segunda copia
         entrando desde la izquierda.
         ===================================================== */

      if (rowTwoRef.current) {
        const width = rowTwoRef.current.scrollWidth / 2;

        if (!initializedRowTwo) {
          positionTwo = -width;
          initializedRowTwo = true;
        }

        positionTwo += speedTwo;

        /*
         Cuando llegamos nuevamente a 0,
         volvemos exactamente a -width.

         Esto crea un loop infinito sin espacio vacío.
        */
        if (positionTwo >= 0) {
          positionTwo = -width;
        }

        rowTwoRef.current.style.transform = `translate3d(${positionTwo}px, 0, 0)`;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const duplicatedRowOne = [...rowOne, ...rowOne];
  const duplicatedRowTwo = [...rowTwo, ...rowTwo];

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        pb-20
        pt-2
      "
    >
      {/* =====================================================
          PRIMERA FILA
          Movimiento hacia la izquierda
      ===================================================== */}

      <div className="relative w-full overflow-hidden">
        <div
          ref={rowOneRef}
          className="
            flex
            w-max
            items-center
            gap-3
            px-3
            will-change-transform
          "
        >
          {duplicatedRowOne.map((item, index) => (
            <TestimonialCard
              key={`row-one-${index}`}
              avatar={item.avatar}
              initials={item.initials}
              text={item.text}
            />
          ))}
        </div>
      </div>

      {/* =====================================================
          SEGUNDA FILA
          Movimiento hacia la derecha
      ===================================================== */}

      <div className="relative mt-3 w-full overflow-hidden">
        <div
          ref={rowTwoRef}
          className="
            flex
            w-max
            items-center
            gap-3
            px-3
            will-change-transform
          "
        >
          {duplicatedRowTwo.map((item, index) => (
            <TestimonialCard
              key={`row-two-${index}`}
              avatar={item.avatar}
              initials={item.initials}
              text={item.text}
            />
          ))}
        </div>
      </div>
    </section>
  );
}