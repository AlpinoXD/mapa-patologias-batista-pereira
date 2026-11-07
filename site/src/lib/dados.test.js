import { describe, expect, it } from "vitest";
import base from "../dados/inspecao.json";
import { validar } from "./dados.js";

const p = { id: "x", categoria: "eletrica", descricao: "Fiação exposta", g: 3, u: 3, t: 3 };

describe("validar arquivo de inspeção", () => {
  it("aceita o arquivo publicado", () => {
    expect(Object.keys(validar(base))).toContain("cozinha");
  });
  it("descarta campos estranhos e normaliza ausentes", () => {
    const r = validar({ ambientes: { s01: { patologias: [{ ...p, extra: "<script>" }], concluido: { eletrica: true, outra: true } } } });
    expect(r.s01).toEqual({ patologias: [p], notas: "", concluido: { eletrica: true } });
  });
  it("recusa ambiente desconhecido, bloco e notas fora de 1 a 5", () => {
    expect(() => validar({ ambientes: { sala99: { patologias: [] } } })).toThrow(/desconhecido/);
    expect(() => validar({ ambientes: { "bloco-a": { patologias: [] } } })).toThrow(/desconhecido/);
    expect(() => validar({ ambientes: { s01: { patologias: [{ ...p, g: 6 }] } } })).toThrow(/inválida/);
    expect(() => validar({ ambientes: { s01: { patologias: [{ ...p, categoria: "x" }] } } })).toThrow(/inválida/);
    expect(() => validar([])).toThrow();
  });
});
