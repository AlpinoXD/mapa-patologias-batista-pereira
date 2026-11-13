import { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc, collection, connectFirestoreEmulator, deleteDoc, deleteField, doc, getDocs, initializeFirestore, limit, onSnapshot, orderBy, persistentLocalCache,
  persistentMultipleTabManager, query, serverTimestamp, setDoc, where, writeBatch,
} from "firebase/firestore";
import { firebaseConfig } from "../firebase-config.js";
import { INDICE } from "../dados/planta.js";
import { doBanco, paraBanco, validarArquivo } from "./acoes.js";

export const DONO = "cauapinho11@gmail.com";
// VITE_EMULADOR=1 usa o Firebase simulado no próprio computador (testes sem tocar nos dados reais)
const EMULADOR = import.meta.env.VITE_EMULADOR === "1";
const config = EMULADOR ? { apiKey: "demo", authDomain: "localhost", projectId: "demo-mapa-patologias" } : firebaseConfig;
export const configurado = !!config;

const app = configurado ? initializeApp(config) : null;
const auth = app ? getAuth(app) : null;
// cache local: o site abre rápido e continua funcionando se a internet cair por um instante
const db = app ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }) : null;
if (EMULADOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  // login de teste sem janela do Google (o emulador aceita uma credencial falsa)
  window.__entrarTeste = (email, nome) =>
    signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name: nome })));
  // gravação direta, para conferir que as regras recusam quem não está na equipe
  window.__gravarTeste = (id, dados) => setDoc(doc(db, "ambientes", id), dados, { merge: true });
}

export const entrar = () => signInWithPopup(auth, new GoogleAuthProvider());
// tira a presença antes de sair, senão a pessoa continua "online" por mais um minuto
export const sair = async () => {
  if (auth.currentUser) await deleteDoc(doc(db, "presenca", auth.currentUser.uid)).catch(() => {});
  return signOut(auth);
};

/* ---------- usuário ---------- */
export function useUsuario() {
  const [usuario, setUsuario] = useState(undefined); // undefined = carregando
  useEffect(() => (auth ? onAuthStateChanged(auth, (u) => setUsuario(u)) : setUsuario(null)), []);
  return usuario;
}

/** Quem pode editar e quem administra a lista de acesso. */
export function useAcesso(usuario) {
  const [acesso, setAcesso] = useState({ editores: [], admins: [], carregado: false });
  useEffect(() => {
    if (!usuario) return;
    return onSnapshot(doc(db, "config", "acesso"),
      (s) => setAcesso({ editores: s.data()?.editores ?? [], admins: s.data()?.admins ?? [], carregado: true }),
      () => setAcesso((a) => ({ ...a, carregado: true })));
  }, [usuario]);
  const email = usuario?.email?.toLowerCase() ?? "";
  const admin = email === DONO || acesso.admins.includes(email);
  const editor = admin || acesso.editores.includes(email);
  const salvar = (editores, admins) => setDoc(doc(db, "config", "acesso"), {
    editores: [...new Set(editores.map((e) => e.trim().toLowerCase()).filter(Boolean))].sort(),
    admins: [...new Set(admins.map((e) => e.trim().toLowerCase()).filter(Boolean))].sort(),
  });
  return { ...acesso, admin, editor, salvar };
}

/** Mudanças parciais de um ambiente, no formato do banco (para alterar()). */
export const mudar = {
  patologia: (p) => ({ patologias: { [p.id]: p } }),
  removerPatologia: (pid) => ({ patologias: { [pid]: deleteField() } }),
  notas: (texto) => ({ notas: texto.slice(0, 4000) }),
  concluido: (cat, feito) => ({ concluido: { [cat]: feito ? true : deleteField() } }),
};

const autor = (u) => ({ uid: u.uid, nome: u.displayName ?? u.email, foto: u.photoURL ?? "", email: u.email });

