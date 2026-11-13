import { createContext, useContext } from "react";

/**
 * O que a edição conjunta expõe para os componentes: quem sou eu, se posso editar, quem mais está
 * online e onde, quem alterou cada ambiente por último e as ações de edição (já ligadas ao banco).
 */
export const Colab = createContext({
  usuario: null, editor: false, pessoas: [], meta: {}, edicao: null,
  definirEditando: () => {}, onDestacar: null,
});
export const useColab = () => useContext(Colab);

/** "há 3 min", "agora", "ontem" */
export function haQuanto(ms) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "agora";
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  if (s < 172800) return "ontem";
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export const primeiroNome = (nome = "") => nome.split(/[\s@]/)[0];

/** Foto da pessoa (ou a inicial) com o anel na cor dela. */
export function Avatar({ pessoa, tamanho = 28, titulo }) {
  const cor = pessoa.cor ?? "var(--primary)";
  return (
    <span className="avatar" style={{ "--cor": cor, width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }} title={titulo ?? pessoa.nome}>
      {pessoa.foto ? <img src={pessoa.foto} alt="" referrerPolicy="no-referrer" /> : primeiroNome(pessoa.nome).charAt(0).toUpperCase()}
    </span>
  );
}
