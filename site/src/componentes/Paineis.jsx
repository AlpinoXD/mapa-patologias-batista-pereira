import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ANDARES, INDICE } from "../dados/planta.js";
import { CATEGORIAS, ESCALA, formatarNota, gut, integridade, NOME_CATEGORIA, NOME_RISCO, notaAmbiente, notaBloco, progresso, risco, RISCOS } from "../lib/gut.js";
import { corProgresso, corRisco } from "../lib/cores.js";
import { novoId } from "../lib/dados.js";
import { Link } from "../lib/rotas.jsx";
import { EditorPatologia } from "./EditorPatologia.jsx";

const nomeFiltro = (f) => (f === "geral" ? "todas as categorias" : NOME_CATEGORIA[f]);

/** Nota com o chip contornado na cor do risco, como no original. */
export function Valor({ nota, pequeno }) {
  const r = risco(nota);
  return (
    <span className={`chip-nota num${pequeno ? " pequeno" : ""}${r === "nenhum" ? " vazio-chip" : ""}`} style={{ "--cor": corRisco(r) }}>
      {formatarNota(nota)}
    </span>
  );
}

function Pilula({ r }) {
  return <span className="pilula-risco" style={{ "--cor": corRisco(r) }}>{NOME_RISCO[r]}</span>;
}

/** Linha de lista que acende o ambiente na planta enquanto o cursor está sobre ela. */
function LinhaAmbiente({ id, onClick, onDestacar, dica, children }) {
  return (
    <button type="button" className="linha-lista" onClick={onClick} data-dica={dica}
      onPointerEnter={() => onDestacar?.(id)} onPointerLeave={() => onDestacar?.(null)}
      onFocus={() => onDestacar?.(id)} onBlur={() => onDestacar?.(null)}>
      {children}
    </button>
  );
}

