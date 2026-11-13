import { useRef, useState } from "react";
import { Download, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { Avatar, haQuanto, primeiroNome, useColab } from "../lib/colab.jsx";
import { apagarTudo, DONO, nomeAmbiente, senhaCorreta } from "../lib/nuvem.js";

const valido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Lista de quem pode editar, cópia de segurança e importação. Só administradores chegam aqui. */
export function Equipe({ acesso, inspecao }) {
  const { pessoas, atividades } = useColab();
  const [novo, setNovo] = useState("");
  const [comoAdmin, setComoAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const arquivo = useRef(null);

  const salvar = async (editores, admins, texto) => {
    try { await acesso.salvar(editores, admins); setMsg(texto); } catch { setMsg("Não foi possível salvar a lista. Confira se as regras do Firestore foram publicadas."); }
  };
  const adicionar = (e) => {
    e.preventDefault();
    const email = novo.trim().toLowerCase();
    if (!valido(email)) { setMsg("Digite um e-mail válido."); return; }
    salvar(comoAdmin ? acesso.editores : [...acesso.editores, email], comoAdmin ? [...acesso.admins, email] : acesso.admins, `${email} agora pode ${comoAdmin ? "administrar" : "editar"}.`);
    setNovo("");
  };
  const remover = (email) => {
    if (!confirm(`Tirar ${email} da equipe? A pessoa continua vendo o mapa, mas não edita mais.`)) return;
    salvar(acesso.editores.filter((x) => x !== email), acesso.admins.filter((x) => x !== email), `${email} saiu da equipe.`);
  };
  const importar = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f || !confirm("Importar substitui TODOS os dados do mapa para toda a equipe. Baixe uma cópia antes se tiver dúvida. Continuar?")) return;
    try { await inspecao.importar(await f.text()); setMsg("Arquivo importado para toda a equipe."); } catch (err) { setMsg(`Não foi possível importar: ${err.message}.`); }
  };

  const membros = [
    { email: DONO, papel: "Dono do projeto", fixo: true },
    ...acesso.admins.filter((e) => e !== DONO).map((email) => ({ email, papel: "Administrador" })),
    ...acesso.editores.filter((e) => e !== DONO && !acesso.admins.includes(e)).map((email) => ({ email, papel: "Editor" })),
  ];

  return (
    <>
      <header className="cabecalho">
        <div>
          <h1>Equipe e permissões</h1>
          <p className="achado">Qualquer conta Google pode entrar e ver o mapa. Só quem está nesta lista edita as notas, patologias e anotações.</p>
        </div>
      </header>
      {msg && <p className="aviso" role="status">{msg}</p>}

      <div className="matriz">
        <section className="vidro painel-pagina" aria-labelledby="equipe-titulo">
          <h2 id="equipe-titulo" className="rotulo-tecnico">Quem pode editar · {membros.length}</h2>
          <form className="adicionar-email" onSubmit={adicionar}>
            <label className="sr" htmlFor="novo-email">E-mail</label>
            <input id="novo-email" type="email" value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="email@exemplo.com" autoComplete="off" />
            <label className="marcador" data-dica="Administradores também podem mudar esta lista e importar dados">
              <input type="checkbox" checked={comoAdmin} onChange={(e) => setComoAdmin(e.target.checked)} /> Administrador
            </label>
            <button type="submit" className="botao primario" data-som="salvar" disabled={!novo.trim()}
              data-dica={novo.trim() ? `${novo.trim()} poderá ${comoAdmin ? "administrar" : "editar"} o mapa assim que entrar` : "Digite um e-mail para liberar"}>
              <Plus /> Liberar
            </button>
          </form>
          <ul className="lista">{membros.map((m) => (
            <li key={m.email} className="linha-membro">
              <ShieldCheck aria-hidden />
              <span className="nome-bloco"><span className="nome">{m.email}</span><span className="sub">{m.papel}</span></span>
              {!m.fixo && <button type="button" className="botao-texto perigo" onClick={() => remover(m.email)}
                data-dica="Tira a permissão de edição; a pessoa continua vendo o mapa"><X /> Remover</button>}
            </li>
          ))}</ul>
        </section>

        <div className="lateral">
          <section className="vidro painel-pagina" aria-labelledby="online-titulo">
            <h2 id="online-titulo" className="rotulo-tecnico">Online agora · {pessoas.length + 1}</h2>
            <p className="meta">Você e {pessoas.length ? pessoas.map((p) => primeiroNome(p.nome)).join(", ") : "mais ninguém no momento"}.</p>
          </section>
          <section className="vidro painel-pagina" aria-labelledby="copia-titulo">
            <h2 id="copia-titulo" className="rotulo-tecnico">Cópia de segurança</h2>
            <p className="meta">Baixe os dados de vez em quando. O arquivo também serve para restaurar tudo.</p>
            <div className="acoes">
              <button type="button" className="botao" onClick={inspecao.baixarCopia} data-dica="Baixa um inspecao.json com todos os ambientes como estão agora">
                <Download /> Baixar cópia</button>
              <button type="button" className="botao" onClick={() => arquivo.current.click()} data-dica="Substitui os dados de toda a equipe pelo conteúdo do arquivo">
                <Upload /> Importar arquivo</button>
              <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={importar} />
            </div>
          </section>
          <section className="vidro painel-pagina" aria-labelledby="ativ-titulo">
            <h2 id="ativ-titulo" className="rotulo-tecnico">Atividade recente</h2>
            {atividades.length ? <ul className="atividades">{atividades.map((a) => (
              <li key={a.id}><Avatar pessoa={a} tamanho={24} /><span><b>{primeiroNome(a.nome)}</b> {a.texto}<small>{haQuanto(a.quando)}{a.ambiente && ` · ${nomeAmbiente(a.ambiente)}`}</small></span></li>
            ))}</ul> : <p className="vazio">Nenhuma alteração registrada ainda.</p>}
          </section>
        </div>
      </div>

      <ZonaDePerigo inspecao={inspecao} />
    </>
  );
}

