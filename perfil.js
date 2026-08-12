<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Leva o Pônei — Labirinto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --lilas:#EFE3FF; --rosa-claro:#FFE4F2;
  --roxo:#6B3FBF; --roxo-escuro:#4A2A87;
  --rosa:#FF6FB0; --turquesa:#35CFC9; --amarelo:#FFD34A;
  --texto:#40276E;
  --parede:#7B57C9;
}
*{ box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
html,body{ height:100%; overflow:hidden; }
body{
  font-family:'Baloo 2','Segoe UI Rounded','SF Pro Rounded',system-ui,sans-serif;
  color:var(--texto);
  background:
    radial-gradient(1200px 600px at 20% -10%, #FFF6C9 0%, transparent 55%),
    linear-gradient(160deg, var(--lilas) 0%, var(--rosa-claro) 100%);
  display:flex; flex-direction:column;
  padding:calc(8px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));
  user-select:none; touch-action:none;
}

/* ---------- barra ---------- */
.barra{ display:flex; align-items:center; justify-content:space-between; gap:8px; flex:0 0 auto; margin-bottom:8px; }
.marcador{
  background:rgba(255,255,255,.75); border-radius:14px; padding:6px 14px;
  font-weight:800; font-size:17px; color:var(--roxo);
  box-shadow:0 2px 6px rgba(107,63,191,.14); text-align:center; min-width:72px;
}
.marcador span{ display:block; font-size:10px; font-weight:600; color:#9A83C4; letter-spacing:.08em; text-transform:uppercase; }
.icone{
  border:none; background:rgba(255,255,255,.75); color:var(--roxo);
  font-family:inherit; font-weight:800; font-size:20px;
  width:44px; height:44px; border-radius:14px; cursor:pointer;
  box-shadow:0 2px 6px rgba(107,63,191,.14); flex:0 0 auto;
}

/* ---------- labirinto ---------- */
#palco{ flex:1; min-height:0; display:flex; align-items:center; justify-content:center; }
#labirinto{ position:relative; }

.celula{
  position:absolute;
  border:0 solid var(--parede);
  background:rgba(255,255,255,.5);
}
.celula.chegada{ background:#D8F7F0; }

#poneiz, #amiga{
  position:absolute; display:flex; align-items:center; justify-content:center;
  pointer-events:none; z-index:3;
}
#poneiz{ z-index:4; }
#poneiz.andando{ transition:left .28s ease, top .28s ease; }

/* pegada de casco: fica na célula, com a ponta virada para onde ela foi */
.pegada{
  position:absolute; pointer-events:none; z-index:1;
  background-repeat:no-repeat; background-position:center; background-size:contain;
  /* ferradura: um arco grosso aberto embaixo, com os furos dos cravos.
     A gota anterior não lia como pegada de cavalo. */
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Cpath d='M17 47 A 17 19 0 1 1 43 47' fill='none' stroke='%236B4BB8' stroke-width='10' stroke-linecap='round' opacity='.42'/%3E%3Cg fill='%23F3EDFF' opacity='.85'%3E%3Ccircle cx='14.5' cy='36' r='2'/%3E%3Ccircle cx='17' cy='25' r='2'/%3E%3Ccircle cx='24' cy='17' r='2'/%3E%3Ccircle cx='36' cy='17' r='2'/%3E%3Ccircle cx='43' cy='25' r='2'/%3E%3Ccircle cx='45.5' cy='36' r='2'/%3E%3C/g%3E%3C/svg%3E");
  animation:pegadaSurge .28s ease-out both;
}
@keyframes pegadaSurge{
  from{ transform:scale(.4); opacity:0; }
  to  { transform:scale(1);  opacity:1; }
}
.pegada.atual{ animation:pegadaPulsa 1.2s ease-in-out infinite; }
@keyframes pegadaPulsa{
  0%,100%{ opacity:.75; }
  50%    { opacity:1; }
}
#poneiz img, #amiga img{ width:100%; height:100%; object-fit:contain; }
#poneiz .emoji, #amiga .emoji{ font-size:26px; }

@keyframes pulsa{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.12); } }

/* itens espalhados pelo labirinto */
.item{
  position:absolute; z-index:3; pointer-events:none;
  display:flex; align-items:center; justify-content:center;
  /* text-shadow no lugar de filter:drop-shadow. Filtro cria uma superfície
     separada que o navegador reprocessa a cada quadro; no celular ele
     desiste e a animação morre. text-shadow é pintado junto com o texto. */
  text-shadow:0 3px 4px rgba(60,40,110,.45);
  will-change:transform;
  animation:itemFlutua 2.2s ease-in-out infinite;
}
@keyframes itemFlutua{
  0%,100%{ transform:translate3d(0,0,0)    scale(1); }
  50%    { transform:translate3d(0,-14%,0) scale(1.08); }
}
.item.sumindo{ animation:itemPego .45s ease-out forwards; }
@keyframes itemPego{
  0%  { transform:translate3d(0,0,0)     scale(1);   opacity:1; }
  100%{ transform:translate3d(0,-90%,0)  scale(1.9); opacity:0; }
}

