import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { haQuanto, primeiroNome } from "../lib/colab.jsx";

/** Miniaturas das fotos de uma patologia, botão de anexar (para quem edita) e visor em tamanho grande. */
export function Fotos({ ambiente, patologia, fotos, edicao }) {
  const [aberta, setAberta] = useState(null);
  const [estado, setEstado] = useState(""); // "", "enviando" ou a mensagem de erro
  const entrada = useRef(null);
  const foto = fotos.find((f) => f.id === aberta);

  const enviar = async (e) => {
    const arquivos = [...e.target.files];
    e.target.value = "";
    if (!arquivos.length) return;
    setEstado("enviando");
    try {
      for (const arquivo of arquivos) await edicao.anexarFoto(ambiente, patologia, arquivo);
      setEstado("");
    } catch (err) {
      setEstado(err.code === "permission-denied" ? "Seu e-mail não tem permissão para anexar fotos." : err.code ? "Não foi possível enviar a foto. Verifique a conexão." : err.message);
    }
  };

  if (!fotos.length && !edicao) return null;
  return (
    <div className="fotos">
      {fotos.map((f, i) => (
        <button key={f.id} type="button" className="miniatura" onClick={() => setAberta(f.id)}
          aria-label={`Abrir foto ${i + 1} de ${patologia.descricao}`} data-dica="Abre a foto em tamanho grande">
          <img src={f.dados} alt="" loading="lazy" />
        </button>
      ))}
      {edicao && <>
        <button type="button" className="botao anexar" onClick={() => entrada.current.click()} disabled={estado === "enviando"}
          aria-label={`Anexar foto a ${patologia.descricao}`} data-dica="Anexa fotos a esta patologia (câmera ou galeria); a imagem é reduzida antes do envio">
          {estado === "enviando" ? <LoaderCircle className="girando" /> : <ImagePlus />}
          {estado === "enviando" ? "Enviando…" : "Anexar foto"}
        </button>
        <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={enviar} />
      </>}
      {estado && estado !== "enviando" && <p className="erro" role="alert">{estado}</p>}
      {foto && (
        <VisorFoto foto={foto} descricao={patologia.descricao} onFechar={() => setAberta(null)}
          onRemover={edicao && (() => { if (confirm("Remover esta foto para toda a equipe?")) edicao.removerFoto(foto).catch(() => setEstado("Não foi possível remover a foto.")); })} />
      )}
    </div>
  );
}

function VisorFoto({ foto, descricao, onFechar, onRemover }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return (
    // clique fora da foto (no fundo escuro) fecha; Esc fecha pelo próprio <dialog>
    <dialog ref={ref} className="visor-foto" onClose={onFechar} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <img src={foto.dados} alt={`Foto da patologia: ${descricao}`} />
      <div className="visor-barra">
        <span className="meta">{descricao} · enviada por {primeiroNome(foto.nome)}, {haQuanto(foto.quando)}</span>
        {onRemover && <button type="button" className="botao-texto perigo" onClick={onRemover}><Trash2 /> Remover foto</button>}
        <button type="button" className="botao" autoFocus onClick={() => ref.current.close()}>Fechar</button>
      </div>
    </dialog>
  );
}
