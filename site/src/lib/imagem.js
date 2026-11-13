// Reduz a foto no navegador antes de enviar: celular tira fotos de vários MB e o banco aceita até 1 MB por registro.
export const LIMITE_FOTO = 700_000; // caracteres do data URL (≈ 520 KB de imagem)

/** Maior tamanho que cabe em `max` mantendo a proporção; nunca amplia. */
export function caber(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

/** Devolve a foto como data URL JPEG dentro do limite, tentando tamanhos cada vez menores. */
export async function comprimir(arquivo) {
  if (!arquivo.type.startsWith("image/")) throw new Error("O arquivo não é uma imagem.");
  let img;
  try { img = await createImageBitmap(arquivo, { imageOrientation: "from-image" }); }
  catch { throw new Error("Não foi possível ler a imagem. Tente em JPG ou PNG."); }
  for (const [max, qualidade] of [[1280, 0.75], [1024, 0.65], [800, 0.55]]) {
    const [w, h] = caber(img.width, img.height, max);
    const tela = document.createElement("canvas");
    tela.width = w; tela.height = h;
    tela.getContext("2d").drawImage(img, 0, 0, w, h);
    const url = tela.toDataURL("image/jpeg", qualidade);
    if (url.length <= LIMITE_FOTO) return url;
  }
  throw new Error("A imagem é grande demais mesmo depois de reduzida.");
}
