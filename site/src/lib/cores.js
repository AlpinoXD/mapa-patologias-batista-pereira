// Cor e intensidade de cada ambiente no mapa, na linha do original: contorno na cor do risco com
// brilho e preenchimento leve, mais cheio quanto pior a nota. Ambiente sem registro fica só no traço
// da planta, para o calor aparecer onde há problema.
const COR = {
  crit: "var(--risco-crit)", alto: "var(--risco-alto)", medio: "var(--risco-medio)",
  baixo: "var(--risco-baixo)", nenhum: "var(--blueprint)",
};
const OPACIDADE = { crit: 0.32, alto: 0.24, medio: 0.18, baixo: 0.1, nenhum: 0.03 };

export const corRisco = (risco) => COR[risco];

/** Progresso: de vermelho (0%) a verde (100%), como no modo "Concluídos" do original. */
export const corProgresso = (prog) => `var(--conclusao-${Math.round(prog / 25)})`;

export function corDe(item, visao) {
  if (visao === "progresso") return corProgresso(item.prog);
  return COR[item.risco];
}

export function opacidadeDe(item, visao) {
  if (visao === "progresso") return 0.2;
  return OPACIDADE[item.risco];
}

export function bordaDe(item, visao) {
  return corDe(item, visao);
}

export const temBrilho = (item, visao) => visao !== "ambientes" || item.risco !== "nenhum";
