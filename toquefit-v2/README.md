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