/* ---------- dados da inspeção, em tempo real ---------- */
export function useInspecao(usuario, podeEditar) {
  const [ambientes, setAmbientes] = useState({});
  const [meta, setMeta] = useState({});
  const [estado, setEstado] = useState({ carregando: true, salvando: false, erro: "", vazio: false });

  useEffect(() => {
    if (!usuario) return;
    return onSnapshot(collection(db, "ambientes"), { includeMetadataChanges: true }, (snap) => {
      const dados = {}, info = {};
      snap.forEach((d) => {
        try { dados[d.id] = doBanco(d.id, d.data()); } catch { return; } // registro inválido não derruba o mapa
        info[d.id] = { por: d.data().atualizadoPor, em: d.data().atualizadoEm?.toMillis?.() ?? Date.now() };
      });
      setAmbientes(dados);
      setMeta(info);
      // hasPendingWrites: há alterações minhas ainda não confirmadas pelo servidor
      setEstado((e) => ({ ...e, carregando: false, vazio: snap.empty && !snap.metadata.fromCache, salvando: snap.metadata.hasPendingWrites }));
    }, (err) => setEstado((e) => ({ ...e, carregando: false, erro: err.code === "permission-denied" ? "Sem permissão para ler os dados." : "Não foi possível carregar os dados." })));
  }, [usuario]);

  /**
   * Grava só os campos que mudaram (set com merge). A tela atualiza na hora, mesmo sem internet; o
   * Firestore envia quando a conexão voltar, e alterações em campos diferentes de duas pessoas se somam.
   */
  const alterar = (id, mudanca, texto) => {
    if (!podeEditar) return Promise.reject(new Error("sem permissão de edição"));
    setEstado((e) => ({ ...e, erro: "" }));
    const gravacao = setDoc(doc(db, "ambientes", id), { ...mudanca, atualizadoPor: autor(usuario), atualizadoEm: serverTimestamp() }, { merge: true })
      .catch((err) => {
        setEstado((e) => ({ ...e, erro: err.code === "permission-denied" ? "Seu e-mail não tem permissão de edição." : "Não foi possível salvar uma alteração. Verifique a conexão." }));
        throw err;
      });
    if (texto) addDoc(collection(db, "atividades"), { ...autor(usuario), ambiente: id, texto: texto.slice(0, 300), quando: serverTimestamp() }).catch(() => {});
    return gravacao;
  };

  /** Substitui os dados pelo conteúdo de um arquivo inspecao.json (só admins, pela regra). */
  const importar = async (texto) => {
    const novos = validarArquivo(JSON.parse(texto));
    const lote = writeBatch(db);
    for (const id of Object.keys(ambientes)) if (!novos[id]) lote.delete(doc(db, "ambientes", id));
    for (const [id, reg] of Object.entries(novos)) lote.set(doc(db, "ambientes", id), { ...paraBanco(reg), atualizadoPor: autor(usuario), atualizadoEm: serverTimestamp() });
    await lote.commit();
    addDoc(collection(db, "atividades"), { ...autor(usuario), ambiente: "", texto: `importou um arquivo com ${Object.keys(novos).length} ambientes`, quando: serverTimestamp() }).catch(() => {});
  };

  const baixarCopia = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const texto = JSON.stringify({ versao: 1, atualizado: hoje, ambientes }, null, 2) + "\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    a.download = `inspecao-${hoje}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return { ambientes, meta, ...estado, alterar, importar, baixarCopia };
}

/* ---------- atividade recente ---------- */
export function useAtividades(usuario, quantas = 12) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!usuario) return;
    return onSnapshot(query(collection(db, "atividades"), orderBy("quando", "desc"), limit(quantas)),
      (s) => setLista(s.docs.map((d) => ({ id: d.id, ...d.data(), quando: d.data().quando?.toMillis?.() ?? Date.now() }))),
      () => setLista([]));
  }, [usuario, quantas]);
  return lista;
}

