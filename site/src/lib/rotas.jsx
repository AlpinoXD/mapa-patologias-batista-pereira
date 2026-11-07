import { useEffect, useState } from "react";

// Roteador mínimo com pushState: a URL é a fonte de verdade e o voltar do navegador funciona.
const EVENTO = "navegou";

export function navegar(href) {
  if (href === location.pathname + location.search) return;
  history.pushState(null, "", href);
  dispatchEvent(new Event(EVENTO));
  scrollTo({ top: 0 });
}

export function useRota() {
  const [caminho, setCaminho] = useState(location.pathname);
  useEffect(() => {
    const ler = () => setCaminho(location.pathname);
    addEventListener("popstate", ler);
    addEventListener(EVENTO, ler);
    return () => { removeEventListener("popstate", ler); removeEventListener(EVENTO, ler); };
  }, []);
  return caminho;
}

/** Link interno: clique simples navega sem recarregar; Ctrl/Cmd + clique abre em nova aba. */
export function Link({ href, children, ...resto }) {
  const aoClicar = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navegar(href);
  };
  return <a href={href} onClick={aoClicar} {...resto}>{children}</a>;
}
