// Geometria das plantas, portada do projeto original no Lovable sem alterar coordenadas nem IDs.
// r = [x, y, largura, altura] no sistema de coordenadas da planta; path substitui o retângulo
// quando o ambiente não é retangular; label define as linhas do rótulo; kind marca circulações (circ)
// e áreas externas (ext).

export const TERREO = [
  { id: "artes", name: "Sala de Artes", r: [28, 31, 97, 128] },
  { id: "s01", name: "Sala de Aula 01", r: [128, 28, 95, 101] },
  { id: "depmat", name: "Depósito de Material", r: [225, 28, 46, 101], label: ["Depósito", "de Material"] },
  { id: "sanmw", name: "BWC Masculino · Oeste", r: [273, 28, 43, 60], label: ["BWC M."] },
  { id: "sanfw", name: "BWC Feminino · Oeste", r: [273, 90, 43, 39], label: ["BWC F."] },
  { id: "s02", name: "Sala de Aula 02", r: [28, 162, 97, 127] },
  { id: "patio", name: "Pátio Coberto", r: [128, 132, 330, 177], kind: "circ" },
  { id: "s03", name: "Sala de Aula 03", r: [28, 292, 97, 148] },
  { id: "s04", name: "Sala de Aula 04", r: [128, 311, 95, 129] },
  { id: "orient", name: "Orientação", r: [225, 311, 44, 54] },
  { id: "secret", name: "Psicologia", r: [225, 368, 44, 72] },
  { id: "circadm", name: "Oração", r: [271, 311, 44, 129], kind: "circ" },
  { id: "prof", name: "Sala dos Professores", r: [318, 311, 89, 102], label: ["Sala dos", "Professores"] },
  { id: "cantina", name: "Cantina", r: [409, 311, 49, 50] },
  { id: "info", name: "Informática", r: [409, 364, 49, 49] },
  { id: "hall", name: "Depósito de Gás", r: [318, 416, 36, 41], label: ["Dep.", "Gás"] },
  { id: "descob", name: "Área Multiuso", r: [356, 416, 100, 86], kind: "ext", path: "M356 416 H458 V470 H541 V502 H318 V459 H356 Z", label: ["Área", "Multiuso"] },
  { id: "sanadm", name: "BWC Feminino · Administração", r: [237, 443, 32, 32], label: ["BWC F."] },
  { id: "sanadmm", name: "BWC Masculino · Administração", r: [237, 478, 32, 28], label: ["BWC M."] },
  { id: "direcao", name: "Direção", r: [272, 443, 43, 63] },
  { id: "cozinha", name: "Cozinha", r: [461, 178, 90, 99], path: "M461 178 H551 V229 H521 V277 H461 Z" },
  { id: "despensa", name: "Despensa", r: [524, 232, 27, 45], label: ["Desp."] },
  { id: "escada", name: "Escada", r: [461, 311, 90, 66], kind: "circ" },
  { id: "video", name: "Sala de Vídeo", r: [461, 380, 90, 87], label: ["Sala de", "Vídeo"] },
  { id: "circc", name: "Circulação Central", r: [554, 178, 27, 289], kind: "circ", path: "M554 178 H581 V467 H554 V309 H461 V280 H554 Z", label: ["Circ."] },
  { id: "s05", name: "Sala de Aula 05", r: [584, 445, 99, 120] },
  { id: "pedag", name: "Equipe Pedagógica", r: [584, 301, 99, 141], label: ["Equipe", "Pedagógica"] },
  { id: "s06", name: "Sala de Aula 06", r: [584, 178, 99, 120] },
  { id: "circn", name: "Circulação Norte", r: [461, 133, 543, 42], kind: "circ" },
  { id: "sanfe", name: "BWC Alunos · Feminino", r: [910, 30, 46, 101], label: ["BWC", "Feminino"] },
  { id: "sanme", name: "BWC Alunos · Masculino", r: [959, 30, 45, 101], label: ["BWC", "Masculino"] },
  { id: "s07", name: "Sala de Aula 07", r: [779, 178, 96, 125] },
  { id: "s08", name: "Sala de Aula 08", r: [909, 178, 95, 125] },
  { id: "s09", name: "Sala de Aula 09", r: [779, 306, 96, 124] },
  { id: "s10", name: "Sala de Aula 10", r: [909, 306, 95, 124] },
  { id: "s11", name: "Sala de Aula 11", r: [779, 433, 96, 139] },
  { id: "s12", name: "Sala de Aula 12", r: [909, 433, 95, 139] },
  { id: "s13", name: "Sala de Aula 13", r: [779, 575, 96, 158] },
  { id: "s14", name: "Sala de Aula 14", r: [909, 608, 95, 125] },
  { id: "circl", name: "Circulação das Salas", r: [878, 178, 28, 555], kind: "circ", path: "M878 178 H906 V575 H1004 V605 H906 V733 H878 Z", label: ["Circ."] },
  { id: "rampa", name: "Rampa de Acesso", r: [400, 505, 110, 65], kind: "ext", path: "M400 505 H548 V536 H510 V604 H474 V570 H400 Z", label: ["Rampa"] },
  { id: "deposito", name: "Depósito", r: [362, 573, 110, 65], path: "M362 505 H397 V573 H472 V607 H548 V638 H362 Z" },
  { id: "acesso", name: "Hall de Acesso", r: [552, 505, 29, 133], kind: "circ", label: ["Hall"] },
  // Anexos fora do prédio principal
  { id: "madeira", name: "Pavilhão de Madeira", r: [1050, 180, 110, 180], label: ["Pavilhão", "de Madeira"] },
  { id: "bwc6", name: "BWC 6 · Anexo", r: [1050, 363, 110, 55] },
  { id: "ginasio", name: "Ginásio de Esportes", r: [28, -155, 430, 135] },
  { id: "quadra", name: "Quadra Esportiva", r: [461, -155, 430, 135] },
];

