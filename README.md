# Jogo dos Pôneis

Jogo educativo feito para uso doméstico. Roda no navegador do celular, sem
servidor, sem build, sem dependência. É só abrir o `index.html`.

> **Repositório privado.** As imagens dos personagens são arte da Hasbro,
> usadas aqui em um projeto pessoal que não é distribuído. Não tornar público
> nem publicar em GitHub Pages aberto.

## Estrutura

```
index.html            a tela do jogo
css/estilo.css        todo o visual
js/personagens.js     GERADO pelo script — nome + caminho de cada imagem
js/poneis.js          lista dos pôneis, desenho SVG e a camada de retrato
js/jogo.js            estado, rodadas e os dois modos de brincadeira
imagens/              as imagens baixadas da wiki
ferramentas/          script que baixa nome + imagem dos personagens
```

## Modos

- **Cadê o Pônei?** — a voz fala um nome, ela toca no pônei certo.
  Começa com 2 opções e vai até 6.
- **Quem Sumiu?** — um grupo aparece, um pônei some, ela diz quem era.
  Começa com 3 na mesa e vai até 6. As opções de resposta incluem pôneis
  que não estavam na mesa, então não dá pra acertar por eliminação.

## Imagens

O jogo funciona sem nenhuma imagem: nesse caso desenha os pôneis em SVG.

Para usar as imagens da wiki:

1. Rodar `ferramentas/baixar-poneis.bat` (Windows).
2. Copiar as imagens geradas para `imagens/`.
3. Substituir o conteúdo de `js/personagens.js` pelo `personagens.js` gerado.

A tela inicial mostra quantos pôneis já têm imagem e, tocando na linha,
quais ainda estão sem. Quem não tiver imagem continua aparecendo em SVG —
nada quebra pela metade.

## Colocar no celular

Como não tem build, qualquer uma das opções serve:

- copiar a pasta inteira para o celular e abrir o `index.html` pelo navegador;
- rodar um servidor local na máquina e acessar pelo Wi-Fi de casa:
  `python -m http.server 8000` e abrir `http://IP-DA-MAQUINA:8000` no celular.

O segundo é mais confortável para desenvolver, porque basta atualizar a página.

## Git

```bash
git init
git add .
git commit -m "Primeira versão: dois modos de jogo e camada de imagens"
git branch -M main
git remote add origin git@github.com:USUARIO/jogo-poneis.git
git push -u origin main
```

Criar o repositório no GitHub **como privado** antes do `push`.

## Estado atual

Funcionando: os dois modos, voz em português com diagnóstico na tela,
dificuldade progressiva, camada de imagem com queda para SVG.

Pendente: confirmar se a voz sai no celular; ajustar o tempo de memorização
do "Quem Sumiu?"; padronizar o enquadramento das imagens da wiki, que vêm em
recortes e tamanhos bem diferentes entre si.
