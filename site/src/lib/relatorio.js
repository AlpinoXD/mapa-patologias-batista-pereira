import { ANDARES, INDICE } from "../dados/planta.js";
import { CATEGORIAS, ESCALA, formatarNota, gut, NOME_CATEGORIA, NOME_RISCO, notaBloco, risco } from "./gut.js";

/** Todas as patologias da escola, uma por linha, da maior nota para a menor. */
export function linhasPatologias(ambientes) {
  return Object.entries(ambientes).flatMap(([id, reg]) => {
    const info = INDICE[id];
    if (!info) return [];
    return reg.patologias.map((p) => ({
      p, nota: gut(p), risco: risco(gut(p)), ambiente: info.ambiente, andar: info.andar, bloco: info.bloco,
    }));
  }).sort((a, b) => b.nota - a.nota || a.ambiente.name.localeCompare(b.ambiente.name, "pt-BR"));
}

const baixar = (conteudo, nome, tipo) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export function exportarCSV(ambientes) {
  const cab = ["Pavimento", "Bloco", "Ambiente", "Categoria", "Patologia", "G", "U", "T", "GUT", "Risco", "Anotações do ambiente"];
  const linhas = linhasPatologias(ambientes).map((l) => [
    ANDARES[l.andar].nome, l.bloco?.name ?? "", l.ambiente.name, NOME_CATEGORIA[l.p.categoria], l.p.descricao,
    l.p.g, l.p.u, l.p.t, l.nota, NOME_RISCO[l.risco], ambientes[l.ambiente.id]?.notas ?? "",
  ]);
  const csv = [cab, ...linhas].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  baixar("﻿" + csv, `patologias-batista-pereira-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
}

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Abre o relatório numa janela própria e chama a impressão (dá para salvar em PDF por ela). */
export function imprimirRelatorio(ambientes) {
  const todas = linhasPatologias(ambientes);
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const secoes = Object.entries(ANDARES).map(([andar, a]) => {
    const linhas = todas.filter((l) => l.andar === andar);
    const blocos = a.blocos.map((b) => `<tr><td>${esc(b.name)}</td>${["geral", ...CATEGORIAS.map((c) => c.id)].map((f) =>
      `<td class="n">${formatarNota(notaBloco(ambientes, b.members, f))}</td>`).join("")}</tr>`).join("");
    const notas = a.ambientes.filter((s) => ambientes[s.id]?.notas).map((s) => `<li><b>${esc(s.name)}:</b> ${esc(ambientes[s.id].notas)}</li>`).join("");
    return `<h2>Pavimento ${esc(a.nome.toLowerCase())}</h2>
      <p>${linhas.length} patologias em ${new Set(linhas.map((l) => l.ambiente.id)).size} de ${a.ambientes.length} ambientes.</p>
      <h3>Médias GUT por bloco</h3>
      <table><tr><th>Bloco</th><th class="n">Geral</th>${CATEGORIAS.map((c) => `<th class="n">${c.nome}</th>`).join("")}</tr>${blocos}</table>
      <h3>Patologias, da maior nota para a menor</h3>
      ${linhas.length ? `<table><tr><th>Ambiente</th><th>Categoria</th><th>Patologia</th><th class="n">G·U·T</th><th class="n">GUT</th><th>Risco</th></tr>
        ${linhas.map((l) => `<tr><td>${esc(l.ambiente.name)}</td><td>${NOME_CATEGORIA[l.p.categoria]}</td><td>${esc(l.p.descricao)}</td>
          <td class="n">${l.p.g}·${l.p.u}·${l.p.t}</td><td class="n"><b>${l.nota}</b></td><td>${NOME_RISCO[l.risco]}</td></tr>`).join("")}</table>`
        : "<p>Nenhuma patologia registrada.</p>"}
      ${notas ? `<h3>Anotações</h3><ul>${notas}</ul>` : ""}`;
  }).join("");
  const escala = ["g", "u", "t"].map((k) => `<b>${ESCALA[k].nome}:</b> ${ESCALA[k].niveis.map((n, i) => `${i + 1} ${n.toLowerCase()}`).join("; ")}.`).join("<br>");

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Diagnóstico de patologias · EBM Batista Pereira</title>
<style>body{font:13px/1.45 system-ui,sans-serif;color:#111;margin:32px}h1{font-size:22px;margin:0}h2{font-size:17px;margin:28px 0 4px;break-after:avoid}
h3{font-size:13px;margin:16px 0 6px;color:#444}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:5px 6px;text-align:left;vertical-align:top}
th{font-weight:500;color:#555}.n{text-align:right;font-variant-numeric:tabular-nums}tr{break-inside:avoid}.leg{color:#555;font-size:11px;margin-top:8px}</style></head><body>
<h1>Diagnóstico de patologias · EBM Batista Pereira</h1><p>Matriz GUT (gravidade × urgência × tendência, de 1 a 125) · gerado em ${data}</p>
<p class="leg">${escala}<br><b>Risco:</b> crítico 80–125; alto 49–79; atenção 25–48; baixo 1–24. Média do bloco: média das patologias dos ambientes, contando 1 para categoria sem patologia.</p>
${secoes}<script>onload=()=>print()</script></body></html>`);
  w.document.close();
  return true;
}
