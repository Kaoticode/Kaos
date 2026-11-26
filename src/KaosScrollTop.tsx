"use client";

/*
 * KaosScrollTop · al ir a otra página, se empieza arriba (familia Kaos).
 *
 * Todas las webs copian este archivo TAL CUAL y lo ponen una vez en el layout.
 * Con el pie común en el layout, el router dejaba la página nueva a la altura
 * del pie si se venía de abajo del todo. Aquí, cada vez que la web navega a
 * otra ruta (history.pushState con otra ruta), se sube arriba. Atrás/adelante
 * no se toca: ahí el navegador devuelve a donde estabas. Tampoco los cambios
 * solo de ?query o #ancla.
 */
import { useEffect } from "react";

declare global {
  interface Window {
    __kaosScrollTop?: boolean;
  }
}

export default function KaosScrollTop(): null {
  useEffect(() => {
    if (window.__kaosScrollTop) return;
    window.__kaosScrollTop = true;
    const push = window.history.pushState.bind(window.history);
    window.history.pushState = (data, unused, url) => {
      const from = window.location.pathname;
      push(data, unused, url);
      if (!url) return;
      const to = new URL(String(url), window.location.href);
      if (to.pathname === from || to.hash) return;
      // Cuando la página nueva ya está pintada (y otra vez por si tarda un poco).
      const top = () =>
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(top);
      window.setTimeout(top, 120);
    };
  }, []);
  return null;
}