/* ---------- resumo do pavimento ---------- */
export function PainelResumo({ andar, visao, filtro, itens, onSelecionar, onDestacar }) {
  const nomeAndar = ANDARES[andar].nome;

  if (visao === "progresso") {
    const media = itens.length ? Math.round(itens.reduce((s, i) => s + i.prog, 0) / itens.length) : 0;
    const feitos = itens.filter((i) => i.prog === 100).length;
    const pendentes = itens.filter((i) => i.prog < 100).sort((a, b) => b.prog - a.prog);
    return (
      <aside className="lateral" aria-label="Resumo do progresso">
        <section className="vidro cartao-lateral">
          <h2 className="rotulo-tecnico">Progresso de conclusão · {nomeAndar}</h2>
          <p className="numero-grande num">{media}<small>%</small></p>
          <div className="barra-progresso"><span style={{ width: `${media}%` }} /></div>
          <p className="meta">{feitos} de {itens.length} ambientes concluídos{filtro !== "geral" && ` em ${NOME_CATEGORIA[filtro]}`}</p>
        </section>
        <section className="vidro cartao-lateral">
          <h2 className="rotulo-tecnico">Ambientes pendentes</h2>
          {pendentes.length ? <ul className="lista">{pendentes.slice(0, 6).map((i) => (
            <li key={i.s.id}><LinhaAmbiente id={i.s.id} onDestacar={onDestacar} onClick={() => onSelecionar(i.s.id)} dica="Abrir o ambiente para marcar as categorias">
              <span className="nome">{i.s.name}</span>
              <span className="chip-nota num pequeno" style={{ "--cor": corProgresso(i.prog) }}>{i.prog}%</span>
            </LinhaAmbiente></li>
          ))}</ul> : <p className="vazio">Todos os ambientes do pavimento foram concluídos.</p>}
          {pendentes.length > 6 && <p className="meta">e mais {pendentes.length - 6} ambientes pendentes</p>}
        </section>
        <section className="vidro cartao-lateral">
          <h2 className="rotulo-tecnico">Legenda</h2>
          <ul className="legenda">{(filtro === "geral" ? [0, 25, 50, 75, 100] : [0, 100]).map((p) => (
            <li key={p}><span className="ponto" style={{ "--cor": corProgresso(p) }} />
              <span>{p === 0 ? "Pendente" : p === 100 ? "Concluído" : `${p / 25} de 4 categorias`}</span><span className="num faixa-num">{p}%</span></li>
          ))}</ul>
        </section>
      </aside>
    );
  }

  const comNota = itens.filter((i) => i.nota != null).sort((a, b) => b.nota - a.nota);
  const integ = integridade(itens.map((i) => i.nota ?? 1));
  const contagem = Object.fromEntries([...RISCOS.map((r) => r.id), "nenhum"].map((id) => [id, itens.filter((i) => i.risco === id).length]));

  return (
    <aside className="lateral" aria-label="Resumo do pavimento">
      <section className="vidro cartao-lateral">
        <h2 className="rotulo-tecnico">Top 3 críticos{filtro !== "geral" && ` · ${NOME_CATEGORIA[filtro]}`}</h2>
        {comNota.length ? (
          <ol className="lista top">{comNota.slice(0, 3).map((i, n) => (
            <li key={i.s.id}><LinhaAmbiente id={i.s.id} onDestacar={onDestacar} onClick={() => onSelecionar(i.s.id)}>
              <span className="posicao num">0{n + 1}</span>
              <span className="nome-bloco">
                <span className="nome">{i.s.name}</span>
                {i.pior && <span className="sub">{NOME_CATEGORIA[i.pior.categoria]} · {i.pior.descricao}</span>}
              </span>
              <Valor nota={i.nota} />
            </LinhaAmbiente></li>
          ))}</ol>
        ) : <p className="vazio">Nenhuma patologia registrada em {nomeFiltro(filtro)} no pavimento {nomeAndar.toLowerCase()}.</p>}
        {comNota.length > 3 && <Link href="/patologias" className="link-seta">Ver todas as patologias <ArrowRight /></Link>}
      </section>

      <section className="vidro cartao-lateral" data-dica="100% quando nenhum ambiente tem patologia; cai conforme as notas GUT sobem">
        <h2 className="rotulo-tecnico">Integridade · {nomeAndar}</h2>
        <p className="numero-grande num">{integ}<small>%</small></p>
        <div className="barra-progresso"><span style={{ width: `${integ}%` }} /></div>
      </section>

      <section className="vidro cartao-lateral">
        <h2 className="rotulo-tecnico">Legenda</h2>
        <ul className="legenda">
          {[...RISCOS].reverse().map((r) => (
            <li key={r.id} className={contagem[r.id] ? undefined : "zero"}>
              <span className="ponto" style={{ "--cor": corRisco(r.id) }} />
              <span>{r.nome}</span>
              <span className="faixa-num num">{r.faixa}</span>
              <span className="qtd num" title={`${contagem[r.id]} ${visao === "blocos" ? "áreas" : "ambientes"} neste nível`}>{contagem[r.id]}</span>
            </li>
          ))}
          <li className={contagem.nenhum ? undefined : "zero"}>
            <span className="ponto sem" />
            <span>Sem registro</span><span className="faixa-num num">—</span><span className="qtd num">{contagem.nenhum}</span>
          </li>
        </ul>
      </section>
    </aside>
  );
}

/* ---------- ambiente ou bloco selecionado ---------- */
export function PainelAmbiente({ id, visao, filtro, dados, edicao, onVoltar, onAbrirAmbiente, onDestacar }) {
  const { ambiente: s, andar, bloco } = INDICE[id];
  const ehBloco = !!s.members;
  const reg = dados[id];
  const nota = ehBloco ? notaBloco(dados, s.members, filtro) : notaAmbiente(reg, filtro);
  const r = risco(nota);

  return (
    <aside className="lateral" aria-label={`Detalhes de ${s.name}`}>
      <section className="vidro cartao-lateral detalhe">
        <button type="button" className="voltar" onClick={onVoltar} data-dica="Fecha os detalhes e volta ao resumo (Esc)"><ArrowLeft /> Resumo do pavimento</button>
        <div>
          <p className="rotulo-tecnico">{ehBloco ? `${s.members.length} ambientes · somente leitura` : `${bloco?.name.split(" · ")[0] ?? ""} · pavimento ${ANDARES[andar].nome.toLowerCase()}`}</p>
          <h2 className="titulo-detalhe">{s.name}</h2>
        </div>

        {visao === "progresso" && !ehBloco
          ? <Progresso id={id} reg={reg} filtro={filtro} edicao={edicao} />
          : <>
            {nota == null
              ? <p className="sem-nota">Sem patologia registrada em {nomeFiltro(filtro)}.</p>
              : <div className="destaque">
                  <span className="numero-grande num" style={{ color: corRisco(r) }}>{formatarNota(nota)}</span>
                  <span className="meta">{ehBloco ? "média GUT" : "GUT"} · {nomeFiltro(filtro)}</span>
                  <Pilula r={r} />
                </div>}

            <section>
              <h3 className="rotulo-tecnico">Por categoria</h3>
              <ul className="categorias">{CATEGORIAS.map((c) => (
                <li key={c.id} className={filtro === "geral" || filtro === c.id ? "atual" : undefined}>
                  <span>{c.nome}</span>
                  <Valor pequeno nota={ehBloco ? notaBloco(dados, s.members, c.id) : notaAmbiente(reg, c.id)} />
                </li>
              ))}</ul>
            </section>

            {ehBloco ? <>
              <MembrosBloco bloco={s} dados={dados} filtro={filtro} onAbrirAmbiente={onAbrirAmbiente} onDestacar={onDestacar} />
              {edicao && <p className="meta">A nota do bloco é a média dos ambientes. Para editar, abra um ambiente da lista.</p>}
            </> : <Patologias id={id} reg={reg} filtro={filtro} edicao={edicao} />}

            {!ehBloco && edicao && <Inspecao id={id} reg={reg} edicao={edicao} />}
            {!ehBloco && <Notas id={id} reg={reg} edicao={edicao} />}
          </>}
      </section>
    </aside>
  );
}

