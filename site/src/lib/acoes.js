import { INDICE } from "../dados/planta.js";
import { CATEGORIAS } from "./gut.js";

// Operações de edição de um ambiente, como funções puras. A camada em nuvem aplica cada uma dentro de
// uma transação sobre a versão mais recente do documento, assim duas pessoas editando o mesmo ambiente
// ao mesmo tempo não apagam o trabalho uma da outra.

const CATS = new Set(CATEGORIAS.map((c) => c.id));
const nota = (n) => Number.isInteger(n) && n >= 1 && n <= 5;
export const LIMITE_NOTAS = 4000;

export const registroVazio = () => ({ patologias: [], notas: "", concluido: {} });

/** Normaliza um registro vindo do banco ou de um arquivo; lança erro com o motivo se for inválido. */
export function validarRegistro(id, reg) {
  if (!INDICE[id] || INDICE[id].ambiente.members) throw new Error(`ambiente desconhecido: ${id}`);
  if (!reg || !Array.isArray(reg.patologias)) throw new Error(`${id}: patologias ausentes`);
  const patologias = reg.patologias.map((p, i) => {
    if (!p || typeof p.id !== "string" || !CATS.has(p.categoria) || typeof p.descricao !== "string" || ![p.g, p.u, p.t].every(nota)) {
      throw new Error(`${id}: patologia ${i + 1} inválida`);
    }
    return { id: p.id, categoria: p.categoria, descricao: p.descricao.slice(0, 500), g: p.g, u: p.u, t: p.t };
  });
  if (reg.notas !== undefined && typeof reg.notas !== "string") throw new Error(`${id}: anotações inválidas`);
  const concluido = {};
  for (const c of CATS) if (reg.concluido?.[c] === true) concluido[c] = true;
  return { patologias, notas: (reg.notas ?? "").slice(0, LIMITE_NOTAS), concluido };
}

/** Valida um arquivo inspecao.json inteiro (importação e dados iniciais). */
export function validarArquivo(json) {
  if (!json || typeof json !== "object" || Array.isArray(json) || !json.ambientes || typeof json.ambientes !== "object") {
    throw new Error("o arquivo não tem a lista de ambientes");
  }
  return Object.fromEntries(Object.entries(json.ambientes).map(([id, reg]) => [id, validarRegistro(id, reg)]));
}

export function salvarPatologia(reg, p) {
  const i = reg.patologias.findIndex((x) => x.id === p.id);
  const patologias = i >= 0 ? reg.patologias.map((x, j) => (j === i ? p : x)) : [...reg.patologias, p];
  return { ...reg, patologias };
}

export const removerPatologia = (reg, pid) => ({ ...reg, patologias: reg.patologias.filter((p) => p.id !== pid) });

export const definirNotas = (reg, notas) => ({ ...reg, notas: notas.slice(0, LIMITE_NOTAS) });

export function alternarConcluido(reg, cat) {
  const concluido = { ...reg.concluido };
  if (concluido[cat]) delete concluido[cat]; else concluido[cat] = true;
  return { ...reg, concluido };
}

export const novoId = (ambiente) => `${ambiente}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/* ---------- formato no banco ----------
   No Firestore as patologias ficam num mapa { id: patologia }, para cada uma poder ser gravada ou apagada
   sozinha (duas pessoas editando patologias diferentes do mesmo ambiente não se sobrescrevem). */
export const paraBanco = (reg) => ({
  patologias: Object.fromEntries(reg.patologias.map((p) => [p.id, p])),
  notas: reg.notas, concluido: reg.concluido,
});

export function doBanco(id, dados) {
  const patologias = Object.values(dados?.patologias ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  return validarRegistro(id, { patologias, notas: dados?.notas ?? "", concluido: dados?.concluido ?? {} });
}
