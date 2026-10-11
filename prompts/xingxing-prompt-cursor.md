# Prompt para o Cursor: identidade visual do Xingxing

Cole o texto abaixo no chat do Cursor, com o projeto do app aberto.

---

Aplique a identidade visual abaixo ao nosso app (PWA de organização da casa e listas de compras, gamificado, para duas pessoas). Não mude regras de negócio nem a estrutura de dados: esta tarefa é só nome, ícone, cores, tipografia e estilo dos componentes.

## 1. Nome

- O app se chama **Xingxing** (escrito assim, com X maiúsculo só no início).
- Xingxing é a nossa mascote: uma macaca de um braço só. Em mandarim, *xīngxing* (星星) significa "estrelinhas".
- Por isso a moeda da gamificação se chama **estrelinhas**: troque na interface qualquer menção a "pontos" por "estrelinhas", usando um ícone de estrela dourada ao lado do número.
- Use o nome em: `<title>`, `name` e `short_name` do `manifest.webmanifest`, `apple-mobile-web-app-title`, tela de login e cabeçalho da tela inicial.
- Subtítulo sugerido para a tela de login: "Casa em dia, estrelinhas no bolso".

## 2. Ícone: "Xingxing da sorte"

A Xingxing sentada em pose de maneki-neko (o gato da sorte japonês), com o único braço levantado segurando uma estrela dourada, sobre fundo vermelho-laca. Ela tem um braço só: **nunca desenhe o segundo braço**.

Salve o SVG abaixo como `public/icons/icon.svg` (ele é a fonte de todos os tamanhos):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Xingxing">
  <rect width="512" height="512" fill="#B3261E"/>
  <circle cx="256" cy="256" r="226" fill="none" stroke="#F2B632" stroke-width="6" opacity="0.35"/>
  <path d="M330 410 C 410 425, 440 350, 392 330" fill="none" stroke="#5A3620" stroke-width="22" stroke-linecap="round"/>
  <path d="M335 335 C 390 320, 425 270, 425 205" fill="none" stroke="#6B4226" stroke-width="46" stroke-linecap="round"/>
  <polygon points="425,90 437.3,123 472.6,124.5 445,146.5 454.4,180.5 425,161 395.6,180.5 405,146.5 377.4,124.5 412.7,123" fill="#F2B632" stroke="#F2B632" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="425" cy="200" r="25" fill="#F3D9B1"/>
  <ellipse cx="256" cy="380" rx="108" ry="112" fill="#6B4226"/>
  <ellipse cx="256" cy="395" rx="62" ry="74" fill="#F3D9B1"/>
  <path d="M186 300 Q256 338 326 300" fill="none" stroke="#2F6B4F" stroke-width="18" stroke-linecap="round"/>
  <circle cx="150" cy="215" r="34" fill="#6B4226"/>
  <circle cx="150" cy="215" r="18" fill="#F3D9B1"/>
  <circle cx="362" cy="215" r="34" fill="#6B4226"/>
  <circle cx="362" cy="215" r="18" fill="#F3D9B1"/>
  <circle cx="256" cy="215" r="100" fill="#6B4226"/>
  <circle cx="226" cy="202" r="46" fill="#F3D9B1"/>
  <circle cx="286" cy="202" r="46" fill="#F3D9B1"/>
  <ellipse cx="256" cy="250" rx="60" ry="44" fill="#F3D9B1"/>
  <path d="M212 208 q15 -18 30 0" fill="none" stroke="#2A1A12" stroke-width="7" stroke-linecap="round"/>
  <path d="M270 208 q15 -18 30 0" fill="none" stroke="#2A1A12" stroke-width="7" stroke-linecap="round"/>
  <circle cx="204" cy="240" r="13" fill="#E88A7A" opacity="0.75"/>
  <circle cx="308" cy="240" r="13" fill="#E88A7A" opacity="0.75"/>
  <ellipse cx="256" cy="238" rx="9" ry="6" fill="#2A1A12"/>
  <path d="M238 258 q18 16 36 0" fill="none" stroke="#2A1A12" stroke-width="7" stroke-linecap="round"/>
  <circle cx="256" cy="326" r="18" fill="#F2B632"/>
  <path d="M244 328 h24 M256 328 v12" fill="none" stroke="#8A5A10" stroke-width="4" stroke-linecap="round"/>
