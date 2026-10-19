---
name: Huallany · Fisioterapia e Pilates (Noite cacau)
description: "Scoped visual world for landings-motion/huallany.html only (and its offline copy celular/huallany.html): a lunar calendar of the body, cacau night and cream day, gold moonlight from her studio wall, one hand-drawn line. Not a project-wide system."
colors:
  cacau: "#4A2E24"
  noite: "#2B1A13"
  creme: "#F3EAD8"
  creme-2: "#EADCC3"
  terracota: "#8A5A47"
  terracota-2: "#6E4434"
  ouro: "#EDB24E"
  ouro-claro: "#FAD36B"
  tinta: "#3A241B"
  tinta-2: "#6B5044"
  leite: "#F8F1E4"
  leite-2: "#D8C4A6"
  parede: "#8E693B"
  erro-borda: "#F0A08A"
  erro-texto: "#F6B9A6"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(64px, 8vw, 104px)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(38px, 5vw, 60px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.01em"
  proposition:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(25px, 2.6vw, 34px)"
    fontWeight: 400
    lineHeight: 1.22
  list-display:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(30px, 4vw, 50px)"
    fontWeight: 400
    lineHeight: 1.28
  title:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(28px, 2.6vw, 36px)"
    fontWeight: 500
    lineHeight: 1.12
  title-italic:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(30px, 3vw, 38px)"
    fontWeight: 500
    lineHeight: 1.1
  phase-label:
    fontFamily: "Cormorant Garamond, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Jost, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 300
    lineHeight: 1.65
  lead:
    fontFamily: "Jost, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(18px, 1.5vw, 20px)"
    fontWeight: 300
    lineHeight: 1.65
  label:
    fontFamily: "Jost, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  button:
    fontFamily: "Jost, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  focus: "4px"
  field: "14px"
  arco: "999px 999px 18px 18px"
  arco-celular: "999px 999px 12px 12px"
  pill: "999px"
  circle: "50%"
spacing:
  margem-celular: "24px"
  margem-tablet: "48px"
  margem-desktop: "64px"
  container: "1200px"
  secao: "clamp(88px, 11vw, 148px)"
  secao-celular: "72px"
  alvo-toque: "44px"
components:
  button-ouro:
    backgroundColor: "{colors.ouro}"
    textColor: "{colors.noite}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "56px"
  button-ouro-hover:
    backgroundColor: "{colors.ouro-claro}"
    textColor: "{colors.noite}"
  button-cacau:
    backgroundColor: "{colors.cacau}"
    textColor: "{colors.leite}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "56px"
  button-cacau-hover:
    backgroundColor: "{colors.noite}"
    textColor: "{colors.leite}"
  chip-regiao:
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 15px"
    height: "44px"
  chip-regiao-ativo:
    backgroundColor: "{colors.terracota}"
    textColor: "{colors.leite}"
    rounded: "{rounded.pill}"
  campo:
    textColor: "{colors.leite}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
    height: "52px"
  monograma:
    textColor: "{colors.leite}"
    rounded: "{rounded.circle}"
    size: "52px"
  numero-passo:
    backgroundColor: "{colors.creme-2}"
    textColor: "{colors.terracota-2}"
    rounded: "{rounded.circle}"
    size: "46px"
  moldura-arco:
    backgroundColor: "{colors.parede}"
    rounded: "{rounded.arco}"
  botao-flutuante:
    backgroundColor: "{colors.ouro}"
    textColor: "{colors.noite}"
    rounded: "{rounded.circle}"
    size: "52px"
---

# Design System: Huallany · Fisioterapia e Pilates (Noite cacau)

## Overview

**Creative North Star: "O Calendário Lunar do Corpo"**

Esta página é um calendário lunar do corpo. Uma lua fixa cresce enquanto se lê, e as quatro fases (nova, crescente, cheia, minguante) dão nome aos quatro tipos de atendimento. O mundo vem do estúdio dela: a noite cacau das sombras das fotos, o dia creme dos posts, e o dourado da lua iluminada na parede do estúdio, tirado com conta-gotas das próprias fotos. Seções escuras e claras se alternam como noite e dia ao longo da rolagem.

A mão é de desenho. A órbita em volta do arco do topo e a silhueta do corpo são, cada uma, um traço contínuo, como nos posts dela; o fio dos passos e os desenhos dos reels têm a mesma espessura e a mesma mão, sem precisar ser traço único. Não é uma linha só descendo a página. O ritmo é calmo e editorial: muito ar, serifa grande, texto leve em Jost, poucos elementos por tela.

O mundo recusa o modelo de clínica: azul hospitalar, coração, foto de banco e cards com ícone. Foto só aparece dentro de molduras em arco ou círculo, e nunca há cartão com borda e sombra segurando conteúdo.

Onde o build divergiu do contrato de direção, vale o build: no celular a foto em arco fica ao lado do texto, como no computador, e não "espiando por baixo" como o contrato previa.

**Key Characteristics:**
- Noite cacau e dia creme alternados por seção; o dourado é luz, não decoração.
- A lua fixa muda de fase com a rolagem (hemisfério sul: a crescente acende à esquerda) e o lado aceso é a textura da lua da parede dela.
- Traço contínuo desenhado à mão para a órbita e o corpo; mesma espessura nos fios e desenhos.
- Cormorant Garamond itálica para o nome, Cormorant para títulos, Jost leve para o texto.
- Fotos só em arco ou círculo; nenhum card com cromo, nenhum ladrilho de ícone.

## Colors

Paleta quente de duas temperaturas, noite de cacau e dia de creme, com uma única luz dourada que vem da lua do estúdio.

### Primary
- **Ouro Lua da Parede** (ouro): a luz da lua. Preenche o botão principal, a lua fixa e o botão flutuante, desenha a órbita do topo, o contorno do monograma, os marcadores das credenciais e o anel de foco no escuro. É amostra direta da lua da parede (fotos.md), corrigida em relação ao dourado do briefing.
- **Ouro Claro** (ouro-claro): o brilho da lua. Hover do botão dourado, nomes das fases sobre cacau, títulos da coluna de contato e marcações pendentes no escuro.

### Secondary
- **Terracota dos Posts** (terracota): a linha no dia. Traço da silhueta, fio dos passos, desenhos dos reels, aros do FAQ, regiões ativas do mapa do corpo e anel de foco no creme.
- **Terracota Funda** (terracota-2): títulos itálicos do painel do mapa, números dos passos e legendas sobre creme, onde a terracota comum ficaria fraca.

### Neutral
- **Cacau** (cacau): chão da noite. Topo, seção das fases, reels, barra do celular e botão escuro do painel. Também é a cor do tema do navegador.
- **Noite** (noite): a sombra mais funda, tirada da roupa preta nas fotos. Seção de contato e rodapé, texto do botão dourado, base escura das luas.
- **Creme** (creme): chão do dia e cor do corpo da página.
- **Creme Dois** (creme-2): o dia um tom abaixo, só para separar "Como funciona" e o fundo dos números dos passos.
- **Tinta** (tinta) e **Tinta Dois** (tinta-2): texto sobre creme; a segunda para lead, avisos e respostas.
- **Leite** (leite) e **Leite Dois** (leite-2): texto sobre cacau e noite; a segunda para lead, papel, credenciais e links de navegação.
- **Parede do Estúdio** (parede): só o fundo da moldura em arco enquanto a foto do topo carrega, amostra da parede do estúdio.
- **Erro** (erro-borda, erro-texto): borda e mensagem do campo com erro no formulário escuro. Fora disso, não aparecem.

### Named Rules
**The Day and Night Rule.** Seções alternam noite (cacau ou noite) e dia (creme ou creme-2). No escuro a linha e o destaque são ouro; no claro são terracota. Desenho e divisão sobre creme são sempre terracota; sobre creme o ouro aparece só como luz da lua (a lua lateral e seu aro, os pontos do corpo, a lua dos desenhos), nunca como traço de desenho. Sobre cacau a terracota não aparece direto: só dentro de uma superfície creme, como a capa dos reels.

**The Moonlight Rule.** O ouro é a luz da lua e marca apenas a lua, a ação principal e a linha no escuro. Ele não vira fundo de seção nem cor de texto corrido.

## Typography

**Display Font:** Cormorant Garamond (com Georgia, Times New Roman), arquivos woff2 locais nos pesos 500, 400 itálico e 500 itálico.
**Body Font:** Jost (com system-ui, Segoe UI), woff2 locais nos pesos 300, 400 e 500.

**Character:** Uma serifa de livro, alta e delicada, contra uma geométrica leve e limpa. A serifa fala como ela escreve à mão; a Jost explica como num post educativo.

### Hierarchy
- **Display** (itálico 500, clamp(64px, 8vw, 104px), 0.9): só o nome "Huallany" no topo. O teto de 104px (6.5rem) mantém o nome livre do arco no computador.
- **Headline** (500, clamp(38px, 5vw, 60px), 1.06; 34px no celular): títulos de seção, até 18ch, com equilíbrio de quebra. Palavras de ênfase podem ir em itálico.
- **Proposition** (400, clamp(25px, 2.6vw, 34px), 1.22): a frase do topo, até 20ch.
- **List display** (400, clamp(30px, 4vw, 50px), 1.28; 27px no celular): a lista corrida de "Quem pode fazer Pilates", com anéis terracota entre os itens.
- **Title** (500, clamp(28px, 2.6vw, 36px), 1.12): nomes das fases, dos passos, dos reels e perguntas do FAQ (em escalas vizinhas).
- **Title italic** (itálico 500, clamp(30px, 3vw, 38px), 1.1): o nome da região aberta no painel do mapa.
- **Phase label** (itálico 400, 17px): nomes das fases da lua, junto das luas e na lateral.
- **Body** (Jost 300, 18px, 1.65): texto corrido, até 60ch.
- **Lead** (Jost 300, clamp(18px, 1.5vw, 20px)): o parágrafo sob cada título, até 46ch, em tinta-2 ou leite-2.
- **Label** (Jost 400, 15px): navegação, credenciais, regiões, rótulos de campo, avisos.
- **Button** (Jost 500, 16px, 0.02em): texto dos botões.

### Named Rules
**The Italic Is Her Name Rule.** O itálico grande pertence ao nome, ao monograma "HB" e às falas da lua (fases, painel, títulos da coluna de contato). Títulos de seção ficam em romano 500.

**The Light Body Rule.** O texto corrido é Jost 300. O peso 500 fica para botões e para strong; não há negrito de destaque em parágrafo.

## Layout

Coluna centrada de até 1200px com margem lateral de 24px no celular, 48px a partir de 601px e 64px a partir de 1100px; no computador a margem direita sobe para pelo menos 112px para deixar espaço à lua lateral. Seções respiram com clamp(88px, 11vw, 148px) em cima e embaixo (72px no celular).

O topo é uma grade de duas colunas: texto à esquerda e arco à direita. Isso vale em todas as larguras. Abaixo de 1100px a grade é "nome em cima, papel e frase à esquerda do arco (42% da largura), ações e credenciais embaixo em largura total". No celular, o mapa do corpo põe a silhueta à esquerda e as regiões empilhadas à direita, e as fases e o "Sobre" põem a foto pequena ao lado do título. No computador (a partir de 900px ou 1000px conforme a seção) as seções abrem em duas colunas assimétricas (cerca de 1.2 : 0.8) e a foto circular das fases fica fixa enquanto a lista rola.

Toda área tocável tem pelo menos 44px. O botão principal ocupa a largura toda no celular.

### Named Rules
**The Photo Beside Rule.** Em toda largura a foto em arco do topo fica ao lado do texto, nunca empilhada embaixo. O nome, o papel, a frase e o botão cabem na primeira tela do celular.

## Elevation & Depth

O mundo é plano e tonal: a profundidade vem da alternância noite e dia, não de sombra. As poucas sombras são difusas e quentes (sombra de cacau, nunca preta), e só existem para descolar da página o que é luz ou o que flutua: os botões, a barra do celular, o botão flutuante e a foto circular das fases.

### Shadow Vocabulary
- **Brilho do botão dourado** (`box-shadow: 0 10px 24px -12px rgba(20,10,5,.7)`): botão dourado sobre cacau ou noite.
- **Brilho do botão cacau** (`box-shadow: 0 10px 26px -14px rgba(43,26,19,.7)`): botão cacau sobre creme.
- **Flutuante** (`box-shadow: 0 12px 26px -10px rgba(43,26,19,.6)`): botão do WhatsApp que aparece ao subir a página no celular.
- **Barra** (`box-shadow: 0 8px 24px -16px rgba(43,26,19,.8)`): barra fixa do celular.
- **Halo da lua** (`box-shadow: 0 0 0 1px rgba(237,178,78,.5), 0 0 0 10px var(--cacau), 0 0 0 11px rgba(237,178,78,.28), 0 30px 60px -30px rgba(20,10,5,.8)`): dois aros dourados finos em volta da foto circular das fases.

### Named Rules
**The Warm Shadow Rule.** Sombra é sempre cacau translúcido, longa e macia, com deslocamento negativo de espalhamento. Nenhuma sombra dura, nenhuma sombra em bloco de texto.

## Shapes

A forma é a da lua e da janela do estúdio: arco e círculo. Fotos vivem em arcos (topo, retrato do "Sobre", capas dos reels, com cantos de baixo levemente arredondados, 12px a 18px) ou em círculos (fases, formatura). Botões e chips são pílulas; campos têm cantos de 14px; monograma, números dos passos, ícone do FAQ e pontos do corpo são círculos. Divisões são fios de 1px em terracota ou ouro translúcidos, nunca caixas. O separador da lista "Quem pode" é um anel terracota desenhado em CSS.

O traço é a outra forma do mundo: linhas de ponta redonda em terracota (creme) ou ouro (cacau), com espessura entre 1.4 e 2.2. A silhueta do corpo tem duas opções no CONFIG: "pincel" (padrão, contorno de espessura variável gerado a partir do caminho, engrossando nas curvas e afinando nas pontas, revelado por máscara) ou "fino" (traço uniforme de 2.2).

### Named Rules
**The Arch and Circle Rule.** Foto real só entra em arco ou círculo. Retângulo de foto, cartão com borda ou moldura com cromo não existem neste mundo.

## Components

### Buttons
Redondos e quentes, com um pequeno rebote ao toque.
- **Shape:** pílula (999px), altura mínima de 56px, padding lateral de 28px, ícone SVG de 20px antes do texto.
- **Primary (ouro):** fundo ouro, texto noite, brilho dourado. Usado no escuro: topo, formulário.
- **Secondary (cacau):** fundo cacau, texto leite. Usado no claro: painel do mapa do corpo.
- **Hover / Focus:** ouro passa para ouro claro, cacau passa para noite (transição de 0.25s). Foco é um anel de 2px a 4px de distância, ouro no escuro e terracota no creme. Ao apertar, encolhe para 0.96 e volta com mola (stiffness 700, damping 14).
- **Link:** sublinhado fino que engrossa para 2px no hover, altura mínima de 44px.

### Chips (regiões do corpo)
- **Style:** pílula de 44px com borda terracota translúcida, texto tinta.
- **State:** ativo vira terracota cheio com texto leite; o ponto correspondente na silhueta fica terracota e aumenta.

### Inputs / Fields
- **Style:** sobre noite, fundo leite a 6%, borda leite-2 a 45%, cantos de 14px, altura de 52px, cursor ouro; o select usa uma seta SVG dourada.
- **Focus:** borda ouro e fundo leite a 10%.
- **Error:** borda erro-borda e mensagem em erro-texto abaixo do campo.

### Navigation
- **Topo:** monograma "HB" em círculo de 52px com aro dourado à esquerda; links em Jost 15px leite-2 que clareiam para leite (a partir de 900px); no celular, só o @ do Instagram.
- **Barra do celular:** cacau, desce depois do topo com o monograma de 44px e a lua da fase atual com o nome dela.
- **Lua lateral (computador):** lua de 68px fixa à direita com o nome da fase escrito na vertical, terracota no creme e leite-2 no escuro.

### Lua que muda de fase (assinatura)
Uma lua fixa acompanha a rolagem e muda de fase seção a seção, travando em nova, crescente, cheia e minguante nas quatro fases de atendimento. Base noite (ou cacau no creme), aro ouro, e o lado aceso é um recorte da lua da parede dela (lua-textura.webp) cortado pela linha da fase. Hemisfério sul: a crescente acende do lado esquerdo. A lua nova fica só com o aro.

### Silhueta tocável (assinatura)
O corpo de perfil desenhado em traço contínuo (pincel por padrão), que se desenha ao entrar na tela. Depois, aparecem pontos dourados de 14px dentro de alvos de 44px, com um anel que respira. Tocar um ponto abre o painel com título itálico, texto e o botão cacau com a mensagem pronta para o WhatsApp.

### Fio dos passos
Números em círculo de 46px (creme-2, aro terracota, itálico) presos a um fio terracota de 1.6 que se desenha: vertical no celular, horizontal em quatro colunas no computador.

### Capa de reel
Arco de 9:14 em creme com botão de play cacau. Sem a capa real, mostra um desenho em traço terracota com uma lua dourada e o rótulo pendente; a foto dela substitui o desenho quando existir.

### Motion
Motion 12 e Lenis (lerp 0.1). Traços se desenham por stroke-dashoffset (órbita em 2.6s, corpo em 2.8s, fios em 1.6s, curva [0.45, 0, 0.2, 1]); textos sobem 18px com fade de 0.9s e stagger de 0.08s (curva cubic-bezier(.16,1,.3,1)); pontos do corpo respiram em 4.8s. Com movimento reduzido tudo fica parado e completo, sem Lenis.

## Do's and Don'ts

### Do:
- **Do** alternar seções de noite (cacau, noite) e dia (creme, creme-2), com linha ouro no escuro e terracota no claro.
- **Do** tirar o lado aceso de toda lua da textura da lua da parede dela, cortada pela linha da fase, com a crescente acesa à esquerda.
- **Do** desenhar órbita e corpo como traço contínuo de ponta redonda e manter fios e desenhos na mesma espessura (1.4 a 2.2).
- **Do** pôr fotos reais só em arco ou círculo, com a foto do topo ao lado do texto em toda largura.
- **Do** usar Cormorant Garamond itálica para o nome e o monograma, Cormorant 500 para títulos e Jost 300 para texto.
- **Do** manter alvos de toque de pelo menos 44px e desligar todo movimento com prefers-reduced-motion.

### Don't:
- **Don't** usar azul de clínica, coração, foto de banco ou cards com ícone.
- **Don't** colocar conteúdo em cartão com borda e sombra, nem ícones em ladrilho.
- **Don't** usar o ouro como fundo de seção ou cor de texto corrido.
- **Don't** usar sombra dura ou preta; sombra é cacau translúcido e macio.
- **Don't** pôr foto em retângulo solto.
