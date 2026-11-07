import { useEffect, useRef, useState } from "react";

/**
 * Dica flutuante única para o site todo: qualquer elemento com `data-dica` mostra, depois de um
 * instante com o cursor em cima (ou ao receber foco pelo teclado), o que ele vai fazer.
 * Uma só camada fixa evita que a dica seja cortada pelo `overflow` dos cartões.
 */
export function Dicas() {
  const [dica, setDica] = useState(null);
  const timer = useRef(0);
  const alvo = useRef(null);

  useEffect(() => {
    const posicionar = (el) => {
      const r = el.getBoundingClientRect();
      const abaixo = r.top < 90;
      setDica({ texto: el.dataset.dica, x: Math.min(Math.max(r.left + r.width / 2, 140), innerWidth - 140), y: abaixo ? r.bottom + 10 : r.top - 10, abaixo });
    };
    const entrar = (e) => {
      if (e.pointerType === "touch") return;
      const el = e.target.closest?.("[data-dica]");
      if (el === alvo.current) return;
      alvo.current = el;
      clearTimeout(timer.current);
      setDica(null);
      if (el) timer.current = setTimeout(() => posicionar(el), 450);
    };
    const focar = (e) => {
      const el = e.target.closest?.("[data-dica]");
      if (!el || !e.target.matches(":focus-visible")) return;
      alvo.current = el;
      clearTimeout(timer.current);
      posicionar(el);
    };
    const sair = () => { alvo.current = null; clearTimeout(timer.current); setDica(null); };
    addEventListener("pointerover", entrar);
    addEventListener("focusin", focar);
    addEventListener("focusout", sair);
    addEventListener("pointerdown", sair);
    addEventListener("scroll", sair, true);
    return () => {
      removeEventListener("pointerover", entrar);
      removeEventListener("focusin", focar);
      removeEventListener("focusout", sair);
      removeEventListener("pointerdown", sair);
      removeEventListener("scroll", sair, true);
    };
  }, []);

  if (!dica) return null;
  return (
    <div className={`dica-global${dica.abaixo ? " abaixo" : ""}`} role="tooltip" style={{ left: dica.x, top: dica.y }}>
      {dica.texto}
    </div>
  );
}
