import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, CloudOff, List, LoaderCircle, LogOut, Map as IconeMapa, Users, Volume2, VolumeX } from "lucide-react";
import base from "./dados/inspecao.json";
import { Avatar, Colab, primeiroNome } from "./lib/colab.jsx";
import { gut, NOME_CATEGORIA } from "./lib/gut.js";
import { comprimir } from "./lib/imagem.js";
import { anexarFoto, carregarIniciais, configurado, mudar, nomeAmbiente, removerFoto, removerFotosDe, sair, useAcesso, useAtividades, useInspecao, usePresenca, useUsuario } from "./lib/nuvem.js";
import { useSons } from "./lib/sons.js";
import { Link, useRota } from "./lib/rotas.jsx";
import { Dicas } from "./componentes/Dicas.jsx";
import { TelaLogin } from "./componentes/TelaLogin.jsx";
import { Mapa } from "./paginas/Mapa.jsx";
import { Patologias } from "./paginas/Patologias.jsx";
import { MatrizGut } from "./paginas/MatrizGut.jsx";
import { Equipe } from "./paginas/Equipe.jsx";

const PAGINAS = [
  { href: "/", nome: "Mapa de calor", curto: "Mapa", icone: IconeMapa, dica: "Planta com o calor das notas GUT" },
  { href: "/patologias", nome: "Patologias", curto: "Patologias", icone: List, dica: "Todas as patologias numa tabela" },
  { href: "/matriz-gut", nome: "Matriz GUT", curto: "Matriz GUT", icone: BookOpen, dica: "Como as notas são dadas" },
];
const TITULOS = { "/": "Mapa de patologias", "/patologias": "Patologias registradas", "/matriz-gut": "Matriz GUT", "/equipe": "Equipe" };

export default function App() {
  const usuario = useUsuario();
  if (!configurado) return <TelaLogin pendente />;
  if (usuario === undefined) return <div className="carregando-tela"><LoaderCircle className="girando" aria-label="Carregando" /></div>;
  if (!usuario) return <><TelaLogin /><Dicas /></>;
  return <Aplicativo usuario={usuario} />;
}

function Aplicativo({ usuario }) {
  const rota = useRota();
  const sons = useSons();
  const acesso = useAcesso(usuario);
  const inspecao = useInspecao(usuario, acesso.editor);
  const atividades = useAtividades(usuario);
  const [onde, setOnde] = useState({ ambiente: null, editando: null });
  const pagina = TITULOS[rota] && (rota !== "/equipe" || acesso.admin) ? rota : "/";
  const pessoas = usePresenca(usuario, { pagina, ...onde });
  document.title = `${TITULOS[pagina]} · EBM Batista Pereira`;

  // ações de edição já ligadas ao banco, cada uma com a frase que entra na atividade recente
  const edicao = useMemo(() => {
    if (!acesso.editor) return null;
    const amb = inspecao.ambientes;
    return {
      salvarPatologia: (id, p) => {
        const existia = amb[id]?.patologias.some((x) => x.id === p.id);
        return inspecao.alterar(id, mudar.patologia(p),
          `${existia ? "editou" : "adicionou"} “${p.descricao}” (${NOME_CATEGORIA[p.categoria]}, GUT ${gut(p)}) em ${nomeAmbiente(id)}`);
      },
      removerPatologia: (id, pid) => {
        const p = amb[id]?.patologias.find((x) => x.id === pid);
        removerFotosDe(pid).catch(() => {});
        return inspecao.alterar(id, mudar.removerPatologia(pid), `removeu “${p?.descricao ?? "patologia"}” de ${nomeAmbiente(id)}`);
      },
      anexarFoto: async (id, p, arquivo) =>
        anexarFoto(usuario, id, p.id, await comprimir(arquivo), `anexou uma foto a “${p.descricao}” em ${nomeAmbiente(id)}`),
      removerFoto: (foto) => removerFoto(foto.id),
      definirNotas: (id, texto, registrar) => inspecao.alterar(id, mudar.notas(texto), registrar ? `atualizou as anotações de ${nomeAmbiente(id)}` : null),
      alternarConcluido: (id, cat) => {
        const feito = amb[id]?.concluido?.[cat];
        return inspecao.alterar(id, mudar.concluido(cat, !feito),
          `${feito ? "reabriu" : "concluiu"} ${NOME_CATEGORIA[cat]} em ${nomeAmbiente(id)}`);
      },
    };
  }, [acesso.editor, inspecao]);

  const colab = {
    usuario, editor: acesso.editor, admin: acesso.admin, pessoas, meta: inspecao.meta, edicao, atividades,
    definirOnde: (patch) => setOnde((o) => ({ ...o, ...patch })),
  };

  return (
    <Colab.Provider value={colab}>
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
              <Sincronia inspecao={inspecao} />
              <PessoasOnline pessoas={pessoas} />
              <button type="button" className="botao-icone" data-sem-som aria-pressed={sons.ligado} onClick={sons.alternar}
                data-dica={sons.ligado ? "Silenciar os sons de clique" : "Ativar os sons de clique"} aria-label={sons.ligado ? "Desativar sons" : "Ativar sons"}>
                {sons.ligado ? <Volume2 /> : <VolumeX />}
              </button>
              <MenuUsuario usuario={usuario} acesso={acesso} />
            </div>
          </div>
        </header>

        <main className="tela">
          {!acesso.editor && acesso.carregado && (
            <p className="barra-aviso" role="status">
              <strong>Somente leitura.</strong> Seu e-mail ({usuario.email}) ainda não está na lista de editores. Peça a um administrador para liberar.
            </p>
          )}
          {inspecao.erro && <p className="barra-aviso erro-barra" role="alert">{inspecao.erro}</p>}
          {inspecao.vazio && acesso.admin && <PrimeiraCarga usuario={usuario} />}
          {pagina === "/" && <Mapa dados={inspecao.ambientes} edicao={edicao} carregando={inspecao.carregando} />}
          {pagina === "/patologias" && <Patologias dados={inspecao.ambientes} />}
          {pagina === "/matriz-gut" && <MatrizGut />}
          {pagina === "/equipe" && <Equipe acesso={acesso} inspecao={inspecao} />}
        </main>
        <Dicas />
      </div>
    </Colab.Provider>
  );
}

