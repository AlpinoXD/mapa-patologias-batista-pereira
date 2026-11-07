import { useRef, useState } from "react";
import { BookOpen, Download, List, Map as IconeMapa, Pencil, Upload, Volume2, VolumeX } from "lucide-react";
import { useInspecao } from "./lib/dados.js";
import { linhasPatologias } from "./lib/relatorio.js";
import { useSons } from "./lib/sons.js";
import { Link, useRota } from "./lib/rotas.jsx";
import { Dicas } from "./componentes/Dicas.jsx";
import { Mapa } from "./paginas/Mapa.jsx";
import { Patologias } from "./paginas/Patologias.jsx";
import { MatrizGut } from "./paginas/MatrizGut.jsx";
import base from "./dados/inspecao.json";

const PAGINAS = [
  { href: "/", nome: "Mapa de calor", curto: "Mapa", icone: IconeMapa, dica: "Planta com o calor das notas GUT" },
  { href: "/patologias", nome: "Patologias", curto: "Patologias", icone: List, dica: "Todas as patologias numa tabela" },
  { href: "/matriz-gut", nome: "Matriz GUT", curto: "Matriz GUT", icone: BookOpen, dica: "Como as notas são dadas" },
];
const TITULOS = { "/": "Mapa de patologias", "/patologias": "Patologias registradas", "/matriz-gut": "Matriz GUT" };

const lerModo = () => { try { return sessionStorage.getItem("modo-edicao") === "1"; } catch { return false; } };

export default function App() {
  const rota = useRota();
  const sons = useSons();
  const inspecao = useInspecao();
  const [modoEdicao, setModoEdicao] = useState(lerModo);
  const pagina = PAGINAS.some((p) => p.href === rota) ? rota : "/";
  document.title = `${TITULOS[pagina]} · EBM Batista Pereira`;

  const alternarEdicao = () => setModoEdicao((v) => {
    try { sessionStorage.setItem("modo-edicao", v ? "0" : "1"); } catch { /* opcional */ }
    return !v;
  });
  const edicao = modoEdicao ? inspecao : null;

  return (
    <div className="app">
      <header className="topo vidro-barra">
        <div className="topo-interno">
          <Link href="/" className="marca" data-dica="Voltar ao mapa">
            <span className="rotulo-tecnico destaque-ciano">SmartSchool Inspector</span>
            <span className="titulo-app">EBM Batista Pereira <span className="sep">•</span> <span className="sub-titulo">Diagnóstico Técnico &amp; Matriz GUT</span></span>
          </Link>

          <nav className="navegacao" aria-label="Páginas">
            {PAGINAS.map(({ href, nome, curto, icone: I, dica }) => (
              <Link key={href} href={href} className="nav-item" aria-current={pagina === href ? "page" : undefined} data-dica={dica}>
                <I /><span className="nome-longo">{nome}</span><span className="nome-curto">{curto}</span>
              </Link>
            ))}
          </nav>

          <div className="topo-acoes">
            <button type="button" className={`botao editar${modoEdicao ? " ligado" : ""}`} aria-pressed={modoEdicao} aria-label="Modo edição" onClick={alternarEdicao}
              data-dica={modoEdicao ? "Volta ao modo de consulta; as alterações continuam salvas neste navegador" : "Permite registrar patologias e marcar a inspeção nos ambientes"}>
              <Pencil /> <span className="rotulo-longo">{modoEdicao ? "Editando" : "Modo edição"}</span>
            </button>
            <button type="button" className="botao-icone" data-sem-som aria-pressed={sons.ligado} onClick={sons.alternar}
              data-dica={sons.ligado ? "Silenciar os sons de clique" : "Ativar os sons de clique"} aria-label={sons.ligado ? "Desativar sons" : "Ativar sons"}>
              {sons.ligado ? <Volume2 /> : <VolumeX />}
            </button>
          </div>
        </div>
      </header>

      <main className="tela">
        {(modoEdicao || inspecao.alterado) && <BarraEdicao inspecao={inspecao} modoEdicao={modoEdicao} onSair={alternarEdicao} />}
        {pagina === "/" && <Mapa dados={inspecao.ambientes} edicao={edicao} />}
        {pagina === "/patologias" && <Patologias dados={inspecao.ambientes} />}
        {pagina === "/matriz-gut" && <MatrizGut />}
      </main>
      <Dicas />
    </div>
  );
}

function BarraEdicao({ inspecao, modoEdicao, onSair }) {
  const arquivo = useRef(null);
  const [erro, setErro] = useState("");
  const atuais = linhasPatologias(inspecao.ambientes).length;
  const publicadas = linhasPatologias(base.ambientes).length;
  const importar = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (inspecao.alterado && !confirm("Importar substitui as alterações atuais deste navegador. Continuar?")) return;
    try { await inspecao.importar(f); setErro(""); } catch (err) { setErro(`Não foi possível importar: ${err.message}.`); }
  };
  return (
    <div className="barra-edicao" role="region" aria-label="Edição">
      <p>
        {modoEdicao ? <><strong>Modo edição.</strong> Clique num ambiente da planta para registrar patologias. </> : <><strong>Alterações locais.</strong> Você está vendo dados ainda não publicados. </>}
        {inspecao.alterado && <>O site publicado tem {publicadas} patologias; este navegador tem {atuais}.</>}
      </p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="acoes">
        {inspecao.alterado && <button type="button" className="botao primario" data-som="salvar" onClick={inspecao.baixar}
          data-dica={`Baixa inspecao.json com ${atuais} patologias. Substitua site/src/dados/inspecao.json por ele e publique.`}>
          <Download /> Baixar inspecao.json</button>}
        <button type="button" className="botao" onClick={() => arquivo.current.click()}
          data-dica="Carrega um inspecao.json recebido de outra pessoa (substitui o rascunho deste navegador)"><Upload /> Importar arquivo</button>
        <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={importar} />
        {inspecao.alterado && <button type="button" className="botao-texto perigo"
          data-dica={`Apaga o rascunho e volta aos dados publicados (${publicadas} patologias)`}
          onClick={() => { if (confirm("Descartar todas as alterações deste navegador e voltar aos dados publicados?")) inspecao.descartar(); }}>Descartar alterações</button>}
        {modoEdicao && <button type="button" className="botao-texto" onClick={onSair} data-dica="Volta ao modo de consulta; nada é apagado">Sair do modo edição</button>}
      </div>
    </div>
  );
}