/* ---------- presença: quem está online e onde ---------- */
const CORES = [200, 25, 92, 150, 300, 52, 250, 340];
export const corPessoa = (uid) => `oklch(0.78 0.15 ${CORES[[...uid].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length]})`;
const VIVO_MS = 150_000;

export function usePresenca(usuario, onde) {
  const [pessoas, setPessoas] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const chave = JSON.stringify(onde);

  // grava onde eu estou a cada mudança e a cada 60 s (batimento); some ao fechar a aba
  useEffect(() => {
    if (!usuario) return;
    const ref = doc(db, "presenca", usuario.uid);
    // aba em segundo plano não bate ponto: poupa a cota gratuita de leituras e gravações
    const gravar = () => !document.hidden && setDoc(ref, { ...autor(usuario), cor: corPessoa(usuario.uid), onde, visto: serverTimestamp() }).catch(() => {});
    gravar();
    const batida = setInterval(gravar, 60_000);
    const fechar = () => { deleteDoc(ref).catch(() => {}); };
    addEventListener("pagehide", fechar);
    return () => { clearInterval(batida); removeEventListener("pagehide", fechar); };
  }, [usuario, chave]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!usuario) return;
    const parar = onSnapshot(collection(db, "presenca"), (s) =>
      setPessoas(s.docs.map((d) => ({ ...d.data(), visto: d.data().visto?.toMillis?.() ?? Date.now() }))), () => {});
    const relogio = setInterval(() => setAgora(Date.now()), 15_000);
    return () => { parar(); clearInterval(relogio); };
  }, [usuario]);

  return useMemo(() => pessoas.filter((p) => p.uid !== usuario?.uid && agora - p.visto < VIVO_MS), [pessoas, agora, usuario]);
}

/** Primeira carga: o administrador preenche o banco vazio com os dados de exemplo. */
export async function carregarIniciais(usuario, arquivo) {
  const dados = validarArquivo(arquivo);
  const lote = writeBatch(db);
  for (const [id, reg] of Object.entries(dados)) lote.set(doc(db, "ambientes", id), { ...paraBanco(reg), atualizadoPor: autor(usuario), atualizadoEm: serverTimestamp() });
  await lote.commit();
}

export const nomeAmbiente = (id) => INDICE[id]?.ambiente.name ?? id;

/* ---------- fotos das patologias ---------- */
// shortcut: a foto vai dentro do Firestore como texto (até ~520 KB cada), porque o Storage do Firebase exige
// plano pago; migrar para o Storage se o banco chegar perto de 1 GiB (umas 2 mil fotos).
export function useFotos(usuario, ambiente) {
  const [fotos, setFotos] = useState([]);
  useEffect(() => {
    setFotos([]);
    if (!usuario || !ambiente) return;
    return onSnapshot(query(collection(db, "fotos"), where("ambiente", "==", ambiente)),
      (s) => setFotos(s.docs.map((d) => ({ id: d.id, ...d.data(), quando: d.data().quando?.toMillis?.() ?? Date.now() }))
        .filter((f) => typeof f.dados === "string" && f.dados.startsWith("data:image/jpeg;base64,"))
        .sort((a, b) => a.quando - b.quando)),
      () => setFotos([]));
  }, [usuario, ambiente]);
  return fotos;
}

export async function anexarFoto(usuario, ambiente, patologia, dados, texto) {
  await addDoc(collection(db, "fotos"), { ambiente, patologia, dados, uid: usuario.uid, nome: usuario.displayName ?? usuario.email, quando: serverTimestamp() });
  addDoc(collection(db, "atividades"), { ...autor(usuario), ambiente, texto: texto.slice(0, 300), quando: serverTimestamp() }).catch(() => {});
}

export const removerFoto = (id) => deleteDoc(doc(db, "fotos", id));

/** Apaga as fotos de uma patologia removida, para não sobrarem registros órfãos. */
export async function removerFotosDe(patologia) {
  const s = await getDocs(query(collection(db, "fotos"), where("patologia", "==", patologia)));
  await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
}
