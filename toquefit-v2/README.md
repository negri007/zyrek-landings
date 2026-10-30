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
- `src/data/roteiros/<aparelho>.json`: roteiros com instrutora 3D (`supino-reto` e `leg-press-45`). Cada trecho tem câmera, passo, fala e marcações. `[[45°|ok|grande]]` destaca o termo na legenda e mostra o número grande sobre o vídeo.
- `public/audio/<aparelho>/`: um MP3 por trecho e um JSON com os tempos de cada palavra. Sem esses arquivos o vídeo toca sem voz, com a legenda no tempo estimado.
- `src/player/`: linha do tempo, legenda karaokê e player (o áudio manda no relógio).
- `src/cena/`: three.js, só baixado quando o player aparece na tela.
  - `supino.ts` e `legpress.ts`: aparelho e coreografia de cada roteiro; `carga.ts` liga o roteiro à cena e `catalogo.ts` guarda a imagem de reserva e o desenho de carregamento.
  - `pessoa.ts` (instrutora e IK), `camera.ts` (cortes de câmera), `rotulos.ts` (rótulos que desviam do corpo), `estudio.ts` (luz e materiais), `pilha.ts` (aparelhos sem roteiro).

## Novo aparelho com instrutora

1. Escreva `src/data/roteiros/<aparelho>.json` e registre em `src/data/carregar.ts`.
2. Crie a cena em `src/cena/<aparelho>.ts` (use `legpress.ts` como modelo) e registre em `src/cena/carga.ts` e `src/cena/catalogo.ts`.
3. Ponha `"roteiro": "<aparelho>"` no aparelho em `src/data/aparelhos.json`.
4. Gere a voz (abaixo).

## Regenerar

```bash
npm run voz                                   # todos os trechos do supino (edge-tts)
npm run voz -- --roteiro leg-press-45         # todos os trechos do leg press
python ferramentas/gerar_voz.py descida       # só um trecho do supino
npm run modelo                    # recomprime assets/michelle.glb
```

Para trocar um texto, edite o roteiro e rode `npm run voz`. A duração dos trechos se ajusta sozinha ao áudio.

## Testes (com `npm run dev` rodando, Chrome instalado)

```bash
node tests/geral.mjs              # prints 375/1280 de cada capítulo e do painel, console, rolagem lateral
node tests/sincronia.mjs "?sem3d" # legenda × voz
```

Créditos e licenças: [CREDITOS.md](CREDITOS.md).
