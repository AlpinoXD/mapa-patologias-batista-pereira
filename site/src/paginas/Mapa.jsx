import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Droplets, Grid3X3, Layers, ShieldAlert, Zap } from "lucide-react";
import { ANDARES, INDICE } from "../dados/planta.js";
import { CATEGORIAS, formatarNota, gut, NOME_CATEGORIA, notaAmbiente, notaBloco, progresso, risco } from "../lib/gut.js";
import { Planta } from "../componentes/Planta.jsx";
import { PainelAmbiente, PainelResumo } from "../componentes/Paineis.jsx";
import { MenuExportar } from "../componentes/MenuExportar.jsx";
import { useColab } from "../lib/colab.jsx";

const ICONE_CATEGORIA = { geral: Layers, estrutura: ShieldAlert, hidraulica: Droplets, eletrica: Zap, revestimentos: Grid3X3 };
const VISOES = [
  { id: "blocos", nome: "Áreas / Blocos", icone: Layers, dica: "Pinta cada bloco pela média GUT dos seus ambientes" },
  { id: "ambientes", nome: "Ambientes individuais", icone: Grid3X3, dica: "Pinta cada ambiente pela sua maior nota GUT" },
  { id: "progresso", nome: "Concluídos", icone: CheckCircle2, dica: "Mostra quanto da inspeção de cada ambiente já foi concluído" },
];
const nomeGeral = (visao) => visao === "progresso" ? "Visão geral (Conclusão)" : visao === "blocos" ? "Visão geral (Média GUT)" : "Visão geral (Maior GUT)";

/* Estado da tela na URL: ?andar=superior&visao=blocos&categoria=eletrica&ambiente=cozinha */
function lerUrl() {
  const q = new URLSearchParams(location.search);
  const ambiente = INDICE[q.get("ambiente")] ? q.get("ambiente") : null;
  const andar = ambiente ? INDICE[ambiente].andar : ANDARES[q.get("andar")] ? q.get("andar") : "terreo";
  let visao = VISOES.some((v) => v.id === q.get("visao")) ? q.get("visao") : "ambientes";
  if (ambiente) visao = INDICE[ambiente].ambiente.members ? "blocos" : visao === "blocos" ? "ambientes" : visao;
  const categoria = CATEGORIAS.some((c) => c.id === q.get("categoria")) ? q.get("categoria") : "geral";
  return { andar, visao, filtro: categoria, selecionado: ambiente };
}
function escreverUrl(e, empilhar) {
  const q = new URLSearchParams();
  if (e.andar !== "terreo") q.set("andar", e.andar);
  if (e.visao !== "ambientes") q.set("visao", e.visao);
  if (e.filtro !== "geral") q.set("categoria", e.filtro);
  if (e.selecionado) q.set("ambiente", e.selecionado);
  const url = `/${q.size ? `?${q}` : ""}`;
  if (url !== location.pathname + location.search) history[empilhar ? "pushState" : "replaceState"](null, "", url);
}

function calcularItens(dados, andar, visao, filtro) {
  const a = ANDARES[andar];
  const doFiltro = (lista) => lista.filter((p) => filtro === "geral" || p.categoria === filtro).sort((x, y) => gut(y) - gut(x));
  if (visao === "blocos") {
    return a.blocos.map((s) => {
      const nota = notaBloco(dados, s.members, filtro);
      const pats = doFiltro(s.members.flatMap((id) => dados[id]?.patologias ?? []));
      return { s, nota, risco: risco(nota), pior: pats[0], qtd: pats.length, prog: 0 };
    });
  }
  return a.ambientes.map((s) => {
    const reg = dados[s.id];
    const nota = notaAmbiente(reg, filtro);
    const pats = doFiltro(reg?.patologias ?? []);
    return { s, nota, risco: risco(nota), pior: pats[0], qtd: pats.length, prog: progresso(reg, filtro) };
  });
}

