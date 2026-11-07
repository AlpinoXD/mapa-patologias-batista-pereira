import { useState } from "react";
import { CATEGORIAS, ESCALA, gut, NOME_RISCO, risco, RISCOS } from "../lib/gut.js";
import { corRisco } from "../lib/cores.js";
import { Link } from "../lib/rotas.jsx";

const O_QUE_ENTRA = {
  estrutura: "Fissuras, trincas, recalques, armaduras expostas e deformações em lajes, vigas, pilares e alvenarias.",
  hidraulica: "Infiltrações, vazamentos, umidade, ralos e caixas de gordura, calhas, rufos e a cobertura.",
  eletrica: "Fiação exposta, quadros e tomadas danificados, iluminação deficiente e pontos próximos à umidade.",
  revestimentos: "Pisos, azulejos e pastilhas soltos ou ocos, rejuntes, pintura, reboco e forros.",
};

export function MatrizGut() {
  const [n, setN] = useState({ g: 4, u: 3, t: 4 });
  const [sobre, setSobre] = useState(null); // nota sob o cursor: mostra o resultado antes do clique
  const exibido = sobre ? { ...n, [sobre.k]: sobre.v } : n;
  const nota = gut(exibido);
  const r = risco(nota);

  return (
    <>
      <header className="cabecalho">
        <h1>Matriz GUT</h1>
        <p className="achado">Cada patologia recebe três notas de 1 a 5. A nota final é o produto delas, de 1 a 125, e define a cor do ambiente no mapa.</p>
      </header>

      <div className="matriz">
        <section className="vidro painel-pagina calculadora" aria-labelledby="calc-titulo">
          <h2 id="calc-titulo" className="rotulo-tecnico">Calcule uma nota</h2>
          {["g", "u", "t"].map((k) => (
            <fieldset key={k} className="campo">
              <legend className="rotulo-tecnico">{ESCALA[k].nome}</legend>
              <div className="escala" onPointerLeave={() => setSobre(null)}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" className={`num${sobre?.k === k && sobre.v === v && n[k] !== v ? " em-previa" : ""}`}
                    aria-pressed={n[k] === v} aria-label={`${ESCALA[k].nome} ${v}: ${ESCALA[k].niveis[v - 1]}`}
                    onPointerEnter={() => setSobre({ k, v })} onFocus={() => setSobre({ k, v })} onBlur={() => setSobre(null)}
                    onClick={() => { setN({ ...n, [k]: v }); setSobre(null); }}>{v}</button>
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
          <Regua nota={nota} />
        </section>

        <section className="vidro painel-pagina" aria-labelledby="escala-titulo">
          <h2 id="escala-titulo" className="rotulo-tecnico">O que cada nota significa</h2>
          <div className="tabela-caixa">
            <table className="tabela escala-tabela">
              <thead><tr><th className="n">Nota</th>{["g", "u", "t"].map((k) => <th key={k}>{ESCALA[k].nome}</th>)}</tr></thead>
              <tbody>{[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}><td className="n num">{i + 1}</td>{["g", "u", "t"].map((k) => <td key={k}>{ESCALA[k].niveis[i]}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
          <p className="meta">Gravidade: o dano que a patologia causa ou pode causar. Urgência: o prazo para agir. Tendência: como ela evolui se nada for feito.</p>
        </section>
      </div>

      <div className="matriz">
        <section className="vidro painel-pagina" aria-labelledby="faixas-titulo">
          <h2 id="faixas-titulo" className="rotulo-tecnico">Faixas de risco</h2>
          <ul className="legenda sem-qtd">
            {[...RISCOS].reverse().map((x) => (
              <li key={x.id}><span className="ponto" style={{ "--cor": corRisco(x.id) }} /><span>{x.nome}</span><span className="faixa-num num">{x.faixa}</span></li>
            ))}
            <li><span className="ponto sem" /><span>Sem registro</span><span className="faixa-num num">—</span></li>
          </ul>
          <h3 className="rotulo-tecnico" style={{ marginTop: 8 }}>Como o mapa calcula</h3>
          <ul className="regras">
            <li><b>Ambiente:</b> a maior nota entre as patologias dele (na categoria escolhida, ou em todas).</li>
            <li><b>Bloco:</b> a média das notas das patologias dos seus ambientes, contando 1 para cada categoria sem patologia. Por isso um bloco grande com um só problema grave fica com média baixa: abra o bloco para ver o ambiente.</li>
            <li><b>Progresso:</b> cada uma das quatro categorias concluídas na inspeção vale 25%.</li>
          </ul>
        </section>

        <section className="vidro painel-pagina" aria-labelledby="cat-titulo">
          <h2 id="cat-titulo" className="rotulo-tecnico">Categorias</h2>
          <dl className="categorias-def">
            {CATEGORIAS.map((c) => <div key={c.id}><dt>{c.nome}</dt><dd>{O_QUE_ENTRA[c.id]}</dd></div>)}
          </dl>
          <Link href="/" className="link">Voltar ao mapa</Link>
        </section>
      </div>
    </>
  );
}

/** Régua de 1 a 125 com as faixas de risco na largura real e a nota calculada marcada. */
function Regua({ nota }) {
  const pos = (v) => ((v - 1) / 124) * 100;
  const faixas = [...RISCOS].reverse().map((x, i, arr) => ({ ...x, de: x.min, ate: arr[i + 1]?.min ?? 126 }));
  return (
    <div className="regua" aria-hidden>
      <div className="regua-faixas">
        {faixas.map((f) => <span key={f.id} style={{ left: `${pos(f.de)}%`, width: `${pos(f.ate) - pos(f.de)}%`, background: corRisco(f.id) }} />)}
        <i style={{ left: `${pos(nota)}%` }} />
      </div>
      <div className="regua-num num"><span>1</span><span style={{ left: `${pos(25)}%` }}>25</span><span style={{ left: `${pos(49)}%` }}>49</span><span style={{ left: `${pos(80)}%` }}>80</span><span>125</span></div>
    </div>
  );
}