const membrosB = ["artes", "s01", "s02", "s03", "s04", "depmat", "sanmw", "sanfw", "patio"];
const membrosC = ["sanfe", "sanme", "s07", "s08", "s09", "s10", "s11", "s12", "s13", "s14", "circl"];
const membrosD = ["madeira", "bwc6"];
const membrosE = ["ginasio", "quadra"];
const foraDoA = new Set([...membrosB, ...membrosC, ...membrosD, ...membrosE]);

export const BLOCOS_TERREO = [
  { id: "bloco-a", name: "Bloco A · Administração e acesso", short: "A", r: [461, 178, 222, 387],
    path: "M461 133 H907 V175 H686 V568 H584 V641 H359 V509 H234 V443 H223 V309 H461 Z",
    members: TERREO.filter((s) => !foraDoA.has(s.id)).map((s) => s.id) },
  { id: "bloco-b", name: "Bloco B · Ala oeste", short: "B", r: [28, 28, 430, 281],
    path: "M25 25 H319 V130 H458 V309 H223 V443 H25 Z", members: membrosB },
  { id: "bloco-c", name: "Bloco C · Salas 07 a 14", short: "C", r: [779, 178, 225, 555],
    path: "M907 27 H1007 V736 H776 V178 H907 Z", members: membrosC },
  { id: "bloco-d", name: "Bloco D · Anexo de madeira", short: "D", r: [1047, 177, 116, 244], members: membrosD },
  { id: "bloco-e", name: "Bloco E · Ginásio de esportes", short: "E", r: [25, -158, 869, 141], members: membrosE },
];

