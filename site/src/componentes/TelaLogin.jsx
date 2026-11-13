import { useState } from "react";
import { Users } from "lucide-react";
import { entrar } from "../lib/nuvem.js";

const MOTIVO = {
  "auth/popup-blocked": "O navegador bloqueou a janela de login. Permita pop-ups para este site e tente de novo.",
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/unauthorized-domain": "Este endereço ainda não está autorizado no Firebase (Authentication → Domínios autorizados).",
  "auth/network-request-failed": "Sem conexão com a internet.",
};

export function TelaLogin({ pendente }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const clicar = async () => {
    setOcupado(true); setErro("");
    try { await entrar(); } catch (e) { setErro(MOTIVO[e.code] ?? "Não foi possível entrar com o Google."); setOcupado(false); }
  };
  return (
    <main className="tela-login">
      <div className="vidro cartao-login">
        <div>
          <p className="rotulo-tecnico destaque-ciano">SmartSchool Inspector</p>
          <h1>EBM Batista Pereira</h1>
          <p className="meta-login">Entre para acessar o diagnóstico técnico e a Matriz GUT.</p>
        </div>
        <div className="aviso-colab">
          <Users aria-hidden />
          <span>Edição em tempo real: cada alteração de um inspetor aparece na hora para toda a equipe, como num documento compartilhado.</span>
        </div>
        {pendente
          ? <p className="erro">O site ainda não foi ligado ao projeto Firebase (src/firebase-config.js).</p>
          : <button type="button" className="botao primario grande-login" onClick={clicar} disabled={ocupado}
              data-dica="Abre a janela do Google; nenhuma senha passa por este site">
              <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" /></svg>
              {ocupado ? "Entrando…" : "Entrar com Google"}
            </button>}
        {erro && <p className="erro" role="alert">{erro}</p>}
        <p className="meta-login pequeno">Qualquer conta Google pode ver o mapa. Para editar, o e-mail precisa estar na lista da equipe.</p>
      </div>
    </main>
  );
}
