import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FileSpreadsheet, Printer, Search } from "lucide-react";
import { ANDARES } from "../dados/planta.js";
import { CATEGORIAS, ESCALA, NOME_CATEGORIA, NOME_RISCO, RISCOS } from "../lib/gut.js";
import { exportarCSV, imprimirRelatorio, linhasPatologias } from "../lib/relatorio.js";
import { Link } from "../lib/rotas.jsx";
import { Valor } from "../componentes/Paineis.jsx";

const sem = (t) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Patologias({ dados }) {
  const [busca, setBusca] = useState("");
  const [andar, setAndar] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [nivel, setNivel] = useState("todos");
  const [ordem, setOrdem] = useState({ col: "nota", desc: true });
  const [aviso, setAviso] = useState("");

  const todas = useMemo(() => linhasPatologias(dados), [dados]);
  const linhas = useMemo(() => {
    const termo = sem(busca.trim());
    const filtradas = todas.filter((l) =>
      (andar === "todos" || l.andar === andar)
      && (categoria === "todas" || l.p.categoria === categoria)
      && (nivel === "todos" || l.risco === nivel)
      && (!termo || sem(`${l.ambiente.name} ${l.p.descricao} ${l.bloco?.name ?? ""}`).includes(termo)));
    const chave = { nota: (l) => l.nota, ambiente: (l) => l.ambiente.name, categoria: (l) => NOME_CATEGORIA[l.p.categoria] }[ordem.col];
    return [...filtradas].sort((a, b) => {
      const [x, y] = [chave(a), chave(b)];
      const c = typeof x === "number" ? x - y : x.localeCompare(y, "pt-BR");
      return (ordem.desc ? -c : c) || b.nota - a.nota;
    });
  }, [todas, busca, andar, categoria, nivel, ordem]);

  const ambientesCom = new Set(todas.map((l) => l.ambiente.id)).size;
  const filtrando = busca || andar !== "todos" || categoria !== "todas" || nivel !== "todos";
  const ordenar = (col) => setOrdem((o) => ({ col, desc: o.col === col ? !o.desc : col === "nota" }));
  const Cab = ({ col, children, className }) => (
    <th className={className} aria-sort={ordem.col === col ? (ordem.desc ? "descending" : "ascending") : undefined}>
      <button type="button" className="ordenar" onClick={() => ordenar(col)}>
        {children}{ordem.col === col && (ordem.desc ? <ArrowDown /> : <ArrowUp />)}
      </button>
    </th>
  );

  return (
    <>
      <header className="cabecalho cabecalho-acoes">
        <div>
          <h1>Patologias registradas</h1>
          <p className="achado">
            {todas.length} patologias em {ambientesCom} ambientes
            {todas[0] && <> · maior nota <strong className="num">{todas[0].nota}</strong> ({todas[0].ambiente.name})</>}
          </p>
        </div>
        <div className="acoes">
          <button type="button" className="botao" data-dica={`Baixa uma planilha com ${todas.length} patologias, uma por linha`} onClick={() => exportarCSV(dados)}><FileSpreadsheet /> Baixar planilha</button>
          <button type="button" className="botao" data-dica="Abre o diagnóstico por pavimento para imprimir ou salvar em PDF" onClick={() => { if (!imprimirRelatorio(dados)) setAviso("O navegador bloqueou a janela do relatório. Permita pop-ups para este site e tente de novo."); }}>
            <Printer /> Imprimir relatório
          </button>
        </div>
      </header>
      {aviso && <p className="aviso" role="alert">{aviso}</p>}

      <div className="filtros">
        <label className="busca">
          <Search aria-hidden />
          <span className="sr">Buscar</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ambiente ou patologia" />
        </label>
        <Seletor rotulo="Pavimento" valor={andar} onMudar={setAndar}
          opcoes={[["todos", "Todos os pavimentos"], ...Object.entries(ANDARES).map(([id, a]) => [id, a.nome])]} />
        <Seletor rotulo="Categoria" valor={categoria} onMudar={setCategoria}
          opcoes={[["todas", "Todas as categorias"], ...CATEGORIAS.map((c) => [c.id, c.nome])]} />
        <Seletor rotulo="Risco" valor={nivel} onMudar={setNivel}
          opcoes={[["todos", "Todos os riscos"], ...RISCOS.map((r) => [r.id, `${r.nome} (${r.faixa})`])]} />
        <span className="contagem num" aria-live="polite">{linhas.length} de {todas.length}</span>
      </div>

      <div className="vidro tabela-caixa">
        <table className="tabela">
          <thead>
            <tr>
              <Cab col="nota" className="n">GUT</Cab>
              <th>Patologia</th>
              <Cab col="ambiente">Ambiente</Cab>
              <Cab col="categoria">Categoria</Cab>
              <th className="n">G · U · T</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.p.id}>
                <td className="n"><Valor nota={l.nota} /></td>
                <td className="col-desc">
                  {l.p.descricao}
                  <span className="sub-celular">{l.ambiente.name} · {NOME_CATEGORIA[l.p.categoria]} · G{l.p.g} U{l.p.u} T{l.p.t}</span>
                </td>
                <td className="col-amb">
                  <Link href={`/?ambiente=${l.ambiente.id}`} className="link" data-dica="Abre a planta com este ambiente selecionado">{l.ambiente.name}</Link>
                  <span className="sub">{ANDARES[l.andar].nome}{l.bloco ? ` · ${l.bloco.name.split(" · ")[0]}` : ""}</span>
                </td>
                <td className="col-cat">{NOME_CATEGORIA[l.p.categoria]}</td>
                <td className="n num col-gut">
                  {["g", "u", "t"].map((k, i) => <span key={k}>{i > 0 && " · "}<abbr title={`${ESCALA[k].nome}: ${ESCALA[k].niveis[l.p[k] - 1]}`}>{l.p[k]}</abbr></span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!linhas.length && (
          <p className="vazio vazio-tabela">
            {filtrando ? "Nenhuma patologia corresponde aos filtros." : "Nenhuma patologia registrada ainda. Ative o modo edição e abra um ambiente no mapa para registrar."}
          </p>
        )}
      </div>
      <p className="meta rodape-tabela">Risco: {RISCOS.map((r) => `${NOME_RISCO[r.id].toLowerCase()} ${r.faixa}`).join(" · ")}. Clique no ambiente para vê-lo na planta.</p>
    </>
  );
}

function Seletor({ rotulo, valor, opcoes, onMudar }) {
  return (
    <label className="seletor">
      <span className="sr">{rotulo}</span>
      <select value={valor} onChange={(e) => onMudar(e.target.value)}>
        {opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}
