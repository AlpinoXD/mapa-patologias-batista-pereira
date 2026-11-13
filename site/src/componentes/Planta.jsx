import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize, Minus, MousePointerClick, Plus } from "lucide-react";
import { ANDARES } from "../dados/planta.js";
import { formatarNota, NOME_CATEGORIA, NOME_RISCO } from "../lib/gut.js";
import { bordaDe, corDe, opacidadeDe, temBrilho } from "../lib/cores.js";

const ZOOM_MAX = 6;
const PASSO = 1.5;

/**
 * Planta interativa: cada ambiente (ou bloco) é pintado pela sua nota GUT.
 * Ctrl + roda e pinça dão zoom, arrastar move, clique ou Enter seleciona.
 * `destaque` acende um ambiente quando o cursor passa por ele numa lista (prévia de para onde o clique leva);
 * `previa` mostra no topo que a planta exibe uma prévia de um filtro ainda não aplicado.
 */
export function Planta({ andar, visao, itens, selecionado, destaque, previa, rodape, presentes = {}, onSelecionar }) {
  const { viewBox: base, ambientes, nome } = ANDARES[andar];
  const [vb, setVb] = useState(base);
  const [dica, setDica] = useState(null);
  const [vbPrevia, setVbPrevia] = useState(null);
  const svgRef = useRef(null);
  const caixaRef = useRef(null);
  const ponteiros = useRef(new Map());
  const gesto = useRef({ moveu: false });

  useLayoutEffect(() => setVb(base), [andar]); // eslint-disable-line react-hooks/exhaustive-deps

  const limitar = ([x, y, w, h]) => {
    const nw = Math.min(base[2], Math.max(base[2] / ZOOM_MAX, w));
    const nh = (nw / w) * h;
    // a vista nunca sai da planta
    const nx = Math.min(base[0] + base[2] - nw, Math.max(base[0], x));
    const ny = Math.min(base[1] + base[3] - nh, Math.max(base[1], y));
    return [nx, ny, nw, nh];
  };
  const pontoSvg = (cx, cy, v) => {
    const r = svgRef.current.getBoundingClientRect();
    return [v[0] + ((cx - r.left) / r.width) * v[2], v[1] + ((cy - r.top) / r.height) * v[3]];
  };
  const vistaApos = (v, fator, cx, cy) => {
    const [px, py] = cx == null ? [v[0] + v[2] / 2, v[1] + v[3] / 2] : pontoSvg(cx, cy, v);
    const k = limitar([0, 0, v[2] * fator, v[3] * fator])[2] / v[2];
    return limitar([px - (px - v[0]) * k, py - (py - v[1]) * k, v[2] * k, v[3] * k]);
  };
  const zoomEm = (fator, cx, cy) => setVb((v) => vistaApos(v, fator, cx, cy));

  // A roda sozinha rola a página; Ctrl + roda (ou a pinça do trackpad, que chega com ctrlKey) dá zoom.
  // Já aproximada, a roda sozinha também dá zoom, para não perder o lugar ao afastar.
  const [avisoZoom, setAvisoZoom] = useState(false);
  const timerAviso = useRef(0);
  useEffect(() => {
    const el = svgRef.current;
    const roda = (e) => {
      if (!e.ctrlKey && !e.metaKey && base[2] / vb[2] <= 1.01) {
        setAvisoZoom(true);
        clearTimeout(timerAviso.current);
        timerAviso.current = setTimeout(() => setAvisoZoom(false), 1400);
        return;
      }
      e.preventDefault();
      zoomEm(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  });

  const aoBaixar = (e) => {
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesto.current = { moveu: false, inicio: { x: e.clientX, y: e.clientY }, vb };
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      gesto.current.distancia = Math.hypot(a.x - b.x, a.y - b.y);
      gesto.current.centro = [(a.x + b.x) / 2, (a.y + b.y) / 2];
    }
  };
  const aoMover = (e) => {
    if (!ponteiros.current.has(e.pointerId)) return;
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesto.current;
    const r = svgRef.current.getBoundingClientRect();
    if (ponteiros.current.size === 2 && g.distancia) {
      const [a, b] = [...ponteiros.current.values()];
      const k = g.distancia / Math.hypot(a.x - b.x, a.y - b.y);
      const v = g.vb;
      g.moveu = true;
      const [px, py] = [v[0] + ((g.centro[0] - r.left) / r.width) * v[2], v[1] + ((g.centro[1] - r.top) / r.height) * v[3]];
      setVb(limitar([px - (px - v[0]) * k, py - (py - v[1]) * k, v[2] * k, v[3] * k]));
      return;
    }
    const dx = e.clientX - g.inicio.x, dy = e.clientY - g.inicio.y;
    if (!g.moveu && Math.hypot(dx, dy) < 5) return;
    if (!g.moveu) { g.moveu = true; svgRef.current.setPointerCapture(e.pointerId); }
    setDica(null);
    setVb(limitar([g.vb[0] - (dx / r.width) * g.vb[2], g.vb[1] - (dy / r.height) * g.vb[3], g.vb[2], g.vb[3]]));
  };
  const aoSoltar = (e) => { ponteiros.current.delete(e.pointerId); if (ponteiros.current.size < 2) gesto.current.distancia = null; };

  const mostrarDica = (e, item) => {
    if (e.pointerType === "touch" || (gesto.current.moveu && ponteiros.current.size)) return;
    const r = caixaRef.current.getBoundingClientRect();
    setDica({ item, x: e.clientX - r.left, y: e.clientY - r.top, largura: r.width });
  };

  const zoomAtual = base[2] / vb[2];
  const forma = (s, props) => s.path
    ? <path d={s.path} vectorEffect="non-scaling-stroke" {...props} />
    : <rect x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={1} vectorEffect="non-scaling-stroke" {...props} />;
  // botões de zoom: ao passar o cursor, a planta mostra o retângulo que vai ficar visível
  const previaZoom = (proxima) => ({
    onPointerEnter: () => setVbPrevia(proxima), onFocus: () => setVbPrevia(proxima),
    onPointerLeave: () => setVbPrevia(null), onBlur: () => setVbPrevia(null),
  });

  return (
    <section className="vidro planta" ref={caixaRef} aria-label={`Planta do pavimento ${nome.toLowerCase()}`}
      data-selecao={selecionado && itens.some((i) => i.s.id === selecionado) ? "" : undefined}
      data-destaque={destaque && itens.some((i) => i.s.id === destaque) ? "" : undefined}>
      <div className="planta-barra">
        <span className="rotulo-tecnico">Planta baixa · pavimento {nome.toLowerCase()}</span>
        <div className="zoom">
          <span className="rotulo-tecnico fraco">Escala ilustrativa</span>
          <button type="button" className="botao-icone" aria-label="Aproximar" data-dica="Aproximar a planta (Ctrl + roda)"
            {...previaZoom(vistaApos(vb, 1 / PASSO))} onClick={() => { zoomEm(1 / PASSO); setVbPrevia(null); }} disabled={zoomAtual >= ZOOM_MAX - 0.01}><Plus /></button>
          <button type="button" className="botao-icone" aria-label="Afastar" data-dica="Afastar a planta"
            {...previaZoom(vistaApos(vb, PASSO))} onClick={() => { zoomEm(PASSO); setVbPrevia(null); }} disabled={zoomAtual <= 1.01}><Minus /></button>
          <button type="button" className="botao-icone" aria-label="Enquadrar a planta inteira" data-dica="Mostrar a planta inteira"
            {...previaZoom(base)} onClick={() => { setVb(base); setVbPrevia(null); }} disabled={zoomAtual <= 1.01}><Maximize /></button>
        </div>
      </div>

      <div className="planta-area">
        {previa && <p className="selo-previa" aria-live="polite">Prévia · {previa} <span>clique para aplicar</span></p>}
        <svg ref={svgRef} viewBox={vb.join(" ")} role="group" aria-label="Ambientes da planta"
          className={gesto.current.moveu && ponteiros.current.size ? "arrastando" : undefined}
          onPointerDown={aoBaixar} onPointerMove={aoMover} onPointerUp={aoSoltar} onPointerCancel={aoSoltar}
          onPointerLeave={() => setDica(null)}>
          <defs>
            <filter id="brilho" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {visao === "blocos" && <g className="fantasma">{ambientes.map((s) => <g key={s.id} className={s.id === destaque ? "destacada" : undefined}>{forma(s, {})}</g>)}</g>}
          {itens.map((item) => {
            const { s } = item;
            const ativo = s.id === selecionado;
            const cor = corDe(item, visao);
            return (
              <g key={s.id} className={`sala${ativo ? " selecionada" : ""}${s.id === destaque ? " destacada" : ""}`} role="button" tabIndex={0}
                aria-pressed={ativo} aria-label={`${s.name}: ${rotuloValor(item, visao)}`}
                onClick={() => { if (!gesto.current.moveu) onSelecionar(s.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelecionar(s.id); } }}
                onPointerEnter={(e) => mostrarDica(e, item)} onPointerMove={(e) => mostrarDica(e, item)}
                onPointerLeave={() => setDica(null)}>
                {forma(s, {
                  className: "forma", fill: cor, fillOpacity: opacidadeDe(item, visao), stroke: bordaDe(item, visao),
                  strokeWidth: visao === "blocos" ? 2.5 : 1.5, filter: temBrilho(item, visao) ? "url(#brilho)" : undefined,
                })}
              </g>
            );
          })}
          {/* rótulos numa camada própria, por cima de todas as formas, para nenhum ambiente cobrir o nome do vizinho */}
          <g aria-hidden="true" className="rotulos">
            {itens.map((item) => visao === "blocos"
              ? <RotuloBloco key={item.s.id} s={item.s} nota={item.nota} cor={corDe(item, visao)} />
              : <RotuloSala key={item.s.id} s={item.s} valor={visao === "progresso" ? (item.prog ? `${item.prog}%` : null) : item.nota != null ? formatarNota(item.nota) : null} />)}
          </g>
          {/* quem da equipe está olhando cada ambiente agora: contorno tracejado e a inicial na cor da pessoa */}
          <g className="presencas" aria-hidden="true">
            {ambientes.filter((s) => presentes[s.id]).map((s) => {
              const [x, y] = s.r;
              const gente = presentes[s.id];
              return (
                <g key={s.id} style={{ "--cor": gente[0].cor }}>
                  {forma(s, { className: "contorno-presenca" })}
                  {gente.slice(0, 3).map((p, i) => (
                    <g key={p.uid} transform={`translate(${x + 9 + i * 13} ${y + 9})`} style={{ "--cor": p.cor }}>
                      <circle r={7.5} className="bolinha-presenca" />
                      <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700}>{(p.nome ?? "?").charAt(0).toUpperCase()}</text>
                    </g>
                  ))}
                </g>
              );
            })}
          </g>
          {vbPrevia && <rect className="previa-zoom" x={vbPrevia[0]} y={vbPrevia[1]} width={vbPrevia[2]} height={vbPrevia[3]} vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>

      <div className="planta-rodape">
        {dica ? <><b>{dica.item.s.name}</b><span className="num">{resumo(dica.item, visao)}</span></> : rodape}
      </div>

      {dica && <Dica {...dica} visao={visao} selecionado={dica.item.s.id === selecionado} gente={presentes[dica.item.s.id]} />}
      <p className={`aviso-zoom${avisoZoom ? " visivel" : ""}`} aria-hidden>Use Ctrl + roda do mouse ou os botões + e − para aproximar</p>
    </section>
  );
}

const resumo = (item, visao) => visao === "progresso" ? `${item.prog}% concluído`
  : item.nota == null ? "sem patologia registrada" : `${visao === "blocos" ? "Média GUT" : "GUT"} ${formatarNota(item.nota)} · ${NOME_RISCO[item.risco]}`;

function rotuloValor(item, visao) {
  if (visao === "progresso") return `${item.prog}% da inspeção concluída`;
  if (item.nota == null) return "sem patologia registrada";
  return `${visao === "blocos" ? "média GUT" : "GUT"} ${formatarNota(item.nota)}, risco ${NOME_RISCO[item.risco].toLowerCase()}`;
}

function RotuloBloco({ s, nota, cor }) {
  const [x, y, w, h] = s.r;
  return (
    <g textAnchor="middle">
      <text x={x + w / 2} y={y + h / 2 - 6} fontSize={30} fontWeight={600}>{s.short}</text>
      <text x={x + w / 2} y={y + h / 2 + 16} fontSize={11} className="nota-sala" style={{ fill: nota == null ? undefined : cor }}>
        {nota == null ? "sem registro" : `Média ${formatarNota(nota)}`}
      </text>
    </g>
  );
}

function RotuloSala({ s, valor }) {
  const [x, y, w, h] = s.rotulo ?? s.r;
  const linhas = s.label ?? (s.name.startsWith("Sala de Aula") ? ["Sala", s.name.slice(-2)] : [s.name]);
  const vertical = h > w * 3 && w < 40;
  const [largura, altura] = vertical ? [h, w] : [w, h];
  const mostraValor = valor && largura >= 30 && altura >= 30;
  const total = linhas.length + (mostraValor ? 1 : 0);
  // a maior fonte (até 13) em que a linha mais longa cabe no ambiente
  const maior = Math.max(...linhas.map((l) => l.length));
  const fonte = Math.max(5, Math.min(13, (largura - 6) / (maior * 0.6), (altura - 4) / (total * 1.3)));
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={fonte}
      transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}>
      {linhas.map((l, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? -((total - 1) * fonte * 1.25) / 2 : fonte * 1.25}>{l}</tspan>
      ))}
      {mostraValor && <tspan x={cx} dy={fonte * 1.3} className="nota-sala">{valor}</tspan>}
    </text>
  );
}

