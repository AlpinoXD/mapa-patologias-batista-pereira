// Regras da Matriz GUT, iguais às do site original:
// - nota de uma patologia = G × U × T (1 a 125);
// - nota do ambiente = maior nota entre as patologias (na categoria escolhida, ou em todas);
// - nota do bloco = média das notas das patologias dos ambientes do bloco, contando 1 para cada
//   categoria sem patologia em cada ambiente (assim um bloco com um só problema não parece todo crítico).

export const CATEGORIAS = [
  { id: "estrutura", nome: "Estrutura" },
  { id: "hidraulica", nome: "Hidráulica e telhado" },
  { id: "eletrica", nome: "Elétrica" },
  { id: "revestimentos", nome: "Revestimentos" },
];
export const NOME_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nome]));

export const ESCALA = {
  g: { nome: "Gravidade", niveis: ["Sem gravidade", "Pouco grave", "Grave", "Muito grave", "Extremamente grave"] },
  u: { nome: "Urgência", niveis: ["Pode esperar", "Pouco urgente", "O mais rápido possível", "Com alguma urgência", "Ação imediata"] },
  t: { nome: "Tendência", niveis: ["Não vai piorar", "Piora a longo prazo", "Piora a médio prazo", "Piora a curto prazo", "Piora rapidamente"] },
};

export const RISCOS = [
  { id: "crit", nome: "Crítico", faixa: "80–125", min: 80 },
  { id: "alto", nome: "Alto", faixa: "49–79", min: 49 },
  { id: "medio", nome: "Atenção", faixa: "25–48", min: 25 },
  { id: "baixo", nome: "Baixo", faixa: "1–24", min: 1 },
];
export const NOME_RISCO = { ...Object.fromEntries(RISCOS.map((r) => [r.id, r.nome])), nenhum: "Sem registro" };

export const gut = (p) => p.g * p.u * p.t;

/** Nível de risco de uma nota; null (sem patologia registrada) vira "nenhum". */
export function risco(nota) {
  if (nota == null) return "nenhum";
  return RISCOS.find((r) => nota >= r.min)?.id ?? "baixo";
}

const daCategoria = (registro, filtro) =>
  (registro?.patologias ?? []).filter((p) => filtro === "geral" || p.categoria === filtro);

/** Maior GUT do ambiente no filtro, ou null se não há patologia registrada. */
export function notaAmbiente(registro, filtro = "geral") {
  const lista = daCategoria(registro, filtro);
  return lista.length ? Math.max(...lista.map(gut)) : null;
}

/** Média GUT dos ambientes de um bloco, ou null se nenhum deles tem patologia no filtro. */
export function notaBloco(ambientes, membros, filtro = "geral") {
  const categorias = filtro === "geral" ? CATEGORIAS.map((c) => c.id) : [filtro];
  const notas = [];
  let algumaPatologia = false;
  for (const id of membros) {
    for (const cat of categorias) {
      const lista = daCategoria(ambientes[id], cat);
      if (lista.length) { algumaPatologia = true; notas.push(...lista.map(gut)); }
      else notas.push(1);
    }
  }
  if (!algumaPatologia) return null;
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}

/** Progresso da inspeção de um ambiente: 0–100, com as quatro categorias valendo 25 cada. */
export function progresso(registro, filtro = "geral") {
  const feito = registro?.concluido ?? {};
  if (filtro !== "geral") return feito[filtro] ? 100 : 0;
  return CATEGORIAS.filter((c) => feito[c.id]).length * 25;
}

export const formatarNota = (n) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Integridade de 0 a 100%, como no original: 100 quando todas as notas são 1, 0 quando são 125. */
export function integridade(notas) {
  if (!notas.length) return 100;
  const media = notas.reduce((a, b) => a + b, 0) / notas.length;
  return Math.round((1 - (media - 1) / 124) * 100);
}
