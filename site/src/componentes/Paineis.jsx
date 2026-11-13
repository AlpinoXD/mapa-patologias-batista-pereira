import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ANDARES, INDICE } from "../dados/planta.js";
import { CATEGORIAS, ESCALA, formatarNota, gut, integridade, NOME_CATEGORIA, NOME_RISCO, notaAmbiente, notaBloco, progresso, risco, RISCOS } from "../lib/gut.js";
import { corProgresso, corRisco } from "../lib/cores.js";
import { novoId } from "../lib/acoes.js";
import { Avatar, haQuanto, primeiroNome, useColab } from "../lib/colab.jsx";
import { nomeAmbiente, useFotos } from "../lib/nuvem.js";
import { Link } from "../lib/rotas.jsx";
import { EditorPatologia } from "./EditorPatologia.jsx";
import { Fotos } from "./Fotos.jsx";

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
export function PainelResumo({ andar, visao, filtro, itens, onSelecionar, onAbrirAmbiente, onDestacar }) {
  const nomeAndar = ANDARES[andar].nome;
  const recentes = <AtividadeRecente onAbrirAmbiente={onAbrirAmbiente} onDestacar={onDestacar} />;

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
        {recentes}
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
      {recentes}
    </aside>
  );
}

function AtividadeRecente({ onAbrirAmbiente, onDestacar }) {
  const { atividades } = useColab();
  if (!atividades?.length) return null;
  return (
    <section className="vidro cartao-lateral">
      <h2 className="rotulo-tecnico">Atividade recente</h2>
      <ul className="atividades">{atividades.slice(0, 5).map((a) => (
        <li key={a.id}>
          <Avatar pessoa={a} tamanho={24} />
          {a.ambiente
            ? <button type="button" className="atividade-link" onClick={() => onAbrirAmbiente(a.ambiente)} data-dica={`Abre ${nomeAmbiente(a.ambiente)} na planta`}
                onPointerEnter={() => onDestacar?.(a.ambiente)} onPointerLeave={() => onDestacar?.(null)}>
                <b>{primeiroNome(a.nome)}</b> {a.texto}<small>{haQuanto(a.quando)}</small>
              </button>
            : <span><b>{primeiroNome(a.nome)}</b> {a.texto}<small>{haQuanto(a.quando)}</small></span>}
        </li>
      ))}</ul>
    </section>
  );
}

/** Quem mais está neste ambiente agora e quem o alterou por último. */
function QuemEsta({ id }) {
  const { pessoas, meta } = useColab();
  const aqui = pessoas.filter((p) => p.onde?.ambiente === id);
  const ultimo = meta[id];
  if (!aqui.length && !ultimo?.por) return null;
  return (
    <div className="quem-esta">
      {aqui.length > 0 && (
        <span className="aqui-agora">
          {aqui.map((p) => <Avatar key={p.uid} pessoa={p} tamanho={22} />)}
          {aqui.map((p) => primeiroNome(p.nome)).join(", ")} {aqui.some((p) => p.onde.editando) ? "editando agora" : aqui.length === 1 ? "também está aqui" : "também estão aqui"}
        </span>
      )}
      {ultimo?.por && <span className="meta">Última alteração: {primeiroNome(ultimo.por.nome)}, {haQuanto(ultimo.em)}</span>}
    </div>
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
        {!ehBloco && <QuemEsta id={id} />}

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
              {edicao && <p className="meta">A nota do bloco é a média dos ambientes. Para editar a GUT, abra um ambiente da lista.</p>}
            </> : <Patologias id={id} reg={reg} filtro={filtro} edicao={edicao} />}

            {!ehBloco && edicao && <Inspecao id={id} reg={reg} edicao={edicao} />}
            {!ehBloco && <Notas id={id} reg={reg} edicao={edicao} />}
          </>}
      </section>
    </aside>
  );
}

