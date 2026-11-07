import { useEffect, useMemo, useState } from "react";
import base from "../dados/inspecao.json";
import { INDICE } from "../dados/planta.js";
import { CATEGORIAS } from "./gut.js";

// Os dados publicados vêm de src/dados/inspecao.json. No modo edição, as alterações ficam num
// rascunho neste navegador (localStorage) até alguém baixar o arquivo e substituir o do projeto.
const CHAVE = "batista-pereira-rascunho-v1";
const CATS = new Set(CATEGORIAS.map((c) => c.id));
const nota = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

/** Valida um arquivo de inspeção (importado ou do rascunho). Lança erro com o motivo. */
export function validar(json) {
  if (!json || typeof json !== "object" || Array.isArray(json) || typeof json.ambientes !== "object" || !json.ambientes) {
    throw new Error("o arquivo não tem a lista de ambientes");
  }
  const ambientes = {};
  for (const [id, reg] of Object.entries(json.ambientes)) {
    if (!INDICE[id] || INDICE[id].ambiente.members) throw new Error(`ambiente desconhecido: ${id}`);
    if (!reg || !Array.isArray(reg.patologias)) throw new Error(`${id}: patologias ausentes`);
    const patologias = reg.patologias.map((p, i) => {
      if (!p || typeof p.id !== "string" || !CATS.has(p.categoria) || typeof p.descricao !== "string" || ![p.g, p.u, p.t].every(nota)) {
        throw new Error(`${id}: patologia ${i + 1} inválida`);
      }
      return { id: p.id, categoria: p.categoria, descricao: p.descricao, g: p.g, u: p.u, t: p.t };
    });
    if (reg.notas !== undefined && typeof reg.notas !== "string") throw new Error(`${id}: anotações inválidas`);
    const concluido = {};
    for (const c of CATS) if (reg.concluido?.[c] === true) concluido[c] = true;
    ambientes[id] = { patologias, notas: reg.notas ?? "", concluido };
  }
  return ambientes;
}

const publicado = validar(base);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function lerRascunho() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? validar(JSON.parse(bruto)) : null;
  } catch { return null; } // rascunho corrompido não impede abrir o mapa
}

const vazio = () => ({ patologias: [], notas: "", concluido: {} });

export function useInspecao() {
  const [ambientes, setAmbientes] = useState(() => lerRascunho() ?? publicado);
  const alterado = useMemo(() => !igual(ambientes, publicado), [ambientes]);

  useEffect(() => {
    try {
      if (alterado) localStorage.setItem(CHAVE, JSON.stringify({ versao: 1, ambientes }));
      else localStorage.removeItem(CHAVE);
    } catch { /* sem armazenamento, a edição vale só nesta aba */ }
  }, [ambientes, alterado]);

  const atualizar = (id, fn) => setAmbientes((a) => {
    const reg = fn(structuredClone(a[id] ?? vazio()));
    const vazioDeVerdade = !reg.patologias.length && !reg.notas && !Object.keys(reg.concluido).length;
    const novo = { ...a, [id]: reg };
    if (vazioDeVerdade) delete novo[id];
    return novo;
  });

  return {
    ambientes,
    alterado,
    salvarPatologia: (id, p) => atualizar(id, (r) => {
      const i = r.patologias.findIndex((x) => x.id === p.id);
      if (i >= 0) r.patologias[i] = p; else r.patologias.push(p);
      return r;
    }),
    removerPatologia: (id, pid) => atualizar(id, (r) => ({ ...r, patologias: r.patologias.filter((p) => p.id !== pid) })),
    definirNotas: (id, notas) => atualizar(id, (r) => ({ ...r, notas })),
    alternarConcluido: (id, cat) => atualizar(id, (r) => {
      if (r.concluido[cat]) delete r.concluido[cat]; else r.concluido[cat] = true;
      return r;
    }),
    descartar: () => setAmbientes(publicado),
    importar: async (arquivo) => setAmbientes(validar(JSON.parse(await arquivo.text()))),
    baixar: () => {
      const hoje = new Date().toISOString().slice(0, 10);
      const texto = JSON.stringify({ versao: 1, atualizado: hoje, ambientes }, null, 2) + "\n";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
      a.download = "inspecao.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
  };
}

export const novoId = (ambiente) => `${ambiente}-${Date.now().toString(36)}`;
