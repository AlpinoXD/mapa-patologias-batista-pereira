import { describe, expect, it } from "vitest";
import base from "../dados/inspecao.json";
import { alternarConcluido, definirNotas, LIMITE_NOTAS, removerPatologia, salvarPatologia, validarArquivo, validarRegistro } from "./acoes.js";

const p = { id: "x", categoria: "eletrica", descricao: "Fiação exposta", g: 3, u: 3, t: 3 };
const vazio = { patologias: [], notas: "", concluido: {} };

describe("validação", () => {
  it("aceita o arquivo de dados iniciais", () => {
    expect(Object.keys(validarArquivo(base))).toContain("cozinha");
  });
  it("descarta campos estranhos e normaliza ausentes", () => {
    const r = validarRegistro("s01", { patologias: [{ ...p, extra: "<script>" }], concluido: { eletrica: true, outra: true } });
    expect(r).toEqual({ patologias: [p], notas: "", concluido: { eletrica: true } });
  });
  it("recusa ambiente desconhecido, bloco e notas fora de 1 a 5", () => {
    expect(() => validarRegistro("sala99", vazio)).toThrow(/desconhecido/);
    expect(() => validarRegistro("bloco-a", vazio)).toThrow(/desconhecido/);
    expect(() => validarRegistro("s01", { patologias: [{ ...p, g: 6 }] })).toThrow(/inválida/);
    expect(() => validarRegistro("s01", { patologias: [{ ...p, categoria: "x" }] })).toThrow(/inválida/);
    expect(() => validarArquivo([])).toThrow();
  });
});

describe("operações", () => {
  it("adiciona, edita e remove patologias sem mexer nas outras", () => {
    const a = salvarPatologia(vazio, p);
    const b = salvarPatologia(a, { ...p, id: "y", g: 5 });
    const c = salvarPatologia(b, { ...p, g: 1 });
    expect(c.patologias.map((x) => [x.id, x.g])).toEqual([["x", 1], ["y", 5]]);
    expect(removerPatologia(c, "x").patologias.map((x) => x.id)).toEqual(["y"]);
    expect(vazio.patologias).toEqual([]); // não altera o original
  });
  it("alterna conclusão e limita anotações", () => {
    const a = alternarConcluido(vazio, "estrutura");
    expect(a.concluido).toEqual({ estrutura: true });
    expect(alternarConcluido(a, "estrutura").concluido).toEqual({});
    expect(definirNotas(vazio, "x".repeat(LIMITE_NOTAS + 10)).notas.length).toBe(LIMITE_NOTAS);
  });
});

describe("formato no banco", async () => {
  const { paraBanco, doBanco } = await import("./acoes.js");
  it("ida e volta preserva o registro", () => {
    const reg = { patologias: [p, { ...p, id: "y", categoria: "estrutura" }], notas: "ok", concluido: { eletrica: true } };
    expect(doBanco("s01", paraBanco(reg))).toEqual(reg);
    expect(paraBanco(reg).patologias.y.categoria).toBe("estrutura");
  });
  it("documento parcial (só anotações) vira registro completo", () => {
    expect(doBanco("s01", { notas: "x" })).toEqual({ patologias: [], notas: "x", concluido: {} });
  });
});

describe("fotos", async () => {
  const { caber } = await import("./imagem.js");
  it("reduz mantendo a proporção e nunca amplia", () => {
    expect(caber(4000, 3000, 1280)).toEqual([1280, 960]);
    expect(caber(3000, 4000, 1280)).toEqual([960, 1280]);
    expect(caber(640, 480, 1280)).toEqual([640, 480]);
  });
});
