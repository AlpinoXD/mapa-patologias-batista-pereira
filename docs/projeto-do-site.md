# Mapa de patologias · EBM Batista Pereira

Reestruturação do site feito no Lovable (`projetointegradorescola`), mantendo a ideia: registrar e
apresentar, num mapa de calor sobre a planta da escola, o nível de cada problema pela Matriz GUT e as
patologias de cada ambiente.

## Intenção

Quem abre o site entende em cinco segundos onde estão os problemas mais graves da escola e, com um
clique num ambiente, vê exatamente quais patologias ele tem e por que receberam aquela nota.

## Pergunta da tela principal

"Quais ambientes da escola estão em pior estado, e por quê?"
A maior peça da tela é a planta colorida pelo GUT. Ao lado dela, a lista dos ambientes mais críticos
e, ao selecionar um ambiente, as patologias dele.

## O que se mantém do original

- Plantas do térreo (blocos A a E) e do pavimento superior (A2), com as coordenadas e os IDs exatos dos ambientes.
- Matriz GUT: G × U × T, de 1 a 5; faixas de risco 1–24, 25–48, 49–79 e 80–125.
- Quatro categorias: Estrutura; Hidráulica e telhado; Elétrica; Revestimentos.
- Várias patologias por categoria, cada uma com nota própria.
- Nota do ambiente = maior GUT entre as patologias; visão geral = maior GUT entre as categorias.
- Nota do bloco = média aritmética dos GUT das patologias dos ambientes do bloco (somente leitura),
  contando 1 para categoria sem patologia, como no original.
- Progresso da inspeção por categoria (o antigo modo "Concluídos"), anotações por ambiente,
  exportação em CSV e resumo para imprimir/PDF, sons de interação com botão para silenciar.

## O que muda

- **Sem login e sem servidor.** Os dados ficam em `site/src/dados/inspecao.json`, dentro do projeto.
  Qualquer pessoa vê o mapa. O modo edição (no próprio site) grava um rascunho no navegador e oferece
  "Baixar inspecao.json"; para publicar, o arquivo baixado substitui o do projeto.
- **Modelo de dados simples:** cada ambiente tem uma lista de patologias (categoria, descrição, G, U, T),
  anotações e o progresso por categoria. Some o campo "peças ocas", que já não aparecia na tela.
- **Ambiente sem patologia registrada aparece neutro**, não verde, para o calor ficar só onde há problema.
- **Editor GUT com escala explicada:** cada nota de 1 a 5 vira um botão com o significado
  (ex.: Urgência 5 = "ação imediata"), em vez de campos numéricos soltos.
- **Planta com zoom e arraste** (Ctrl + roda do mouse, pinça no trackpad e no celular, botões +/−). A roda sozinha rola a página.
- **Link direto para cada ambiente** (`/?ambiente=cozinha`), e voltar/avançar do navegador funcionam.
- **Página de patologias:** todas as patologias da escola numa tabela filtrável e ordenada por GUT.
- **Página "Matriz GUT":** como as notas são dadas e como ler o mapa.
- Menos controles empilhados: pavimento, visão e categoria numa só faixa.

## Fora do escopo

- Login, edição simultânea em equipe e histórico de alterações.
- Abertura animada com logo: é uma ferramenta de consulta, a planta abre direto.

## Anti-metas (o site fracassa, mesmo funcionando, se…)

- a planta não for legível no celular;
- uma nota aparecer sem a patologia que a justifica;
- a edição perder dados sem aviso (fechar a aba com alterações não exportadas);
- o calor pintar a escola inteira e esconder os poucos ambientes realmente críticos.

## Estrutura técnica

```
site/
  src/dados/planta.js        geometria dos ambientes e blocos (portada do original)
  src/dados/inspecao.json    registros de inspeção
  src/lib/gut.js             notas, riscos, médias de bloco (com testes)
  src/componentes/           Planta, painéis, editor
  src/paginas/               Mapa, Patologias, Matriz GUT
```

Vite + React 18, CSS puro, sem bibliotecas de interface. Roteador simples com `pushState`.

## Decisões do usuário

- 2026-11-07: dados em JSON no projeto, sem login. Preservar a posição exata dos ambientes; as notas
  GUT e anotações registradas no Lovable não precisam ser migradas.
- 2026-11-07: sem identidade visual nova; foco em estrutura, interface e experiência.
- 2026-11-07: protótipo do mapa aprovado; publicação no Netlify e repositório público no GitHub com o
  nome `mapa-patologias-batista-pereira`, com `noindex` enquanto os dados forem os de exemplo.
- 2026-11-07: a aparência segue a identidade do site original (fundo azul-escuro com grade de planta,
  painéis de vidro, ciano com brilho, pílulas, rótulos técnicos em monoespaçada), com ambientes sem
  registro só no traço da planta. Toda ação mostra o resultado antes do clique: prévia da planta ao
  passar sobre pavimento, visão e categoria; ambiente aceso ao passar numa lista; retângulo do zoom;
  nota prevista no editor; "Remover" e "Concluir" mostram como a nota e o progresso vão ficar.
