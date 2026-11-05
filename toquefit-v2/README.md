# ToqueFit · demonstração v2

Cada aparelho da academia tem uma tag NFC. O aluno encosta o celular e abre o vídeo de como usar aquele aparelho. A academia acompanha tudo num painel.

- `#m-<aparelho>`: celular do aluno (ex.: `#m-supino-reto`)
- `#painel`: painel da academia

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # site estático em dist/
```

## Onde ficam as coisas

- `src/data/aparelhos.json`: aparelhos, chamados e números de exemplo (futura API).
- `src/data/roteiros/<aparelho>.json`: roteiros com instrutora 3D (`supino-reto`, `leg-press-45`, `cadeira-extensora`, `cadeira-flexora`, `desenvolvimento`, `remada-baixa` e `puxada-frontal`). Cada trecho tem câmera, passo, fala e marcações. `[[45°|ok|grande]]` destaca o termo na legenda e mostra o número grande sobre o vídeo.
- `public/audio/<aparelho>/`: um MP3 por trecho e um JSON com os tempos de cada palavra. Sem esses arquivos o vídeo toca sem voz, com a legenda no tempo estimado.
- `src/player/`: linha do tempo, legenda karaokê e player (o áudio manda no relógio).
- `src/cena/`: three.js, só baixado quando o player aparece na tela.
  - Uma cena por roteiro (`supino.ts`, `legpress.ts`, `extensora.ts`, `flexora.ts`, `desenvolvimento.ts`, `remada.ts`, `puxada.ts`): o aparelho, as câmeras e a coreografia de cada trecho. `carga.ts` liga o roteiro à cena e `catalogo.ts` guarda a imagem de reserva e o desenho de carregamento.
  - Peças comuns: `roteiro3d.ts` (laço de quadro: trecho, câmera, replay, rótulos, suavização da pose e cabeça acompanhando a fala), `pessoa.ts` (instrutora: IK de braços e pernas, `segurar` para fechar a mão em qualquer barra, giro do corpo, coluna e respiração), `cadeira.ts` (extensora e flexora), `pecas.ts` (caixas, tubos e pilha de anilhas), `estudio.ts` (luz, névoa e sombras de contato), `motor.ts` (renderizador único; `descartarCena` libera a placa de vídeo ao trocar de aparelho), `camera.ts`, `rotulos.ts` e `pilha.ts` (aparelhos sem roteiro).
- `src/ui/series.ts`: contador de séries com descanso no celular do aluno.

## Sala ao vivo (chamados entre aparelhos)

No painel, "Conectar celular" cria uma sala de 6 letras e mostra um QR Code. O celular que abre esse link (`?sala=CODIGO`) manda o "Chamar instrutor" para o servidor, e o painel, em outro aparelho, vê o chamado em até 4 segundos e pode atender. O aluno é avisado quando o chamado é atendido.

- Servidor: `netlify/functions/chamados.mjs` (Netlify Functions + Netlify Blobs). Um registro por chamado, que some depois de 12 h; até 40 chamados por sala; 400 pedidos por minuto por IP (no Wi-Fi da academia todos os celulares saem pelo mesmo IP). Fica em JavaScript porque o empacotador da Netlify não lê `.mts` com o TypeScript 7 do projeto.
- No `npm run dev` a mesma função roda pelo `vite.config.ts`, com um Blobs local em `.netlify/blobs-dev`. Não precisa da Netlify CLI.
- `npm run testar:api` testa a função (criar, listar, atender, cancelar, entradas inválidas e sala cheia).
- Sem sala, ou sem internet, tudo continua funcionando só no navegador. Sem conexão, o aluno vê que o instrutor não foi avisado.

## Área do aluno (ficha semanal no celular)

No painel, "Ativar área do aluno" cria a academia no servidor e guarda neste navegador o **código** (6 letras) e a **chave do instrutor**. Para abrir o mesmo painel em outro computador: "Abrir em outro computador" mostra os dois, e "Já tenho a chave" entra com eles.

1. **Novo aluno**: nome, um modelo de ficha (iniciante, ABC, AB, circuito) e os ajustes: exercício, séries, repetições, carga, descanso, observação e os dias de cada treino. A ficha tem validade.
2. **Cadastrar e gerar link**: QR Code, "Enviar pelo WhatsApp" e "Copiar link". O link (`#acesso=COD-ID-TOKEN`) abre uma vez e o celular fica conectado. O token vem depois do `#`, então não chega ao servidor nem aos logs, e some do endereço assim que é lido.
3. No celular, **Meu treino** mostra o treino do dia (pelo dia da semana ou o seguinte ao último feito), a carga da última vez, e o aluno marca cada exercício, anota a carga e diz como foi (leve, na medida, pesado, senti dor). Sem internet, guarda no celular e envia quando voltar.
4. **Encostar na tag** com o celular conectado: a página do aparelho mostra o exercício da ficha dele ali (séries, carga, última vez, marcar feito) e o contador de séries segue a ficha. O "Chamar instrutor" chega ao painel com o nome do aluno: o código da academia vira a sala ao vivo.
5. O painel mostra quem treinou na semana, fichas vencendo, quem sumiu há 7 dias e quem sentiu dor, e a ficha de cada aluno traz os treinos feitos e a evolução de carga.