/* portão: fecha a chegada até ela achar a chave */
.portao{
  position:absolute; inset:0; z-index:3; pointer-events:none;
  display:flex; align-items:center; justify-content:center;
  border-radius:9px;
  background:repeating-linear-gradient(45deg,
    rgba(120,90,60,.85) 0 7px, rgba(150,115,75,.85) 7px 14px);
  box-shadow:inset 0 0 0 3px rgba(90,65,40,.9);
}
.portao.abrindo{ animation:portaoAbre .5s ease-in forwards; }
@keyframes portaoAbre{
  to{ transform:scaleY(0); opacity:0; }
}
#amiga{ animation:pulsa 1.6s ease-in-out infinite; }

/* ---------- setas ---------- */
#setas{
  flex:0 0 auto; display:grid; gap:8px; justify-content:center; margin-top:10px;
  grid-template-columns:repeat(3, 62px); grid-template-rows:repeat(2, 54px);
}
.seta{
  border:none; border-radius:18px; cursor:pointer;
  font-family:inherit; font-size:26px; font-weight:800; color:#fff;
  background:linear-gradient(180deg,#8B5CE0 0%, var(--roxo) 100%);
  box-shadow:0 4px 0 var(--roxo-escuro);
}
.seta:active{ transform:translateY(3px); box-shadow:0 1px 0 var(--roxo-escuro); }
.seta[data-dir="cima"]  { grid-column:2; grid-row:1; }
.seta[data-dir="esq"]   { grid-column:1; grid-row:2; }
.seta[data-dir="baixo"] { grid-column:2; grid-row:2; }
.seta[data-dir="dir"]   { grid-column:3; grid-row:2; }

/* ---------- vitória ---------- */
#festa{
  position:fixed; inset:0; z-index:60; display:none;
  align-items:center; justify-content:center; flex-direction:column; gap:14px;
  background:rgba(255,246,201,.92); text-align:center; padding:20px;
}
#festa.visivel{ display:flex; }
#festa .titulo{ font-size:clamp(30px,10vw,48px); font-weight:800; color:var(--roxo); text-shadow:0 3px 0 #fff; }
#festa .botao{
  border:none; border-radius:22px; cursor:pointer; font-family:inherit;
  font-weight:800; font-size:22px; color:#fff; padding:16px 30px;
  background:linear-gradient(180deg, var(--rosa) 0%, #E3488F 100%);
  box-shadow:0 5px 0 #C43A79;
}
.estrela-cai{ position:fixed; top:-40px; font-size:26px; pointer-events:none; animation:cair linear forwards; z-index:61; }
@keyframes cair{ to{ transform:translateY(110vh) rotate(360deg); opacity:.2; } }

/* ---------- voz ---------- */
#btnStatus, #btnTrocaVoz{
  border:none; border-radius:12px; cursor:pointer;
  font-family:inherit; font-weight:800; font-size:12px; padding:6px 10px;
  background:rgba(255,255,255,.8); color:#8A6FBF;
  box-shadow:0 2px 6px rgba(107,63,191,.14); flex:0 0 auto;
}
#btnStatus[data-ok="sim"]{ background:#D8F7F0; color:#12786F; }
#btnStatus[data-ok="nao"]{ background:#FFDDE6; color:#B02A4A; }
#recado{
  position:fixed; left:8px; right:8px; top:calc(56px + env(safe-area-inset-top)); z-index:70;
  background:#3B1220; color:#FFE6EE; border:2px solid var(--rosa); border-radius:14px;
  padding:10px 12px; font-size:13px; line-height:1.45; cursor:pointer;
  box-shadow:0 8px 24px rgba(0,0,0,.3);
}
#recado.escondida{ display:none; }