export const SUPERIOR = [
  { id: "a2-sala1", name: "Sala de Ciências", r: [207, 700, 123, 189], label: ["Sala de", "Ciências"] },
  { id: "a2-sala2", name: "Sala de Geografia", r: [332, 725, 122, 164], label: ["Sala de", "Geografia"] },
  { id: "a2-radio", name: "Rádio", r: [456, 726, 55, 33] },
  { id: "a2-auxiliar", name: "Auxiliar de Ensino", r: [456, 761, 55, 35], label: ["Auxiliar", "de Ensino"] },
  { id: "a2-secretaria", name: "Secretaria", r: [456, 797, 55, 92] },
  { id: "a2-corredor", name: "Corredor", r: [332, 696, 180, 28], path: "M332 696 H750 V724 H332 Z", kind: "circ", label: ["Corredor"] },
  { id: "a2-rampa-oeste", name: "Rampa Oeste", r: [512, 704, 28, 20], kind: "circ", label: ["Rampa"] },
  { id: "a2-bwc", name: "BWC Superior", r: [542, 725, 52, 31], label: ["BWC"] },
  { id: "a2-circ-oeste", name: "Circulação Oeste", r: [512, 757, 57, 133], kind: "circ", label: ["Circulação"] },
  { id: "a2-cozinha", name: "Cozinha Superior", r: [570, 725, 116, 130], path: "M595 725 H686 V766 H672 V855 H570 V760 H595 Z", label: ["Cozinha"] },
  { id: "a2-copa", name: "Copa", r: [686, 725, 64, 41] },
  { id: "a2-despensa", name: "Despensa", r: [674, 767, 76, 83] },
  { id: "a2-hall", name: "Hall de Entrada", r: [570, 857, 100, 88], kind: "circ", label: ["Hall de", "Entrada"] },
  { id: "a2-bwc2", name: "BWC Direção", r: [470, 890, 39, 36], label: ["BWC"] },
  { id: "a2-deposito", name: "Depósito", r: [470, 928, 39, 42], label: ["Depó-", "sito"] },
  { id: "a2-direcao", name: "Direção", r: [511, 890, 58, 80] },
  { id: "a2-recebimento", name: "Recebimento", r: [672, 860, 75, 62] },
  { id: "a2-info", name: "Multimeios", r: [752, 809, 115, 112] },
  { id: "a2-reuniao", name: "Sala dos Professores", r: [752, 557, 152, 125], path: "M752 557 H827 V593 H904 V682 H752 Z", label: ["Sala dos", "Professores"] },
  { id: "a2-bwc-fem", name: "BWC Feminino", r: [827, 557, 38, 35], label: ["BWC F"] },
  { id: "a2-bwc-masc", name: "BWC Masculino", r: [866, 557, 38, 35], label: ["BWC M"] },
  { id: "a2-sala3", name: "Brinquedoteca", r: [907, 559, 123, 151] },
  { id: "a2-biblioteca", name: "Biblioteca", r: [907, 714, 123, 331] },
  { id: "a2-rampa", name: "Rampa de Acesso", r: [750, 685, 25, 39], kind: "circ", label: ["Rampa"] },
  { id: "a2-circ", name: "Circulação Central", r: [775, 685, 129, 215], kind: "circ", path: "M775 685 H904 V900 H867 V809 H837 V725 H775 Z", label: ["Circulação"], rotulo: [867, 725, 37, 175] },
  { id: "a2-dep-escada", name: "Depósito sob a Escada", r: [752, 725, 84, 41], label: ["Depósito", "(a confirmar)"] },
  { id: "a2-escada", name: "Escada de Acesso", r: [752, 767, 84, 40], kind: "circ", label: ["Escada"] },
  { id: "a2-rampa-externa", name: "Rampa Existente", r: [624, 966, 236, 84], kind: "circ" },
  { id: "a2-deposito2", name: "Depósito Externo", r: [624, 1051, 138, 69], label: ["Depósito"] },
  { id: "a2-lavanderia", name: "Lavanderia", r: [764, 1094, 96, 26] },
];

export const BLOCOS_SUPERIOR = [
  { id: "bloco-a2", name: "Pavimento superior", short: "A2", r: [207, 557, 823, 563],
    path: "M207 700 H332 V696 H750 V685 H752 V557 H1030 V1045 H862 V1120 H624 V970 H470 V889 H207 Z",
    members: SUPERIOR.map((s) => s.id) },
];

export const ANDARES = {
  terreo: { nome: "Térreo", ambientes: TERREO, blocos: BLOCOS_TERREO, viewBox: [8, -178, 1175, 934] },
  superior: { nome: "Superior", ambientes: SUPERIOR, blocos: BLOCOS_SUPERIOR, viewBox: [195, 545, 847, 587] },
};

/** Índice id → { ambiente, andar, bloco } para buscas rápidas. */
export const INDICE = {};
for (const [andar, a] of Object.entries(ANDARES)) {
  for (const amb of a.ambientes) {
    const bloco = a.blocos.find((b) => b.members.includes(amb.id));
    INDICE[amb.id] = { ambiente: amb, andar, bloco };
  }
  for (const b of a.blocos) INDICE[b.id] = { ambiente: b, andar, bloco: null };
}
