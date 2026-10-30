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
  - Peças comuns: `roteiro3d.ts` (laço de quadro: trecho, câmera, replay e rótulos), `pessoa.ts` (instrutora, IK de braços e pernas, giro do corpo e coluna), `cadeira.ts` (extensora e flexora), `pecas.ts` (caixas, tubos e pilha de anilhas), `camera.ts`, `rotulos.ts`, `estudio.ts` e `pilha.ts` (aparelhos sem roteiro).
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
npm run modelo                    # recomprime assets/michelle.glb
```

Para trocar um texto, edite o roteiro e rode `npm run voz`. A duração dos trechos se ajusta sozinha ao áudio.

Só o supino tem voz gravada. Os outros seis roteiros tocam sem voz até rodar o comando acima para cada um: `leg-press-45`, `cadeira-extensora`, `cadeira-flexora`, `desenvolvimento`, `remada-baixa` e `puxada-frontal`.

No modo dev, `__ir("descida", "Desça")` no console pausa o vídeo e pula para a palavra (ou para os segundos) de um trecho.

## Testes (com `npm run dev` rodando, Chrome instalado)

```bash
node tests/geral.mjs              # prints 375/1280 de cada capítulo e do painel, console, rolagem lateral
node tests/sincronia.mjs "?sem3d" # legenda × voz
```

Créditos e licenças: [CREDITOS.md](CREDITOS.md).