@media (prefers-reduced-motion: reduce){
  *{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
</style>
<link rel="stylesheet" href="cenario.css">
</head>
<body>
<div class="cenario-chao"></div>
<div class="cenario-brilho" style="left:8%;  top:30%; animation-delay:0s">✨</div>
<div class="cenario-brilho" style="left:86%; top:44%; animation-delay:1.6s">⭐</div>
<div class="cenario-brilho" style="left:20%; top:68%; animation-delay:3.1s">✨</div>
<div class="cenario-brilho" style="left:72%; top:22%; animation-delay:4.4s">💖</div>

<div id="recado" class="escondida"></div>

<div class="barra">
  <button class="icone" id="btnCasa" aria-label="Voltar aos jogos">🏠</button>
  <div class="marcador"><span>Estrelas</span><b id="mEstrelas">0</b></div>
  <div class="marcador"><span>Labirinto</span><b id="mNivel">1</b></div>
  <div class="marcador" id="caixaMacas"><span id="rotuloItem">Itens</span><b id="mMacas">0/0</b></div>
  <button id="btnTrocaVoz">trocar voz</button>
  <button id="btnStatus" data-ok="?">🔈 voz</button>
</div>

<div id="palco"><div id="labirinto"></div></div>

<div id="setas">
  <button class="seta" data-dir="cima"  aria-label="Para cima">▲</button>
  <button class="seta" data-dir="esq"   aria-label="Para a esquerda">◀</button>
  <button class="seta" data-dir="baixo" aria-label="Para baixo">▼</button>
  <button class="seta" data-dir="dir"   aria-label="Para a direita">▶</button>
</div>

<div id="festa">
  <div class="titulo" id="festaTitulo">Chegou!</div>
  <button class="botao" id="btnProximo">Outro labirinto</button>
</div>

<script src="personagens.js"></script>
<script src="voz.js"></script>
<script src="perfil.js"></script>
<script src="album.js"></script>
<script>
/* ===================================================================
   LABIRINTO — "Leva o Pônei"
   Ela tem 4 anos e não lê: a instrução é falada, e o caminho já
   percorrido fica pintado para ela não se perder.
   =================================================================== */

const $ = id => document.getElementById(id);

addEventListener("error", e => {
  const r = $("recado");
  if(!r) return;
  r.textContent = "Erro: " + e.message + (e.lineno ? " (linha " + e.lineno + ")" : "");
  r.classList.remove("escondida");
});
$("recado").addEventListener("click", () => $("recado").classList.add("escondida"));

/* o voz.js pode faltar — o jogo não pode morrer por causa disso */
const TEM_VOZJS = (typeof fala === "function");
const dizer   = t => { if(TEM_VOZJS) try{ fala(t); }catch(e){} };
const tocar   = f => { if(typeof f === "function") try{ f(); }catch(e){} };

/* ---------- elenco: usa as imagens já baixadas ---------- */
const TEM_ELENCO = (typeof PERSONAGENS !== "undefined" && Array.isArray(PERSONAGENS) && PERSONAGENS.length);
const sorteia = a => a[Math.floor(Math.random() * a.length)];

function retratoDe(p){
  if(p && p.img) return '<img src="' + encodeURI(p.img) + '" alt="' + p.nome + '">';
  return '<span class="emoji">🦄</span>';
}


/* ===================================================================
   CENÁRIOS
   Criança de 4 anos perde o interesse quando vê a mesma tela três
   vezes. Cada rodada acontece num lugar diferente: muda o céu, o
   chão, as cercas, o item que ela coleta e o nome que a voz anuncia.

   Os cenários entram embaralhados e só repetem depois que todos os
   sete passaram — assim ela nunca vê o mesmo duas vezes seguidas.
   =================================================================== */
const CENARIOS = [
  { nome:"o jardim",   item:"🍎", oQue:"maçã",     oQuePl:"maçãs",
    ceuAlto:"#7FCFF2", ceuBaixo:"#C8EEFF", sol:"#FFF0B8",
    chaoClaro:"#F6E7C8", chaoEscuro:"#EAD6B0", pedrisco:"rgba(160,120,80,.20)",
    molduraClara:"#E8D5AE", molduraEscura:"#DCC79A",
    paredeTopo:"#63C36F", paredeMeio:"#3E9A54", paredeBase:"#2E7A41", paredeSombra:"rgba(20,90,45,.35)" },

  { nome:"a praia",    item:"🐚", oQue:"conchinha", oQuePl:"conchinhas",
    ceuAlto:"#6FD8E8", ceuBaixo:"#D6F6FF", sol:"#FFE9A8",
    chaoClaro:"#FBEFCF", chaoEscuro:"#F0DCA8", pedrisco:"rgba(200,160,100,.22)",
    molduraClara:"#F2DFB0", molduraEscura:"#E4CB92",
    paredeTopo:"#7FD8E0", paredeMeio:"#48AFC4", paredeBase:"#2E8CA6", paredeSombra:"rgba(20,90,110,.35)" },

  { nome:"a neve",     item:"❄️", oQue:"floquinho", oQuePl:"floquinhos",
    ceuAlto:"#A8D8F0", ceuBaixo:"#E8F6FF", sol:"#FFFFFF",
    chaoClaro:"#FBFDFF", chaoEscuro:"#DCEAF6", pedrisco:"rgba(140,175,205,.25)",
    molduraClara:"#E4F0FA", molduraEscura:"#CFE2F2",
    paredeTopo:"#CFEBFA", paredeMeio:"#95C8E8", paredeBase:"#6BA8D0", paredeSombra:"rgba(60,120,165,.32)" },

  { nome:"a floresta", item:"🌰", oQue:"castanha",  oQuePl:"castanhas",
    ceuAlto:"#8FD0A8", ceuBaixo:"#DAF2DC", sol:"#F4F0B0",
    chaoClaro:"#E0D0A8", chaoEscuro:"#C8B48A", pedrisco:"rgba(110,85,50,.24)",
    molduraClara:"#CBB894", molduraEscura:"#B49E78",
    paredeTopo:"#A8763E", paredeMeio:"#7E5528", paredeBase:"#5E3D1B", paredeSombra:"rgba(60,35,10,.38)" },

  { nome:"o mundo dos doces", item:"🍬", oQue:"balinha", oQuePl:"balinhas",
    ceuAlto:"#F5A8D0", ceuBaixo:"#FFE0F0", sol:"#FFF4C8",
    chaoClaro:"#FFF0DC", chaoEscuro:"#F4DCBC", pedrisco:"rgba(210,140,170,.22)",
    molduraClara:"#F8DCC8", molduraEscura:"#EEC4AC",
    paredeTopo:"#FF9ECB", paredeMeio:"#E86BAA", paredeBase:"#C4488A", paredeSombra:"rgba(150,40,95,.32)" },

  { nome:"o castelo",  item:"💎", oQue:"joia",      oQuePl:"joias",
    ceuAlto:"#9CB8E8", ceuBaixo:"#DCE6FA", sol:"#FFF2CC",
    chaoClaro:"#E8E2F2", chaoEscuro:"#D2C8E4", pedrisco:"rgba(120,105,150,.24)",
    molduraClara:"#DCD2EC", molduraEscura:"#C4B8DC",
    paredeTopo:"#BFB4D4", paredeMeio:"#9186B0", paredeBase:"#6E6390", paredeSombra:"rgba(55,45,85,.34)" },

  { nome:"o pôr do sol", item:"⭐", oQue:"estrelinha", oQuePl:"estrelinhas",
    ceuAlto:"#F5A87E", ceuBaixo:"#FFE2C8", sol:"#FFD08A",
    chaoClaro:"#F2DCC0", chaoEscuro:"#E0C29E", pedrisco:"rgba(160,105,70,.22)",
    molduraClara:"#E8CDAC", molduraEscura:"#D4B48E",
    paredeTopo:"#C48EB4", paredeMeio:"#9A6494", paredeBase:"#744874", paredeSombra:"rgba(70,35,70,.34)" }
];

let baralhoCenarios = [], cenario = CENARIOS[0];

function proximoCenario(){
  if(!baralhoCenarios.length){
    baralhoCenarios = CENARIOS.slice();
    for(let i = baralhoCenarios.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [baralhoCenarios[i], baralhoCenarios[j]] = [baralhoCenarios[j], baralhoCenarios[i]];
    }
    // se o primeiro do baralho novo for igual ao último jogado, manda para o fim
    if(baralhoCenarios[0] === cenario && baralhoCenarios.length > 1){
      baralhoCenarios.push(baralhoCenarios.shift());
    }
  }
  cenario = baralhoCenarios.shift();
  aplicaCenario();
}

function aplicaCenario(){
  const r = document.documentElement.style;
  r.setProperty("--ceu-alto",       cenario.ceuAlto);
  r.setProperty("--ceu-baixo",      cenario.ceuBaixo);
  r.setProperty("--sol",            cenario.sol);
  r.setProperty("--chao-claro",     cenario.chaoClaro);
  r.setProperty("--chao-escuro",    cenario.chaoEscuro);
  r.setProperty("--pedrisco",       cenario.pedrisco);
  r.setProperty("--moldura-clara",  cenario.molduraClara);
  r.setProperty("--moldura-escura", cenario.molduraEscura);
  r.setProperty("--parede-topo",    cenario.paredeTopo);
  r.setProperty("--parede-meio",    cenario.paredeMeio);
  r.setProperty("--parede-base",    cenario.paredeBase);
  r.setProperty("--parede-sombra",  cenario.paredeSombra);
}

/* ===================================================================
   1. GERAÇÃO DO LABIRINTO
   Algoritmo de escavação (recursive backtracker): parte de uma célula,
   derruba paredes andando ao acaso e volta atrás quando encurrala.
   Gera sempre um labirinto com um único caminho entre dois pontos —
   ou seja, ela nunca fica presa e nunca tem becos infinitos.
   =================================================================== */
let grade = [], linhas = 4, colunas = 4;
let pr = 0, pc = 0;              // posição do pônei
let nivel = (typeof nivelSalvo === 'function') ? nivelSalvo() : 1;
let estrelas = 0, lado = 60;
let poneiAtual = null, amigaAtual = null;

function geraLabirinto(nl, nc){
  grade = [];
  for(let r = 0; r < nl; r++){
    grade.push([]);
    for(let c = 0; c < nc; c++){
      grade[r].push({ cima:true, baixo:true, esq:true, dir:true, visitada:false });
    }
  }

  const pilha = [[0, 0]];
  grade[0][0].visitada = true;

  while(pilha.length){
    const [r, c] = pilha[pilha.length - 1];
    const vizinhos = [];
    if(r > 0      && !grade[r-1][c].visitada) vizinhos.push(['cima',  r-1, c]);
    if(r < nl - 1 && !grade[r+1][c].visitada) vizinhos.push(['baixo', r+1, c]);
    if(c > 0      && !grade[r][c-1].visitada) vizinhos.push(['esq',   r, c-1]);
    if(c < nc - 1 && !grade[r][c+1].visitada) vizinhos.push(['dir',   r, c+1]);

    if(!vizinhos.length){ pilha.pop(); continue; }

    const [dir, nr, ncol] = sorteia(vizinhos);
    const oposto = { cima:'baixo', baixo:'cima', esq:'dir', dir:'esq' }[dir];
    grade[r][c][dir] = false;
    grade[nr][ncol][oposto] = false;
    grade[nr][ncol].visitada = true;
    pilha.push([nr, ncol]);
  }
}

/* ===================================================================
   2. DESENHO — o tamanho da célula vem do espaço real da tela,
   mesma lógica do tabuleiro da memória.
   =================================================================== */
function desenha(){
  const palco = $("palco");
  const L = palco.clientWidth, A = palco.clientHeight;
  lado = Math.floor(Math.min(L / colunas, A / linhas));
  lado = Math.max(34, Math.min(lado, 92));

  const cx = $("labirinto");
  cx.style.width  = (colunas * lado) + "px";
  cx.style.height = (linhas  * lado) + "px";
  cx.innerHTML = "";

  const espessura = Math.max(6, Math.round(lado / 8));   // arbusto pede mais corpo que uma borda

  /* 1. o chão: cada casa é um pedaço de caminho */
  for(let r = 0; r < linhas; r++){
    for(let c = 0; c < colunas; c++){
      const d = document.createElement("div");
      d.className = "celula";
      d.dataset.r = r; d.dataset.c = c;
      d.style.left = (c * lado) + "px";
      d.style.top  = (r * lado) + "px";
      d.style.width = lado + "px";
      d.style.height = lado + "px";
      if(r === linhas - 1 && c === colunas - 1) d.classList.add("chegada");
      cx.appendChild(d);
    }
  }

  /* 2. as paredes: arbustos desenhados por cima, um elemento por trecho.

     Antes eram bordas de CSS. Borda é fina, tem canto vivo e não aceita
     textura, então o labirinto parecia planilha. Como elemento próprio,
     cada trecho ganha ponta arredondada, folhagem e volume.

     Cada parede é registrada nas duas casas vizinhas. Para não desenhar
     duas vezes, percorro só a de cima e a da esquerda de cada casa, e
     fecho a moldura com a de baixo da última linha e a da direita da
     última coluna. */
  const meia = espessura / 2;
  const poeParede = (x, y, w, h) => {
    const p = document.createElement("div");
    p.className = "parede";
    p.style.left = x + "px"; p.style.top = y + "px";
    p.style.width = w + "px"; p.style.height = h + "px";
    p.style.borderRadius = meia + "px";
    cx.appendChild(p);
  };

  for(let r = 0; r < linhas; r++){
    for(let c = 0; c < colunas; c++){
      const g = grade[r][c];
      if(g.cima) poeParede(c * lado - meia, r * lado - meia, lado + espessura, espessura);
      if(g.esq)  poeParede(c * lado - meia, r * lado - meia, espessura, lado + espessura);
      if(r === linhas - 1 && g.baixo)
        poeParede(c * lado - meia, (r + 1) * lado - meia, lado + espessura, espessura);
      if(c === colunas - 1 && g.dir)
        poeParede((c + 1) * lado - meia, r * lado - meia, espessura, lado + espessura);
    }
  }

  const amiga = document.createElement("div");
  amiga.id = "amiga";
  amiga.style.width = lado + "px"; amiga.style.height = lado + "px";
  amiga.style.left = ((colunas - 1) * lado) + "px";
  amiga.style.top  = ((linhas  - 1) * lado) + "px";
  amiga.innerHTML = retratoDe(amigaAtual);
  cx.appendChild(amiga);

  const p = document.createElement("div");
  p.id = "poneiz";
  p.style.width = lado + "px"; p.style.height = lado + "px";
  p.innerHTML = retratoDe(poneiAtual);
  // o pônei fica na largada; a amiga, na chegada. Nenhum dos dois anda.
  p.style.left = (caminho[0][1] * lado) + "px";
  p.style.top  = (caminho[0][0] * lado) + "px";
  cx.appendChild(p);

  desenhaItens();
  desenhaRastro();
}

function desenhaItens(){
  const cx = $("labirinto");
  cx.querySelectorAll(".item, .portao").forEach(e => e.remove());
  const tam = Math.round(lado * 0.52);

  const poe = (r, c, emoji, classe) => {
    const d = document.createElement("div");
    d.className = "item " + classe;
    d.style.width = tam + "px"; d.style.height = tam + "px";
    d.style.left = (c * lado + (lado - tam) / 2) + "px";
    d.style.top  = (r * lado + (lado - tam) / 2) + "px";
    d.style.fontSize = Math.round(tam * 0.8) + "px";
    d.textContent = emoji;
    cx.appendChild(d);
  };

  macas.forEach((m, i) => { if(!m.pego) poe(m.r, m.c, cenario.item, "maca-" + i); });
  if(chave && !chave.pego) poe(chave.r, chave.c, "🔑", "chave");

  // portão barrando a chegada enquanto a chave não aparecer
  if(chave && !chave.pego){
    const p = document.createElement("div");
    p.className = "portao";
    p.style.position = "absolute";
    p.style.width = lado + "px"; p.style.height = lado + "px";
    p.style.left = ((colunas - 1) * lado) + "px";
    p.style.top  = ((linhas - 1) * lado) + "px";
    p.style.fontSize = Math.round(lado * 0.45) + "px";
    p.textContent = "🔒";
    cx.appendChild(p);
  }

  $("mMacas").textContent = macas.filter(m => m.pego).length + "/" + macas.length;
}

/* ---------- rastro de pegadas ----------
   caminho guarda a rota atual, da largada até onde ela está.
   O pônei e a amiga não saem do lugar: quem anda é o rastro. */
let caminho = [[0, 0]];
const GIRO = { cima:0, dir:90, baixo:180, esq:270 };

/* itens do labirinto */
let macas = [];          // [{r, c, pego}]
let chave = null;        // {r, c, pego} ou null nos níveis iniciais
let temChave = false;

/* Os itens ficam em becos sem saída — casas com três paredes.
   É o que transforma o desvio em escolha: hoje ela passa reto por eles.
   O beco da largada e o da chegada ficam de fora. */
function becosSemSaida(){
  const lista = [];
  for(let r = 0; r < linhas; r++){
    for(let c = 0; c < colunas; c++){
      if(r === 0 && c === 0) continue;
      if(r === linhas - 1 && c === colunas - 1) continue;
      const g = grade[r][c];
      const paredes = (g.cima?1:0) + (g.baixo?1:0) + (g.esq?1:0) + (g.dir?1:0);
      if(paredes === 3) lista.push([r, c]);
    }
  }
  return lista;
}

/* Casas que ela consegue alcançar SEM entrar na chegada.

   Isto não é preciosismo: a chegada fica trancada até achar a chave, e
   entrar nela encerra a rodada. Então qualquer item que só se alcance
   atravessando a chegada é inalcançável — e se for a chave, o labirinto
   fica impossível. Testando 12 mil mapas, isso acontecia em um terço deles.

   Busca em largura a partir da largada, tratando a chegada como parede. */
function casasAlcancaveis(){
  const D = { cima:[-1,0], baixo:[1,0], esq:[0,-1], dir:[0,1] };
  const fim = (linhas - 1) + "," + (colunas - 1);
  const vistas = new Set(["0,0"]);
  const fila = [[0, 0]];

  while(fila.length){
    const [r, c] = fila.shift();
    for(const d in D){
      if(grade[r][c][d]) continue;
      const nr = r + D[d][0], nc = c + D[d][1];
      const id = nr + "," + nc;
      if(id === fim) continue;                       // a chegada é barreira
      if(nr < 0 || nc < 0 || nr >= linhas || nc >= colunas) continue;
      if(vistas.has(id)) continue;
      vistas.add(id);
      fila.push([nr, nc]);
    }
  }
  vistas.delete("0,0");                              // a largada é do pônei
  return vistas;
}

function espalhaItens(){
  macas = []; chave = null; temChave = false;

  const ok = casasAlcancaveis();
  let becos = becosSemSaida().filter(([r, c]) => ok.has(r + "," + c));

  // mapa pequeno pode não ter becos suficientes: usa qualquer casa alcançável
  if(becos.length < 3){
    const extras = [];
    ok.forEach(id => {
      const [r, c] = id.split(",").map(Number);
      if(!becos.some(b => b[0] === r && b[1] === c)) extras.push([r, c]);
    });
    becos = becos.concat(extras);
  }

  for(let i = becos.length - 1; i > 0; i--){        // embaralha
    const j = Math.floor(Math.random() * (i + 1));
    [becos[i], becos[j]] = [becos[j], becos[i]];
  }

  // a chave só entra a partir do 4º labirinto: antes disso é regra demais
  const usaChave = (nivel >= 4 && becos.length >= 2);
  let k = 0;
  if(usaChave){
    chave = { r: becos[0][0], c: becos[0][1], pego:false };
    k = 1;
  }

  const quantas = Math.min(becos.length - k, nivel <= 2 ? 2 : 3);
  for(let i = 0; i < quantas; i++){
    macas.push({ r: becos[k + i][0], c: becos[k + i][1], pego:false });
  }
  temChave = !usaChave;      // sem chave no mapa, o portão nem existe
}

/* Um cavalo tem quatro cascos e anda alternando os lados, então uma
   marca sozinha no meio da casa parece carimbo, não passada.

   Cada casa recebe DUAS ferraduras: uma um pouco atrás e outra à frente,
   deslocadas para lados opostos. E o lado troca a cada casa, de modo que
   o rastro inteiro zigue-zagueia como pegada na areia.

   'ao longo' é o eixo da direção em que ela andou; 'de lado' é o eixo
   perpendicular. Qual deles é o horizontal depende da direção, por isso
   os dois casos abaixo. */
function desenhaRastro(){
  const cx = $("labirinto");
  cx.querySelectorAll(".pegada").forEach(e => e.remove());

  const tam = Math.round(lado * 0.26);
  const meio = (lado - tam) / 2;
  const AO_LONGO = lado * 0.17;   // distância entre a marca de trás e a da frente
  const DE_LADO  = lado * 0.15;   // afastamento do eixo central

  caminho.forEach((passo, i) => {
    if(i === 0) return;                       // a largada é o próprio pônei
    const [r, c, dir] = passo;
    const vertical = (dir === "cima" || dir === "baixo");
    const sentido  = (dir === "baixo" || dir === "dir") ? 1 : -1;
    const ladoDaVez = (i % 2 === 0) ? 1 : -1;  // alterna a cada casa

    [-1, 1].forEach((ordem, k) => {
      const aoLongo = ordem * AO_LONGO * sentido;
      const deLado  = (k === 0 ? ladoDaVez : -ladoDaVez) * DE_LADO;

      const dx = vertical ? deLado  : aoLongo;
      const dy = vertical ? aoLongo : deLado;

      const p = document.createElement("div");
      p.className = "pegada" + (i === caminho.length - 1 ? " atual" : "");
      p.dataset.passo = i;
      p.style.width  = tam + "px";
      p.style.height = tam + "px";
      p.style.left = (c * lado + meio + dx) + "px";
      p.style.top  = (r * lado + meio + dy) + "px";
      p.style.rotate = (GIRO[dir] || 0) + "deg";
      // a de trás surge um instante antes da da frente: vira uma passada
      p.style.animationDelay = (ordem === -1 ? 0 : 70) + "ms";
      cx.appendChild(p);
    });
  });
}

/* ===================================================================
   3. MOVIMENTO
   =================================================================== */
let travado = false;

function move(dir){
  if(travado) return;
  const g = grade[pr][pc];
  if(g[dir]) {              // tem parede: avisa de leve e não sai do lugar
    tocar(typeof somErrou === "function" ? somErrou : null);
    return;
  }
  if(dir === "cima")  pr--;
  if(dir === "baixo") pr++;
  if(dir === "esq")   pc--;
  if(dir === "dir")   pc++;

  // portão trancado: não deixa entrar na chegada sem a chave
  if(!temChave && pr === linhas - 1 && pc === colunas - 1){
    if(dir === "cima")  pr++;
    if(dir === "baixo") pr--;
    if(dir === "esq")   pc++;
    if(dir === "dir")   pc--;
    tocar(typeof somErrou === "function" ? somErrou : null);
    dizer("Está trancado! Acha a chavinha primeiro.");
    return;
  }

  // voltou para a casa anterior? então desfaz a pegada em vez de empilhar.
  // assim o rastro mostra o caminho atual, não tudo que ela já pisou.
  const anterior = caminho[caminho.length - 2];
  if(anterior && anterior[0] === pr && anterior[1] === pc) caminho.pop();
  else caminho.push([pr, pc, dir]);

  tocar(typeof somToque === "function" ? somToque : null);
  desenhaRastro();
  cancelaDica();
  recolhe();

  if(pr === linhas - 1 && pc === colunas - 1) setTimeout(chegou, 220);
  else agendaDica();
}

/* pegou alguma coisa na casa em que parou? */
function recolhe(){
  const cx = $("labirinto");

  macas.forEach((m, i) => {
    if(m.pego || m.r !== pr || m.c !== pc) return;

    m.pego = true;
    const el = cx.querySelector(".maca-" + i);
    if(el){ el.classList.add("sumindo"); setTimeout(() => el.remove(), 450); }
    tocar(typeof somAchou === "function" ? somAchou : null);

    const faltam = macas.filter(x => !x.pego).length;
    dizer(faltam
      ? "Pegou uma " + cenario.oQue + "! " + (faltam === 1 ? "Falta uma." : "Faltam " + faltam + ".")
      : "Pegou todas as " + cenario.oQuePl + "!");
    $("mMacas").textContent = macas.filter(x => x.pego).length + "/" + macas.length;
  });

  if(chave && !chave.pego && chave.r === pr && chave.c === pc){
    chave.pego = true;
    temChave = true;
    const el = cx.querySelector(".chave");
    if(el){ el.classList.add("sumindo"); setTimeout(() => el.remove(), 450); }
    const portao = cx.querySelector(".portao");
    if(portao){ portao.classList.add("abrindo"); setTimeout(() => portao.remove(), 500); }
    tocar(typeof somVitoria === "function" ? somVitoria : null);
    dizer("Achou a chavinha! O portão abriu.");
  }
}

/* setas */
document.querySelectorAll(".seta").forEach(b => {
  b.addEventListener("click", () => move(b.dataset.dir));
});

/* teclado, para você testar no computador */
addEventListener("keydown", e => {
  const m = { ArrowUp:"cima", ArrowDown:"baixo", ArrowLeft:"esq", ArrowRight:"dir" }[e.key];
  if(m){ e.preventDefault(); move(m); }
});

/* arrastar o dedo: cada trecho de meia célula vira um passo */
let ox = null, oy = null;
const palco = $("palco");

palco.addEventListener("touchstart", e => {
  const t = e.touches[0]; ox = t.clientX; oy = t.clientY;
}, { passive:true });

palco.addEventListener("touchmove", e => {
  if(ox === null) return;
  const t = e.touches[0];
  const dx = t.clientX - ox, dy = t.clientY - oy;
  const limite = Math.max(18, lado * 0.5);

  if(Math.abs(dx) < limite && Math.abs(dy) < limite) return;

  if(Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "dir" : "esq");
  else                            move(dy > 0 ? "baixo" : "cima");

  ox = t.clientX; oy = t.clientY;   // reinicia para permitir arrasto contínuo
}, { passive:true });

palco.addEventListener("touchend", () => { ox = oy = null; }, { passive:true });

/* ===================================================================
   4. RODADAS
   =================================================================== */
function tamanhoDoNivel(n){
  if(n <= 2) return 4;
  if(n <= 4) return 5;
  if(n <= 7) return 6;
  return 7;              // para de crescer: 4 anos não precisa de mais
}

function novaRodada(){
  travado = false;
  const t = tamanhoDoNivel(nivel);
  linhas = colunas = t;
  pr = pc = 0;
  caminho = [[0, 0]];

  if(TEM_ELENCO){
    poneiAtual = sorteia(PERSONAGENS);
    do { amigaAtual = sorteia(PERSONAGENS); } while(amigaAtual === poneiAtual);
  }

  proximoCenario();
  geraLabirinto(linhas, colunas);
  espalhaItens();
  $("rotuloItem").textContent = cenario.oQuePl;
  desenha();
  $("mNivel").textContent = nivel;
  if(typeof salvaNivel === "function") salvaNivel(nivel);
  $("festa").classList.remove("visivel");

  tocar(typeof somComeco === "function" ? somComeco : null);
  const quem = (amigaAtual && amigaAtual.nome) ? amigaAtual.nome : "a amiga";
  setTimeout(() => dizer("Agora vamos para " + cenario.nome + "! " + (chave
      ? "Acha a chavinha para abrir o portão, e leva o pônei até " + quem + "."
      : "Leva o pônei até " + quem + ", e pega as " + cenario.oQuePl + " pelo caminho.")), 400);
  agendaDica();
}

/* o pônei só anda no fim: percorre o rastro que ela desenhou até a amiga.
   É a recompensa de ter achado o caminho — ela vê a rota dela funcionando. */
function poneiCaminha(aoFim){
  const p = $("poneiz");
  p.classList.add("andando");
  let i = 0;
  const passo = () => {
    i++;
    if(i >= caminho.length){
      p.classList.remove("andando");
      if(typeof aoFim === "function") aoFim();
      return;
    }
    const [r, c] = caminho[i];
    p.style.left = (c * lado) + "px";
    p.style.top  = (r * lado) + "px";
    tocar(typeof somToque === "function" ? somToque : null);
    // apaga as duas ferraduras da casa que ele acabou de pisar
    $("labirinto").querySelectorAll('.pegada[data-passo="' + i + '"]').forEach(e => e.remove());
    setTimeout(passo, 300);
  };
  setTimeout(passo, 260);
}

function chegou(){
  travado = true;
  cancelaDica();
  estrelas++;
  $("mEstrelas").textContent = estrelas;

  const quem = (amigaAtual && amigaAtual.nome) ? amigaAtual.nome : "a amiga";
  $("festaTitulo").textContent = "Achou " + quem + "!";
  dizer(comNome("Muito bem! Você achou o caminho"));

  poneiCaminha(() => {
    tocar(typeof somVitoria === "function" ? somVitoria : null);
    const todas = macas.length && macas.every(m => m.pego);
    dizer(todas
      ? "O pônei chegou até " + quem + ", e você pegou todas as " + cenario.oQuePl + "!"
      : "O pônei chegou até " + quem + "!");
    chuvaDeEstrelas();
    const m = concluiuDesafio();
    setTimeout(() => premiar(() => {
      $("festa").classList.add("visivel");
      if(m.completouAgora) festejaMissao();
    }), 1100);
  });
}

$("btnProximo").addEventListener("click", () => { nivel++; novaRodada(); });
$("btnCasa").addEventListener("click", () => { location.href = "index.html"; });

function chuvaDeEstrelas(){
  const s = ["⭐","✨","🌈","💖","🦄"];
  for(let i = 0; i < 20; i++){
    const e = document.createElement("div");
    e.className = "estrela-cai";
    e.textContent = sorteia(s);
    e.style.left = (Math.random() * 96) + "vw";
    e.style.animationDuration = (2.2 + Math.random() * 2) + "s";
    e.style.animationDelay = (Math.random() * 1.2) + "s";
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 6000);
  }
}

/* se ela travar, a voz chama de volta */
let relogio = null;
function cancelaDica(){ clearTimeout(relogio); }
function agendaDica(){
  cancelaDica();
  relogio = setTimeout(() => {
    if(travado) return;
    dizer("Arraste o dedo pelo caminho, ou use as setinhas.");
    agendaDica();
  }, 18000);
}

addEventListener("resize", () => desenha());
addEventListener("orientationchange", () => setTimeout(desenha, 250));

if(!TEM_ELENCO){
  $("recado").textContent = "O arquivo personagens.js não carregou, então o pônei aparece como emoji. O jogo funciona igual.";
  $("recado").classList.remove("escondida");
}

novaRodada();
</script>
</body>
</html>