function Patologias({ id, reg, filtro, edicao }) {
  const { definirOnde, usuario } = useColab();
  const fotos = useFotos(usuario, id);
  const [editando, setEditando] = useState(null); // id da patologia, "nova:<categoria>" ou null
  const [removendo, setRemovendo] = useState(null); // prévia: patologia sob o cursor do botão Remover
  useEffect(() => { definirOnde({ editando: editando ? "patologia" : null }); }, [editando]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => definirOnde({ editando: null }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const lista = (reg?.patologias ?? []).filter((p) => filtro === "geral" || p.categoria === filtro);
  const categorias = CATEGORIAS.filter((c) => filtro === "geral" || filtro === c.id);
  // quem edita vê todas as categorias, mesmo vazias, cada uma com o seu "Adicionar"
  const grupos = categorias.map((c) => ({ ...c, itens: lista.filter((p) => p.categoria === c.id).sort((a, b) => gut(b) - gut(a)) }))
    .filter((g) => edicao || g.itens.length);
  const salvar = (p) => { edicao.salvarPatologia(id, p).catch(() => {}); setEditando(null); };
  const remover = (p) => { setRemovendo(null); if (confirm(`Remover a patologia "${p.descricao}"?`)) edicao.removerPatologia(id, p.id).catch(() => {}); };
  const notaAtual = notaAmbiente(reg);
  const notaSem = (p) => notaAmbiente({ patologias: (reg?.patologias ?? []).filter((x) => x.id !== p.id) });

  return (
    <section>
      <h3 className="rotulo-tecnico">Patologias · {lista.length}</h3>
      {!lista.length && !edicao && <p className="vazio">Nenhuma patologia registrada {filtro === "geral" ? "neste ambiente" : `em ${NOME_CATEGORIA[filtro]}`}.</p>}
      {grupos.map((g) => (
        <div key={g.id} className="grupo-cat">
          <div className="cabeca-secao">
            <h4>{g.nome} <span className="num">{g.itens.length ? `· GUT ${formatarNota(Math.max(...g.itens.map(gut)))}` : ""}</span></h4>
            {edicao && editando !== `nova:${g.id}` && (
              <button type="button" className="botao-texto" onClick={() => setEditando(`nova:${g.id}`)} data-dica={`Registra uma patologia de ${g.nome} neste ambiente`}>
                <Plus /> Adicionar
              </button>
            )}
          </div>
          {editando === `nova:${g.id}` && (
            <EditorPatologia inicial={{ id: novoId(id), categoria: g.id, descricao: "", g: 1, u: 1, t: 1 }} reg={reg} onSalvar={salvar} onCancelar={() => setEditando(null)} />
          )}
          {edicao && !g.itens.length && editando !== `nova:${g.id}` && <p className="vazio-cat">Sem patologia registrada.</p>}
          {g.itens.map((p) => editando === p.id
            ? <EditorPatologia key={p.id} inicial={p} reg={reg} onSalvar={salvar} onCancelar={() => setEditando(null)} />
            : (
              <div key={p.id} className={`patologia${removendo === p.id ? " vai-remover" : ""}`}>
                <span className="desc">{p.descricao}</span>
                <Valor nota={gut(p)} pequeno />
                <span className="gut num">
                  {["g", "u", "t"].map((k, i) => (
                    <span key={k}>{i > 0 && " · "}<abbr title={`${ESCALA[k].nome} ${p[k]}: ${ESCALA[k].niveis[p[k] - 1]}`}>{k.toUpperCase()} {p[k]}</abbr></span>
                  ))}
                </span>
                <Fotos ambiente={id} patologia={p} fotos={fotos.filter((f) => f.patologia === p.id)} edicao={edicao} />
                {edicao && <span className="acoes-linha">
                  <button type="button" className="botao-texto" onClick={() => setEditando(p.id)} data-dica="Abre esta patologia para mudar a descrição ou as notas G, U e T"><Pencil /> Editar GUT</button>
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
                  onClick={() => edicao.alternarConcluido(id, c.id).catch(() => {})}>
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
  const { pessoas, definirOnde } = useColab();
  const remoto = reg?.notas ?? "";
  const [texto, setTexto] = useState(remoto);
  const [estado, setEstado] = useState("");
  const focado = useRef(false), mudou = useRef(false), timer = useRef(0);
  const outro = pessoas.find((p) => p.onde?.ambiente === id && p.onde?.editando === "notas");

  // o texto que chega de outra pessoa entra na hora, a não ser que eu esteja digitando
  useEffect(() => { if (!focado.current) setTexto(remoto); }, [remoto]);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!edicao) return remoto ? <section><h3 className="rotulo-tecnico">Anotações</h3><p className="notas">{remoto}</p></section> : null;

  const gravar = (valor, registrar) => {
    setEstado("salvando");
    edicao.definirNotas(id, valor, registrar).then(() => setEstado("salvo"), () => setEstado("erro"));
  };
  return (
    <section className="campo">
      <label htmlFor={`notas-${id}`} className="rotulo-tecnico">Anotações</label>
      {outro && <p className="aviso-outro"><Avatar pessoa={outro} tamanho={18} /> {primeiroNome(outro.nome)} está escrevendo aqui agora</p>}
      <textarea id={`notas-${id}`} rows={3} value={texto} placeholder="Observações do ambiente (medições, fotos, contexto)"
        onFocus={() => { focado.current = true; definirOnde({ editando: "notas" }); }}
        onChange={(e) => {
          const v = e.target.value;
          setTexto(v); mudou.current = true; setEstado("digitando");
          clearTimeout(timer.current);
          timer.current = setTimeout(() => gravar(v, false), 700);
        }}
        onBlur={() => {
          focado.current = false; definirOnde({ editando: null });
          clearTimeout(timer.current);
          if (mudou.current) { gravar(texto, true); mudou.current = false; }
        }} />
      <p className="meta" aria-live="polite">
        {estado === "salvando" ? "Salvando…" : estado === "salvo" ? "Salvo para toda a equipe." : estado === "erro" ? "Não foi possível salvar." : estado === "digitando" ? "Digitando…" : "Salva sozinho enquanto você escreve."}
      </p>
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
    
    <Notas id={id} reg={reg} edicao={edicao} />
  </>;
}
