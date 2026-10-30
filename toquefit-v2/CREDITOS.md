# Créditos e licenças

Tudo o que a demonstração usa, de onde veio e se pode ser usado comercialmente.
⚠️ marca o que precisa de decisão antes de vender o produto.

## Personagem 3D: Michelle

- **Origem:** Mixamo (Adobe), personagem "Michelle", esqueleto `mixamorig`. Arquivo `assets/michelle.glb`, comprimido para `public/models/michelle.glb` (meshopt + texturas WebP 1024 px, de 3,2 MB para 324 KB).
- **Licença:** pelo FAQ da Adobe, personagens e animações da Mixamo podem ser usados sem royalties em projetos pessoais, comerciais e sem fins lucrativos, inclusive em produtos vendidos. O que não pode é redistribuir os arquivos soltos, como asset avulso (por exemplo, em um pacote de modelos). Dentro de um site ou app é permitido.
- **Conferir:** https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html. Quem baixou da Mixamo precisa ter conta Adobe; vale guardar o comprovante da conta usada.

## Animação

- **Sem animação Mixamo.** O pacote não trouxe `bench-press.fbx`. O supino é uma pose calculada por código (IK de dois ossos, em `src/cena/supino.ts`), feita para este projeto. Não há licença de terceiros envolvida.
- Se depois entrar a animação "Bench Press" da Mixamo, vale a mesma licença do personagem.

## Voz da instrutora ⚠️

- **Ferramenta:** [edge-tts](https://github.com/rany2/edge-tts) 7.3.1 (licença GPL-3.0). É usado só para gerar os arquivos e não vai junto com o site. Os áudios gerados não ficam sob a GPL.
- **Voz:** `pt-BR-FranciscaNeural`, da Microsoft (Azure Neural TTS). Os 10 áudios ficam em `public/audio/supino-reto/`, com os tempos de cada palavra em JSON ao lado.
- **⚠️ Uso comercial incerto.** O edge-tts usa o serviço de "Ler em voz alta" do navegador Edge, sem contrato com a Microsoft. Para uma demonstração de venda o risco é baixo. Para o produto real, gere os mesmos textos pela **Azure AI Speech oficial**, que tem a mesma voz e devolve os tempos de palavra. O plano gratuito F0 cobre 0,5 milhão de caracteres por mês, e o roteiro inteiro tem cerca de 900. Basta trocar a chamada em `ferramentas/gerar_voz.py` e guardar a chave só em `.env`.
- Alternativa offline: Piper TTS (MIT). Não achei voz feminina pt-BR com qualidade parecida.

## Fontes (todas SIL Open Font License 1.1, uso comercial permitido)

- **Archivo** (Omnibus-Type): títulos, legenda e números, com largura variável. Pacote `@fontsource-variable/archivo`.
- **Figtree** (Erik Kennedy): texto. Pacote `@fontsource-variable/figtree`.
- **JetBrains Mono** (JetBrains): códigos de tag. Pacote `@fontsource-variable/jetbrains-mono`.
- As fontes são servidas pelo próprio site, sem chamar o Google Fonts.

## Bibliotecas

| Biblioteca | Uso | Licença |
|---|---|---|
| three.js 0.186 | cena 3D, GLTFLoader, decodificador meshopt | MIT |
| Motion 14 | animações da interface | MIT |
| Vite 8 | servidor de desenvolvimento e build | MIT |
| TypeScript 7 | tipos | Apache-2.0 |
| @gltf-transform/cli 4 | compressão do modelo (só ferramenta) | MIT |
| Playwright 1.64 | testes e prints (só ferramenta) | Apache-2.0 |
| meshoptimizer (dentro do three.js) | descompressão do modelo | MIT |

## Dados e marca

- "Titan Academia", os instrutores, os CREFs e todos os números são **fictícios**, só para a demonstração.
- Ícones desenhados para o projeto, em traço próprio.

## Resumo

| Item | Pode vender? |
|---|---|
| Michelle (Mixamo) | Sim, dentro do produto |
| Pose do supino | Sim, é própria |
| Fontes | Sim (OFL) |
| Bibliotecas | Sim (MIT/Apache) |
| Voz edge-tts | ⚠️ Gerar de novo pela Azure oficial antes do produto real |
