import { describe, expect, it } from "vitest";
import { notaAmbiente, notaBloco, progresso, risco } from "./gut.js";

const p = (categoria, g, u, t) => ({ id: `${categoria}${g}${u}${t}`, categoria, descricao: "x", g, u, t });

describe("Matriz GUT", () => {
  it("classifica as faixas de risco nos limites", () => {
    expect([null, 1, 24, 25, 48, 49, 79, 80, 125].map(risco))
      .toEqual(["nenhum", "baixo", "baixo", "medio", "medio", "alto", "alto", "crit", "crit"]);
  });

  it("nota do ambiente é a maior patologia do filtro", () => {
    const reg = { patologias: [p("hidraulica", 4, 4, 5), p("hidraulica", 2, 2, 2), p("eletrica", 3, 3, 3)] };
    expect(notaAmbiente(reg)).toBe(80);
    expect(notaAmbiente(reg, "eletrica")).toBe(27);
    expect(notaAmbiente(reg, "estrutura")).toBeNull();
    expect(notaAmbiente(undefined)).toBeNull();
  });

  it("nota do bloco é a média com 1 para categoria vazia", () => {
    const amb = { a: { patologias: [p("hidraulica", 4, 4, 5)] }, b: {} };
    // a: 80 + 1 + 1 + 1, b: 1 + 1 + 1 + 1 → 87 / 8
    expect(notaBloco(amb, ["a", "b"])).toBeCloseTo(87 / 8);
    // só hidráulica: (80 + 1) / 2
    expect(notaBloco(amb, ["a", "b"], "hidraulica")).toBe(40.5);
    expect(notaBloco(amb, ["a", "b"], "eletrica")).toBeNull();
  });

  it("progresso conta 25 por categoria concluída", () => {
    const reg = { concluido: { estrutura: true, eletrica: true, hidraulica: false } };
    expect(progresso(reg)).toBe(50);
    expect(progresso(reg, "eletrica")).toBe(100);
    expect(progresso(reg, "hidraulica")).toBe(0);
  });
});

describe("integridade", () => {
  it("vai de 100% (tudo 1) a 0% (tudo 125)", async () => {
    const { integridade } = await import("./gut.js");
    expect(integridade([1, 1])).toBe(100);
    expect(integridade([125])).toBe(0);
    expect(integridade([])).toBe(100);
    expect(integridade([1, 125])).toBe(50);
  });
});