/** "Salvando…", "Salvo" ou "Sem conexão": o estado da gravação no banco. */
function Sincronia({ inspecao }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);
  if (!online) return <span className="sincronia offline" data-dica="As alterações ficam guardadas e são enviadas quando a internet voltar"><CloudOff /> Sem conexão</span>;
  if (inspecao.salvando) return <span className="sincronia" data-dica="Enviando as alterações para toda a equipe"><LoaderCircle className="girando" /> Salvando…</span>;
  return <span className="sincronia ok" data-dica="Tudo salvo e visível para toda a equipe"><Check /> Salvo</span>;
}

function PessoasOnline({ pessoas }) {
  if (!pessoas.length) return null;
  const onde = (p) => p.onde?.ambiente ? `${nomeAmbiente(p.onde.ambiente)}${p.onde.editando ? " (editando)" : ""}` : TITULOS[p.onde?.pagina] ?? "no site";
  return (
    <div className="pessoas-online" data-dica={pessoas.map((p) => `${primeiroNome(p.nome)}: ${onde(p)}`).join(" · ")}>
      {pessoas.slice(0, 4).map((p) => <Avatar key={p.uid} pessoa={p} tamanho={30} titulo="" />)}
      {pessoas.length > 4 && <span className="mais">+{pessoas.length - 4}</span>}
      <span className="sr">{pessoas.length} {pessoas.length === 1 ? "pessoa online" : "pessoas online"}</span>
    </div>
  );
}

function MenuUsuario({ usuario, acesso }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (!caixa.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") setAberto(false); };
    addEventListener("pointerdown", fora); addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", fora); removeEventListener("keydown", esc); };
  }, [aberto]);
  const papel = acesso.admin ? "Administrador" : acesso.editor ? "Editor" : "Somente leitura";
  return (
    <div className="menu" ref={caixa}>
      <button type="button" className="botao-avatar" aria-expanded={aberto} aria-haspopup="menu" aria-label="Sua conta"
        onClick={() => setAberto((v) => !v)} data-dica={`${usuario.email} · ${papel}`}>
        <Avatar pessoa={{ nome: usuario.displayName ?? usuario.email, foto: usuario.photoURL, cor: "var(--primary)" }} tamanho={32} titulo="" />
      </button>
      {aberto && (
        <div className="menu-lista" role="menu">
          <div className="menu-conta">
            <b>{usuario.displayName ?? usuario.email}</b>
            <small>{usuario.email}</small>
            <span className="pilula-risco" style={{ "--cor": acesso.editor ? "var(--primary)" : "var(--muted-foreground)" }}>{papel}</span>
          </div>
          {acesso.admin && (
            <Link href="/equipe" className="menu-item" role="menuitem" onClick={() => setAberto(false)}>
              <Users /><span><b>Equipe e permissões</b><small>Quem pode editar o mapa</small></span>
            </Link>
          )}
          <button type="button" role="menuitem" className="menu-item" onClick={sair}>
            <LogOut /><span><b>Sair</b><small>Encerra a sessão neste navegador</small></span>
          </button>
        </div>
      )}
    </div>
  );
}

function PrimeiraCarga({ usuario }) {
  const [estado, setEstado] = useState("");
  return (
    <div className="barra-aviso" role="region" aria-label="Banco vazio">
      <p><strong>O banco de dados está vazio.</strong> Carregar as {Object.keys(base.ambientes).length} fichas do primeiro levantamento para começar?</p>
      <button type="button" className="botao primario" disabled={estado === "carregando"} data-som="salvar"
        data-dica="Grava no banco os ambientes de exemplo (rampa, cozinha, banheiros, ginásio e multimeios)"
        onClick={() => { setEstado("carregando"); carregarIniciais(usuario, base).catch(() => setEstado("erro")); }}>
        {estado === "carregando" ? "Carregando…" : "Carregar dados iniciais"}
      </button>
      {estado === "erro" && <p className="erro">Não foi possível gravar. Confira se as regras do Firestore foram publicadas.</p>}
    </div>
  );
}