</svg>
```

A partir dele, gere e registre:

- `apple-touch-icon.png` 180x180, **quadrado, sem transparência e sem cantos arredondados** (o iOS arredonda sozinho), com `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` no `index.html`.
- `icon-192.png` e `icon-512.png` no `manifest.webmanifest` com `"purpose": "any"`.
- `icon-maskable-512.png` com `"purpose": "maskable"`: mesmo fundo vermelho cobrindo tudo, mas com o desenho reduzido para 80% e centralizado, porque a estrela fica perto da borda e seria cortada.
- `favicon.svg` (o próprio SVG).
- Use um script com `sharp` (ou equivalente) para exportar os PNGs, e deixe o script no repositório (`scripts/gerar-icones.mjs`).

Reaproveite o desenho da Xingxing (sem o fundo) como mascote na tela de login e nos estados vazios ("nenhuma tarefa para hoje").

## 3. Estética

Oriental, fofa e limpa. Referências: maneki-neko, chá matchá, flor de cerejeira (sakura), carimbos hanko, lanternas de papel, papel de arroz.

- Fundos lisos em tom de papel, sem degradês e sem sombras pesadas.
- Cantos bem arredondados: 20px em cartões, 14px em botões e campos, formato de pílula em etiquetas e contadores.
- Formas simples e cheias, com contorno só quando necessário (1px na cor `--borda`).
- Estrela dourada como elemento recorrente: recompensa de cada tarefa, saldo, meta semanal e conquistas.
- Detalhes pontuais no estilo carimbo (selo redondo ou quadrado na cor primária) para marcar "feito" e conquistas.
- Animações curtas e alegres ao concluir tarefa: a estrela pula para o contador (até 400ms), respeitando `prefers-reduced-motion`.
- Nada de emojis como ícones: use ícones SVG de traço arredondado.
- Tipografia: **Zen Maru Gothic** (Google Fonts, pesos 400, 500 e 700), com `system-ui` como reserva. Títulos em 700, corpo em 400/500, tamanho base 16px.
- Áreas de toque com no mínimo 44x44px e contraste de texto de pelo menos 4,5:1.

## 4. Paleta de cores: Matchá e sakura (dia e noite)

A paleta do app é **Matchá e sakura**: verde-matchá como cor principal, rosa-sakura nos detalhes, dourado nas estrelinhas e fundo em tom de papel. Ela tem duas versões, **dia** e **noite**. A versão noite usa um verde bem profundo (folha de chá à noite) no lugar de preto ou azul, para manter a mesma atmosfera.

Regras:

- Use variáveis CSS e o atributo `data-tema` no `<html>` (`dia` ou `noite`). Todos os componentes devem usar só as variáveis, nunca cores fixas.
- Por padrão, o tema acompanha o modo claro/escuro do iPhone via `prefers-color-scheme`, reagindo à mudança em tempo real.
- Na tela de ajustes, crie a opção "Aparência" com três escolhas: **Automático** (padrão), **Dia** e **Noite**. Salve a escolha no `localStorage` e aplique-a antes da primeira pintura (script curto no `<head>`) para não piscar o tema errado ao abrir.
- Atualize a `<meta name="theme-color">` conforme o tema ativo (`#F3F1E4` no dia, `#171D14` na noite) e defina `background_color` e `theme_color` do manifesto como `#F3F1E4`.
- Defina `color-scheme: light` e `color-scheme: dark` em cada tema para que campos e barras de rolagem nativos acompanhem.

```css
:root,
[data-tema="dia"] {
  color-scheme: light;
  --fundo: #F3F1E4;           /* papel */
  --superficie: #FFFFFF;      /* cartões */
  --borda: #DDDCC6;
  --primaria: #4F6B3A;        /* matchá: botões, marcações, links */
  --sobre-primaria: #FFFFFF;
  --secundaria: #E9A9A9;      /* sakura: etiquetas, barra de progresso, detalhes */
  --sobre-secundaria: #26301F;
  --matcha-forte: #4F6B3A;    /* cartão de destaque (meta da semana) */
  --sobre-matcha-forte: #FFFFFF;
  --destaque: #D9A441;        /* estrelinhas */
  --sucesso: #4F6B3A;
  --texto: #26301F;
  --texto-suave: #56604A;
}

[data-tema="noite"] {
  color-scheme: dark;
  --fundo: #171D14;           /* verde-noite */
  --superficie: #222B1D;      /* cartões */
  --borda: #34402C;
  --primaria: #A9C48A;        /* matchá claro: botões, marcações, links */
  --sobre-primaria: #171D14;
  --secundaria: #F0B7B7;      /* sakura */
  --sobre-secundaria: #171D14;
  --matcha-forte: #4F6B3A;    /* igual ao dia, para reconhecer o tema */
  --sobre-matcha-forte: #FFFFFF;
  --destaque: #E3B95C;        /* estrelinhas */
  --sucesso: #A9C48A;
  --texto: #F1EFE2;
  --texto-suave: #B4BCA6;
}
```

Como aplicar:

- **Botão principal**: fundo `--primaria`, texto `--sobre-primaria`.
- **Cartão "Meta da semana"**: fundo `--matcha-forte`, texto `--sobre-matcha-forte`, barra de progresso preenchida com `--secundaria`.
- **Cartões e listas**: fundo `--superficie`, borda de 1px `--borda`, divisórias `--borda`.
- **Caixa de marcação**: contorno `--primaria` quando pendente; preenchida com `--sucesso` e visto na cor `--sobre-primaria` quando concluída. Tarefa concluída fica riscada em `--texto-suave`.
- **Etiquetas** (por exemplo "libera missão"): fundo `--secundaria`, texto `--sobre-secundaria`.
- **Estrelinhas**: ícone de estrela em `--destaque`, sempre acompanhado do número em `--texto`.

O **ícone do app continua vermelho-laca** (`#B3261E`) nos dois temas: ele é a marca e contrasta bem com o verde. Dentro do app, use vermelho só no ícone e na mascote, nunca em botões ou textos.

## 5. Entrega

1. Liste os arquivos que vai alterar antes de começar.
2. Aplique nome, ícones, tokens de cor, tipografia e estilo dos componentes existentes.
3. Ao final, diga como testar: instalar pelo Safari na tela de início do iPhone, conferir o ícone e o nome, e alternar o modo escuro do iPhone para ver o app mudar entre dia e noite (e depois testar as opções Dia e Noite nos ajustes).
