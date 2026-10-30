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
- `src/data/roteiros/supino-reto.json`: roteiro do supino. Cada trecho tem câmera, passo, fala e marcações. `[[45°|ok|grande]]` destaca o termo na legenda e mostra o número grande sobre o vídeo.
- `public/audio/supino-reto/`: um MP3 por trecho e um JSON com os tempos de cada palavra.
- `src/player/`: linha do tempo, legenda karaokê e player (o áudio manda no relógio).
- `src/cena/`: three.js. Instrutora com pose calculada e pilha de anilhas. Só é baixado quando o player aparece na tela.

## Regenerar

```bash
npm run voz                       # todos os trechos (edge-tts)
python ferramentas/gerar_voz.py descida   # só um trecho
npm run modelo                    # recomprime assets/michelle.glb
```

Para trocar um texto, edite o roteiro e rode `npm run voz`. A duração dos trechos se ajusta sozinha ao áudio.

## Testes (com `npm run dev` rodando, Chrome instalado)

```bash
node tests/geral.mjs              # prints 375/1280 de cada capítulo e do painel, console, rolagem lateral
node tests/sincronia.mjs "?sem3d" # legenda × voz
```

Créditos e licenças: [CREDITOS.md](CREDITOS.md).
