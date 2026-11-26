/**
 * Cintas de texto cruzadas de la familia Kaos (clases k-marquee de kaos.css),
 * como las de Kaoticlub: se mueven solas y, con scroll, se desplazan hacia los
 * lados. Solo CSS. Decorativas: los lectores de pantalla las ignoran.
 */
interface Props {
  top: string[];
  bottom: string[];
}

function Band({ items, alt }: { items: string[]; alt?: boolean }) {
  // Cada mitad repite la lista para cubrir pantallas anchas; las dos mitades
  // son iguales para que el bucle (-50%) no tenga salto.
  const half = [0, 1, 2].flatMap((rep) => items.map((item) => `${rep}-${item}`));
  return (
    <div className={alt ? "k-marquee__band k-marquee__band--alt" : "k-marquee__band"}>
      <div className="k-marquee__track">
        {[0, 1].map((copy) =>
          half.map((key) => (
            <span key={`${copy}-${key}`}>
              {key.slice(key.indexOf("-") + 1)}
              <b>✦</b>
            </span>
          )),
        )}
      </div>
    </div>
  );
}

export default function KaosMarquee({ top, bottom }: Props) {
  return (
    <div className="k-marquee" aria-hidden="true">
      <Band items={top} />
      <Band items={bottom} alt />
    </div>
  );
}
