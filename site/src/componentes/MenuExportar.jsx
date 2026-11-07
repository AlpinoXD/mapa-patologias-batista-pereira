import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { exportarCSV, imprimirRelatorio, linhasPatologias } from "../lib/relatorio.js";

/** Menu "Exportar relatório": cada opção diz o que vai gerar antes do clique. */
export function MenuExportar({ dados }) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const caixa = useRef(null);
  const total = linhasPatologias(dados).length;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (!caixa.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") { setAberto(false); caixa.current.querySelector("button").focus(); } };
    addEventListener("pointerdown", fora);
    addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", fora); removeEventListener("keydown", esc); };
  }, [aberto]);

  const imprimir = () => {
    setAberto(false);
    if (!imprimirRelatorio(dados)) setAviso("O navegador bloqueou a janela. Permita pop-ups para este site.");
  };

  return (
    <div className="menu" ref={caixa}>
      <button type="button" className="botao" aria-expanded={aberto} aria-haspopup="menu" aria-label="Exportar relatório" onClick={() => setAberto((v) => !v)}
        data-dica="Baixar planilha ou imprimir o diagnóstico">
        <FileDown /> <span className="rotulo-longo">Exportar relatório</span> <ChevronDown className={`seta${aberto ? " aberta" : ""}`} />
      </button>
      {aberto && (
        <div className="menu-lista" role="menu">
          <button type="button" role="menuitem" onClick={() => { exportarCSV(dados); setAberto(false); }}>
            <FileSpreadsheet />
            <span><b>Planilha CSV</b><small>{total} patologias, uma por linha, para abrir no Excel</small></span>
          </button>
          <button type="button" role="menuitem" onClick={imprimir}>
            <Printer />
            <span><b>Resumo para imprimir ou PDF</b><small>Médias por bloco e patologias por pavimento</small></span>
          </button>
        </div>
      )}
      {aviso && <p className="aviso" role="alert">{aviso}</p>}
    </div>
  );
}