export function Mapa({ dados, edicao }) {
  const [estado, setEstado] = useState(lerUrl);
  const [previa, setPrevia] = useState(null); // { patch, rotulo }: o que o controle sob o cursor vai fazer
  const [destaque, setDestaque] = useState(null);
  const timer = useRef(0);
  const { pessoas, definirOnde } = useColab();

  // conta para a equipe qual ambiente estou olhando (aparece na planta dos outros)
  useEffect(() => { definirOnde({ ambiente: estado.selecionado ?? null }); }, [estado.selecionado]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => definirOnde({ ambiente: null }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const presentes = useMemo(() => {
    const m = {};
    for (const p of pessoas) if (p.onde?.pagina === "/" && p.onde.ambiente) (m[p.onde.ambiente] ??= []).push(p);
    return m;
  }, [pessoas]);

  useEffect(() => {
    const voltar = () => { if (location.pathname === "/") setEstado(lerUrl()); };
    addEventListener("popstate", voltar);
    return () => removeEventListener("popstate", voltar);
  }, []);

  // seleção e troca de andar entram no histórico; filtros só substituem a URL atual
  const mudar = (patch, empilhar = false) => {
    clearTimeout(timer.current);
    setPrevia(null);
    setEstado((e) => {
      const novo = { ...e, ...patch };
      escreverUrl(novo, empilhar);
      return novo;
    });
  };

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape" && estado.selecionado && !e.target.closest?.("input, textarea, form")) mudar({ selecionado: null }, true); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  });

  /** Props de um controle que mostra na planta o resultado antes do clique. */
  const comPrevia = (patch, rotulo) => {
    const igual = Object.entries(patch).every(([k, v]) => estado[k] === v);
    const mostrar = (atraso) => {
      clearTimeout(timer.current);
      if (igual) { setPrevia(null); return; }
      timer.current = setTimeout(() => setPrevia({ patch, rotulo }), atraso);
    };
    const esconder = () => { clearTimeout(timer.current); setPrevia(null); };
    return {
      onPointerEnter: (e) => { if (e.pointerType !== "touch") mostrar(90); },
      onPointerLeave: esconder,
      onFocus: (e) => { if (e.target.matches(":focus-visible")) mostrar(0); },
      onBlur: esconder,
    };
  };

  const efetivo = previa ? { ...estado, ...previa.patch } : estado;
  const { andar, visao, filtro, selecionado } = efetivo;
  const itens = useMemo(() => calcularItens(dados, andar, visao, filtro), [dados, andar, visao, filtro]);

  const nomeAndar = ANDARES[andar].nome.toLowerCase();
  const pior = itens.filter((i) => i.nota != null).sort((a, b) => b.nota - a.nota)[0];
  const rodape = visao === "progresso"
    ? <span>EBM Batista Pereira · {itens.length} ambientes · <b className="num">{Math.round(itens.reduce((s, i) => s + i.prog, 0) / itens.length)}%</b> da inspeção concluída</span>
    : <span>EBM Batista Pereira · {itens.length} {visao === "blocos" ? "áreas" : "ambientes"}
        {pior ? <> · pior ponto: <b>{pior.s.name}</b> ({visao === "blocos" ? "média" : "GUT"} <b className="num">{formatarNota(pior.nota)}</b>)</> : " · nenhuma patologia registrada"}</span>;

  const selecionar = (id) => mudar({ selecionado: id === selecionado ? null : id }, true);
  const abrirAmbiente = (id) => mudar({ visao: INDICE[id]?.ambiente.members ? "blocos" : estado.visao === "blocos" ? "ambientes" : estado.visao, andar: INDICE[id]?.andar ?? estado.andar, selecionado: id }, true);
  const selecaoValida = selecionado && INDICE[selecionado]?.andar === andar
    && !!INDICE[selecionado].ambiente.members === (visao === "blocos") ? selecionado : null;
  const destacar = { onDestacar: setDestaque };

  return (
    <>
      <h1 className="sr">Mapa de calor das patologias da EBM Batista Pereira</h1>
      <div className="barra-controles">
        <div className="grupo" role="group" aria-label="Visualizar por">
          <span className="grupo-rotulo">Visualizar por:</span>
          {VISOES.map(({ id, nome, icone: I, dica }) => (
            <button key={id} type="button" className="pilula" aria-pressed={estado.visao === id} data-dica={dica}
              {...comPrevia({ visao: id, selecionado: null }, nome)}
              onClick={() => mudar({ visao: id, selecionado: null })}><I />{nome}</button>
          ))}
        </div>
        <div className="grupo-direita">
          <div className="segmentado" role="group" aria-label="Pavimento">
            {Object.entries(ANDARES).map(([id, a]) => (
              <button key={id} type="button" aria-pressed={estado.andar === id}
                {...comPrevia({ andar: id, selecionado: null }, `Pavimento ${a.nome.toLowerCase()}`)}
                onClick={() => mudar({ andar: id, selecionado: null }, true)}><span className="rotulo-longo">Pavimento </span>{a.nome}</button>
            ))}
          </div>
          <MenuExportar dados={dados} />
        </div>
      </div>

      <div className="categorias-abas" role="group" aria-label="Categoria">
        {[{ id: "geral", nome: nomeGeral(estado.visao) }, ...CATEGORIAS].map(({ id, nome }) => {
          const I = ICONE_CATEGORIA[id];
          return (
            <button key={id} type="button" className="pilula grande" aria-pressed={estado.filtro === id}
              {...comPrevia({ filtro: id }, id === "geral" ? "todas as categorias" : NOME_CATEGORIA[id])}
              onClick={() => mudar({ filtro: id })}><I />{nome}</button>
          );
        })}
      </div>

      <div className={`corpo${previa ? " em-previa" : ""}`}>
        <Planta andar={andar} visao={visao} itens={itens} selecionado={selecaoValida} destaque={destaque}
          previa={previa?.rotulo} rodape={rodape} presentes={presentes} onSelecionar={selecionar} />
        {selecaoValida
          ? <PainelAmbiente key={selecaoValida} id={selecaoValida} visao={visao} filtro={filtro} dados={dados} edicao={edicao}
              onVoltar={() => mudar({ selecionado: null }, true)} onAbrirAmbiente={abrirAmbiente} {...destacar} />
          : <PainelResumo andar={andar} visao={visao} filtro={filtro} itens={itens} onSelecionar={selecionar} onAbrirAmbiente={abrirAmbiente} {...destacar} />}
      </div>
    </>
  );
}