/** Botão vermelho: 1) abrir, 2) digitar a senha, 3) confirmar. Cada passo diz o que vai acontecer. */
function ZonaDePerigo({ inspecao }) {
  const [etapa, setEtapa] = useState("fechada"); // fechada → senha → pronta → apagando → feito
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [total, setTotal] = useState(0);
  const campo = useRef(null);

  const abrir = () => { setEtapa("senha"); setSenha(""); setErro(""); setTimeout(() => campo.current?.focus(), 50); };
  const cancelar = () => { setEtapa("fechada"); setSenha(""); setErro(""); };
  const conferir = async (e) => {
    e.preventDefault();
    if (await senhaCorreta(senha)) { setEtapa("pronta"); setErro(""); } else { setErro("Senha incorreta."); campo.current?.select(); }
  };
  const apagar = async () => {
    setEtapa("apagando");
    try { setTotal(await apagarTudo()); setEtapa("feito"); } catch { setErro("Não foi possível apagar. Confira a conexão e se as regras do Firestore foram publicadas."); setEtapa("pronta"); }
  };

  return (
    <section className="vidro painel-pagina zona-perigo" aria-labelledby="perigo-titulo">
      <h2 id="perigo-titulo" className="rotulo-tecnico">Zona de perigo</h2>
      {etapa === "fechada" && <>
        <p className="meta">Apaga para toda a equipe todas as patologias, notas GUT, fotos, anotações, progresso e o histórico de atividade. A lista de pessoas com acesso é mantida.</p>
        <div className="acoes">
          <button type="button" className="botao apagar" onClick={abrir} data-dica="Pede uma senha antes de apagar qualquer coisa; nada é apagado neste clique"><Trash2 /> Apagar tudo</button>
          <button type="button" className="botao" onClick={inspecao.baixarCopia} data-dica="Recomendado antes de apagar: baixa os dados (sem as fotos)"><Download /> Baixar cópia antes</button>
        </div>
      </>}
      {etapa === "senha" && (
        <form className="adicionar-email" onSubmit={conferir}>
          <label className="sr" htmlFor="senha-apagar">Senha para apagar</label>
          <input id="senha-apagar" ref={campo} type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }}
            placeholder="Senha" autoComplete="off" aria-invalid={!!erro} />
          <button type="submit" className="botao apagar" disabled={!senha} data-dica="Confere a senha; ainda não apaga nada">Confirmar senha</button>
          <button type="button" className="botao-texto" onClick={cancelar}>Cancelar</button>
          {erro && <p className="erro" role="alert">{erro}</p>}
        </form>
      )}
      {(etapa === "pronta" || etapa === "apagando") && <>
        <p className="aviso-perigo" role="alert"><b>Senha correta.</b> O próximo clique apaga tudo, para todos, e não dá para desfazer.</p>
        <div className="acoes">
          <button type="button" className="botao apagar forte" onClick={apagar} disabled={etapa === "apagando"} data-dica="Apaga agora, para toda a equipe, sem volta">
            <Trash2 /> {etapa === "apagando" ? "Apagando…" : "Apagar tudo agora"}
          </button>
          <button type="button" className="botao-texto" onClick={cancelar} disabled={etapa === "apagando"}>Cancelar</button>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
      </>}
      {etapa === "feito" && <>
        <p role="status"><b>Tudo apagado</b> ({total} registros). O mapa está limpo para toda a equipe.</p>
        <div className="acoes"><button type="button" className="botao" onClick={cancelar}>Fechar</button></div>
      </>}
    </section>
  );
}