- Servidor: `netlify/functions/academias.mjs` (Netlify Blobs: um registro por aluno e um por dia de treino). O servidor guarda só o hash da chave e dos tokens. "Gerar link novo" invalida o anterior; "Apagar aluno" apaga a ficha e todos os treinos.
- Só o nome do aluno: sem CPF, telefone ou anamnese (dados de saúde são sensíveis pela LGPD). O "senti dor" é só um aviso para o instrutor conversar.
- `npm run testar:api` também testa esta função (acesso, isolamento entre academias, limpeza das entradas, link novo, apagar).
- Para a versão comercial com várias academias e login por e-mail ou WhatsApp, o próximo passo é um banco com login (ex.: Supabase).

## Gravar as tags NFC

Cada tag guarda o link do aparelho: `https://toquefit-demo.netlify.app/#m-<aparelho>` (o painel mostra o link e o QR na gaveta de cada aparelho, e "Imprimir etiquetas" gera a folha com os QR Codes).

1. Instale o app **NFC Tools** (Android ou iPhone).
2. Gravar → Adicionar registro → **URL / URI** → cole o link do aparelho (ex.: `https://toquefit-demo.netlify.app/#m-leg-press-45`).
3. Gravar e encoste a tag nas costas do celular. Teste lendo a tag com a tela desbloqueada.
4. Cole a tag num ponto do aparelho onde o aluno alcança o celular, e a etiqueta com o QR ao lado (para quem tem NFC desligado ou iPhone antigo).

Aparelhos da demonstração: `supino-reto`, `leg-press-45`, `puxada-frontal`, `cadeira-extensora`, `remada-baixa`, `cadeira-flexora`, `desenvolvimento`, `crossover`.

## Novo aparelho com instrutora

1. Escreva `src/data/roteiros/<aparelho>.json` e registre em `src/data/carregar.ts`.
2. Crie a cena em `src/cena/<aparelho>.ts` com `cenaComRoteiro` (`remada.ts` e `desenvolvimento.ts` são bons modelos) e registre em `src/cena/carga.ts` e `src/cena/catalogo.ts`. Cada `case` da coreografia é o `id` de um trecho, e `tr.cue("palavra")` usa o tempo em que a instrutora fala aquela palavra.
3. Ponha `"roteiro": "<aparelho>"` no aparelho em `src/data/aparelhos.json`.
4. Gere a voz (abaixo).

## Regenerar

```bash
npm run voz                                   # todos os trechos do supino (edge-tts)
npm run voz -- --roteiro leg-press-45         # um roteiro inteiro (troque pelo slug de cada aparelho)
python ferramentas/gerar_voz.py descida       # só um trecho do supino
npm run voz:windows -- --roteiro remada-baixa   # voz do próprio Windows, sem internet nem Python
npm run voz:windows -- --todos                   # todos os roteiros com a voz do Windows
npm run modelo                    # recomprime assets/michelle.glb
```

Para trocar um texto, edite o roteiro e rode `npm run voz`. A duração dos trechos se ajusta sozinha ao áudio.

Há dois geradores com a mesma saída (MP3 + tempos de cada palavra):

- `npm run voz` usa o edge-tts (voz Francisca, neural). Precisa de Python, `pip install edge-tts` e ffmpeg. É a voz do supino.
- `npm run voz:windows` usa a voz Maria que já vem no Windows 10/11 (`ferramentas/voz-windows.ps1`). Não precisa de internet nem de instalar nada. A voz é menos natural que a Francisca. `--voz Daniel` troca para a voz masculina e `--taxa 1.1` acelera.

Hoje o supino está com a Francisca e os outros seis roteiros com a Maria do Windows. Para deixar tudo com a mesma voz, rode `npm run voz -- --roteiro <slug>` em cada um (Francisca) ou `npm run voz:windows -- --roteiro supino-reto` (Maria).

Antes de publicar, rode `npm run checar`: confere se cada palavra que a coreografia espera está na fala da instrutora, se todo trecho tem coreografia e se o roteiro está registrado em todos os lugares, e roda a checagem de tipos.

No modo dev, `__ir("descida", "Desça")` no console pausa o vídeo e pula para a palavra (ou para os segundos) de um trecho, e `window.__olhar = { p: [x, y, z], l: [x, y, z] }` prende a câmera num ponto para inspecionar detalhes (`null` solta).

## Testes (com `npm run dev` rodando, Chrome instalado)

```bash
node tests/geral.mjs              # prints 375/1280 de cada capítulo e do painel, console, rolagem lateral
node tests/sincronia.mjs "?sem3d" # legenda × voz
```

Créditos e licenças: [CREDITOS.md](CREDITOS.md).