function Patologias({ id, reg, filtro, edicao }) {
  const [editando, setEditando] = useState(null); // id da patologia, "nova" ou null
  const [removendo, setRemovendo] = useState(null); // prévia: patologia sob o cursor do botão Remover
  const lista = (reg?.patologias ?? []).filter((p) => filtro === "geral" || p.categoria === filtro);
  const grupos = CATEGORIAS.map((c) => ({ ...c, itens: lista.filter((p) => p.categoria === c.id).sort((a, b) => gut(b) - gut(a)) }))
    .filter((g) => g.itens.length);
  const salvar = (p) => { edicao.salvarPatologia(id, p); setEditando(null); };
  const remover = (p) => { setRemovendo(null); if (confirm(`Remover a patologia "${p.descricao}"?`)) edicao.removerPatologia(id, p.id); };
  const nova = { id: novoId(id), categoria: filtro === "geral" ? "estrutura" : filtro, descricao: "", g: 1, u: 1, t: 1 };
  const notaAtual = notaAmbiente(reg);
  const notaSem = (p) => notaAmbiente({ patologias: (reg?.patologias ?? []).filter((x) => x.id !== p.id) });

  return (
    <section>
      <div className="cabeca-secao">
        <h3 className="rotulo-tecnico">Patologias · {lista.length}</h3>
        {edicao && editando !== "nova" && (
          <button type="button" className="botao-texto" onClick={() => setEditando("nova")} data-dica="Abre o formulário de uma nova patologia neste ambiente">
            <Plus /> Adicionar
          </button>
        )}
      </div>
      {editando === "nova" && <EditorPatologia inicial={nova} notaAtual={notaAtual} reg={reg} onSalvar={salvar} onCancelar={() => setEditando(null)} />}
      {!lista.length && editando !== "nova" && <p className="vazio">Nenhuma patologia registrada {filtro === "geral" ? "neste ambiente" : `em ${NOME_CATEGORIA[filtro]}`}.</p>}
      {grupos.map((g) => (
        <div key={g.id} className="grupo-cat">
          {filtro === "geral" && <h4>{g.nome}</h4>}
          {g.itens.map((p) => editando === p.id
            ? <EditorPatologia key={p.id} inicial={p} notaAtual={notaAtual} reg={reg} onSalvar={salvar} onCancelar={() => setEditando(null)} />
            : (
              <div key={p.id} className={`patologia${removendo === p.id ? " vai-remover" : ""}`}>
                <span className="desc">{p.descricao}</span>
                <Valor nota={gut(p)} pequeno />
                <span className="gut num">
                  {["g", "u", "t"].map((k, i) => (
                    <span key={k}>{i > 0 && " · "}<abbr title={`${ESCALA[k].nome} ${p[k]}: ${ESCALA[k].niveis[p[k] - 1]}`}>{k.toUpperCase()} {p[k]}</abbr></span>
                  ))}
                </span>
                {edicao && <span className="acoes-linha">
                  <button type="button" className="botao-texto" onClick={() => setEditando(p.id)} data-dica="Abre esta patologia no formulário"><Pencil /> Editar</button>
                  <button type="button" className="botao-texto perigo" onClick={() => remover(p)}
                    onPointerEnter={() => setRemovendo(p.id)} onPointerLeave={() => setRemovendo(null)}
                    onFocus={() => setRemovendo(p.id)} onBlur={() => setRemovendo(null)}><Trash2 /> Remover</button>
                </span>}
                {removendo === p.id && (
                  <span className="previa-texto">
                    Nota do ambiente: {formatarNota(notaAtual)} → {notaSem(p) == null ? "sem registro" : formatarNota(notaSem(p))}
                  </span>
                )}
              </div>
            ))}
        </div>
      ))}
    </section>
  );
}

