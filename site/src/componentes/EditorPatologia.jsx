import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, ESCALA, formatarNota, gut, NOME_RISCO, notaAmbiente, risco } from "../lib/gut.js";
import { corRisco } from "../lib/cores.js";

/**
 * Formulário de uma patologia: categoria, descrição e as três notas, com o significado de cada nível.
 * Passar o cursor sobre uma nota mostra o resultado antes do clique, e o rodapé diz como a nota do
 * ambiente vai mudar ao salvar.
 */
export function EditorPatologia({ inicial, reg, onSalvar, onCancelar }) {
  const [p, setP] = useState(inicial);
  const [sobre, setSobre] = useState(null); // { k, n }: nota sob o cursor
  const [erro, setErro] = useState("");
  const descRef = useRef(null);
  useEffect(() => { descRef.current?.focus(); }, []);

  const exibido = sobre ? { ...p, [sobre.k]: sobre.n } : p;
  const nota = gut(exibido);
  const r = risco(nota);
  const antes = notaAmbiente(reg);
  const depois = notaAmbiente({ patologias: [...(reg?.patologias ?? []).filter((x) => x.id !== p.id), exibido] });

  const salvar = (e) => {
    e.preventDefault();
    if (!p.descricao.trim()) { setErro("Descreva a patologia antes de salvar."); descRef.current.focus(); return; }
    onSalvar({ ...p, descricao: p.descricao.trim() });
  };

  return (
    <form className="editor" onSubmit={salvar} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onCancelar(); } }}
      aria-label={inicial.descricao ? "Editar patologia" : "Nova patologia"}>
      <fieldset className="campo">
        <legend className="rotulo-tecnico">Categoria</legend>
        <div className="segmentos">
          {CATEGORIAS.map((c) => (
            <button key={c.id} type="button" aria-pressed={p.categoria === c.id} onClick={() => setP({ ...p, categoria: c.id })}>{c.nome}</button>
          ))}
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor="desc-patologia" className="rotulo-tecnico">Descrição</label>
        <textarea id="desc-patologia" ref={descRef} rows={2} value={p.descricao} aria-invalid={!!erro} aria-describedby={erro ? "erro-patologia" : undefined}
          placeholder="Ex.: infiltração na laje sobre o forro" onChange={(e) => { setP({ ...p, descricao: e.target.value }); setErro(""); }} />
        {erro && <p id="erro-patologia" className="erro">{erro}</p>}
      </div>

      {["g", "u", "t"].map((k) => (
        <fieldset key={k} className="campo">
          <legend className="rotulo-tecnico">{ESCALA[k].nome}</legend>
          <div className="escala" onPointerLeave={() => setSobre(null)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={`num${sobre?.k === k && sobre.n === n && p[k] !== n ? " em-previa" : ""}`}
                aria-pressed={p[k] === n} aria-label={`${ESCALA[k].nome} ${n}: ${ESCALA[k].niveis[n - 1]}`}
                onPointerEnter={() => setSobre({ k, n })} onFocus={() => setSobre({ k, n })} onBlur={() => setSobre(null)}
                onClick={() => { setP({ ...p, [k]: n }); setSobre(null); }}>{n}</button>
            ))}
            <span className={`nivel${sobre?.k === k ? " previa" : ""}`}>{ESCALA[k].niveis[exibido[k] - 1]}</span>
          </div>
        </fieldset>
      ))}

      <div className={`resultado${sobre ? " previa" : ""}`} aria-live="polite">
        <span className="num">{exibido.g} × {exibido.u} × {exibido.t} =</span>
        <span className="num grande-m" style={{ color: corRisco(r) }}>{nota}</span>
        <span className="pilula-risco" style={{ "--cor": corRisco(r) }}>{NOME_RISCO[r]}</span>
      </div>
      <p className="meta">
        Ao salvar, a nota do ambiente {antes === depois ? <>fica em <b className="num">{formatarNota(depois)}</b></> : <>vai de <b className="num">{formatarNota(antes)}</b> para <b className="num">{formatarNota(depois)}</b></>}.
      </p>

      <div className="acoes">
        <button type="submit" className="botao primario" data-som="salvar">Salvar patologia</button>
        <button type="button" className="botao" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
