import { useEffect, useRef, useState } from "react";

const CHAVE = "batista-pereira-sons";
const lerPreferencia = () => { try { return localStorage.getItem(CHAVE) !== "0"; } catch { return true; } };

/** Toques curtos sintetizados (Web Audio) em cliques de botões, portados do original. */
export function useSons() {
  const [ligado, setLigado] = useState(lerPreferencia);
  const audio = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(CHAVE, ligado ? "1" : "0"); } catch { /* preferência é opcional */ }
    if (!ligado) return;
    const tocar = (e) => {
      if (!(e.target instanceof Element)) return;
      const controle = e.target.closest('button, [role="button"]');
      if (!controle || controle.disabled || controle.hasAttribute("data-sem-som")) return;
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      try {
        const ctx = audio.current ?? (audio.current = new AudioContext());
        void ctx.resume().catch(() => {});
        const salvar = controle.getAttribute("data-som") === "salvar";
        const agora = ctx.currentTime;
        for (const [atraso, freq] of salvar ? [[0, 660], [0.075, 990]] : [[0, 620]]) {
          const osc = ctx.createOscillator(), ganho = ctx.createGain(), t = agora + atraso;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.08);
          ganho.gain.setValueAtTime(0, t);
          ganho.gain.linearRampToValueAtTime(0.035, t + 0.006);
          ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
          osc.connect(ganho).connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.11);
        }
      } catch { /* áudio indisponível ou bloqueado */ }
    };
    document.addEventListener("click", tocar);
    document.addEventListener("keydown", tocar);
    return () => { document.removeEventListener("click", tocar); document.removeEventListener("keydown", tocar); };
  }, [ligado]);

  return { ligado, alternar: () => setLigado((v) => !v) };
}