function Inspecao({ id, reg, edicao }) {
  const [sobre, setSobre] = useState(null);
  const atual = progresso(reg);
  return (
    <section>
      <h3 className="rotulo-tecnico">
        Inspeção · {atual}% concluída
        {sobre && <span className="previa-texto em-linha"> → {atual + (reg?.concluido?.[sobre] ? -25 : 25)}%</span>}
      </h3>
      <ul className="categorias">{CATEGORIAS.map((c) => {
        const feito = !!reg?.concluido?.[c.id];
        return (
          <li key={c.id} className="atual">
            <span>{c.nome}</span>
            {edicao
              ? <button type="button" className={`marcar${feito ? " feito" : ""}`} aria-pressed={feito} data-som="salvar"
                  aria-label={`${c.nome}: ${feito ? "concluída, reabrir" : "marcar como concluída"}`}
                  onPointerEnter={() => setSobre(c.id)} onPointerLeave={() => setSobre(null)}
                  onFocus={() => setSobre(c.id)} onBlur={() => setSobre(null)}
                  onClick={() => edicao.alternarConcluido(id, c.id)}>
                  <Check /> <span className="estado">{feito ? "Concluída" : "Pendente"}</span>
                  <span className="acao-hover">{feito ? "Reabrir" : "Concluir"}</span>
                </button>
              : <span className="estado-leitura" style={{ "--cor": feito ? "var(--conclusao-4)" : "var(--muted-foreground)" }}>{feito ? "Concluída" : "Pendente"}</span>}
          </li>
        );
      })}</ul>
    </section>
  );
}

function Notas({ id, reg, edicao }) {
  if (!edicao) return reg?.notas ? <section><h3 className="rotulo-tecnico">Anotações</h3><p className="notas">{reg.notas}</p></section> : null;
  return (
    <section className="campo">
      <label htmlFor={`notas-${id}`} className="rotulo-tecnico">Anotações</label>
      <textarea id={`notas-${id}`} rows={3} defaultValue={reg?.notas ?? ""} placeholder="Observações do ambiente (medições, fotos, contexto)"
        onBlur={(e) => { if (e.target.value !== (reg?.notas ?? "")) edicao.definirNotas(id, e.target.value); }} />
      <p className="meta">Salva ao sair do campo, no rascunho deste navegador.</p>
    </section>
  );
}

function MembrosBloco({ bloco, dados, filtro, onAbrirAmbiente, onDestacar }) {
  const membros = bloco.members.map((id) => ({ s: INDICE[id].ambiente, nota: notaAmbiente(dados[id], filtro) }))
    .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0) || a.s.name.localeCompare(b.s.name, "pt-BR"));
  const comNota = membros.filter((m) => m.nota != null);
  const limite = Math.max(6, comNota.length);
  return (
    <section>
      <h3 className="rotulo-tecnico">Ambientes individuais · {comNota.length} com patologia</h3>
      <ul className="lista">{membros.slice(0, limite).map((m) => (
        <li key={m.s.id}><LinhaAmbiente id={m.s.id} onDestacar={onDestacar} onClick={() => onAbrirAmbiente(m.s.id)} dica="Abre este ambiente na visão de ambientes individuais">
          <span className="nome">{m.s.name}</span>
          <Valor nota={m.nota} pequeno />
        </LinhaAmbiente></li>
      ))}</ul>
      {membros.length > limite && <p className="meta">e mais {membros.length - limite} ambientes sem patologia registrada</p>}
    </section>
  );
}

function Progresso({ id, reg, filtro, edicao }) {
  const prog = progresso(reg, filtro);
  return <>
    <div className="destaque">
      <span className="numero-grande num" style={{ color: corProgresso(prog) }}>{prog}<small>%</small></span>
      <span className="meta">concluído · {nomeFiltro(filtro)}</span>
    </div>
    <Inspecao id={id} reg={reg} edicao={edicao} />
    {!edicao && <p className="meta">Ative o modo edição (lápis no topo) para marcar as categorias concluídas.</p>}
    <Notas id={id} reg={reg} edicao={edicao} />
  </>;
}