function Dica({ item, x, y, largura, visao, selecionado, gente }) {
  const { s, nota, pior, prog, qtd } = item;
  const esquerda = x > largura - 290;
  const acao = selecionado ? "Clique para fechar os detalhes"
    : visao === "blocos" ? "Clique para ver a média e os ambientes do bloco"
    : visao === "progresso" ? "Clique para ver as categorias inspecionadas"
    : qtd ? `Clique para ver ${qtd === 1 ? "a patologia" : `as ${qtd} patologias`}` : "Clique para abrir o ambiente";
  return (
    <div className="dica" style={{ left: esquerda ? undefined : x + 16, right: esquerda ? largura - x + 16 : undefined, top: y + 16 }}>
      <b>{s.name}</b>
      {visao === "progresso"
        ? <div className="linha"><span>Inspeção concluída</span><span className="num">{prog}%</span></div>
        : <>
            <div className="linha"><span>{visao === "blocos" ? "Média GUT" : "GUT"} · {NOME_RISCO[item.risco]}</span><span className="num">{formatarNota(nota)}</span></div>
            {pior && <div className="pior">{NOME_CATEGORIA[pior.categoria]}: {pior.descricao}</div>}
          </>}
      {gente?.length > 0 && <div className="pior">Aqui agora: {gente.map((p) => p.nome?.split(" ")[0]).join(", ")}{gente.some((p) => p.onde?.editando) ? " (editando)" : ""}</div>}
      <div className="acao"><MousePointerClick aria-hidden /> {acao}</div>
    </div>
  );
}
