/* ============================================================
   MAPA DE PONYVILLE — as fases e as voltas

   A tela inicial é o mapa. Cada parada é uma fase, e cada fase é um
   jogo diferente do anterior, numa rotação declarada em JOGOS_ORDEM.

   AS VOLTAS. Terminadas as 20 paradas, o mapa não acaba: entra uma
   tela de campeã e o percurso recomeça em outra cor, com a rotação
   dos jogos deslocada — assim Ponyville não cai sempre na memória.
   O que reinicia é o caminho, não a coleção: as pôneis ganhas ficam.
   Sem isso ela travava na parada 20, jogando sem sair do lugar.

   A CONTAGEM. Antes a fase vinha do tamanho da coleção: uma pônei,
   uma fase. Isso morria com o álbum cheio, nas 32. Agora o album.js
   conta as vitórias num número próprio, que só cresce, e o mapa
   deriva volta e parada dele.

   PARA INCLUIR UM JOGO NOVO: acrescente-o em JOGOS e o nome dele em
   JOGOS_ORDEM. As paradas se redistribuem sozinhas.

   PARA TROCAR A ARTE: ponha a imagem em arte/mapa.png e ajuste x e y
   em PARADAS, que são porcentagens da imagem.

   Depende de: album.js (vitorias, colecao, imgDoAlbum) e perfil.js
   (imgDaAmiga). Carregue depois dos dois. Só no index.html.
   ============================================================ */

const MAPA_ARTE    = 'arte/mapa.png';
const MAPA_LARGURA = 900;    // px do desenho; a tela rola por cima dele
const MAPA_ALTURA  = 553;
const MAPA_LEMBRA  = 'poneis.mapa.visto';

const JOGOS = {
  memoria:   { pagina:'memoria.html',           nome:'Memória' },
  cade:      { pagina:'poneis.html?modo=cade',  nome:'Cadê o Pônei?' },
  labirinto: { pagina:'labirinto.html',         nome:'Leva o Pônei' },
  sumiu:     { pagina:'poneis.html?modo=sumiu', nome:'Quem Sumiu?' },
  nome:      { pagina:'nome.html',              nome:'Balões do Nome' }
};

const JOGOS_ORDEM = ['memoria', 'cade', 'labirinto', 'sumiu', 'nome'];

/* x e y em % da imagem do mapa — é aqui que se ajusta a rota */
const PARADAS = [
  { lugar:'Ponyville',           x:34, y:53 },
  { lugar:'Casa da Twilight',    x:33, y:45 },
  { lugar:'Floresta Everfree',   x:36, y:60 },
  { lugar:'Pomar das Maçãs',     x:20, y:71 },
  { lugar:'Cloudsdale',          x:36, y:29 },
  { lugar:'Canterlot',           x:40, y:43 },
  { lugar:'Cataratas',           x:44, y:34 },
  { lugar:'Vale Assombrado',     x:28, y:64 },
  { lugar:'Dodge City',          x:47, y:68 },
  { lugar:'Fazenda de Pedras',   x:27, y:75 },
  { lugar:'Los Pegasus',         x:15, y:66 },
  { lugar:'Vanhoover',           x:10, y:33 },
  { lugar:'Império de Cristal',  x:41, y:16 },
  { lugar:'Norte Gelado',        x:31, y:19 },
  { lugar:'Manehattan',          x:66, y:34 },
  { lugar:'Filly Delphia',       x:64, y:47 },
  { lugar:'Baltimare',           x:62, y:57 },
  { lugar:'Vila da Starlight',   x:60, y:27 },
  { lugar:'Yakyakistan',         x:15, y:12 },
  { lugar:'Castelo da Celestia', x:38, y:39 }
];

const POR_VOLTA = PARADAS.length;

/* Cada volta tem sua cor. Ela não lê "2ª volta", mas percebe na hora
   que o mapa mudou de cor — é assim que a repetição vira novidade. */
const CORES_VOLTA = [
  { nome:'1ª volta', anel:'#6B3FBF', feito:'#FFC93C', tinta:'transparent' },
  { nome:'2ª volta', anel:'#1E7A8C', feito:'#7FE0C4', tinta:'rgba(40,180,200,.20)' },
  { nome:'3ª volta', anel:'#B0431E', feito:'#FFB04A', tinta:'rgba(255,140,60,.20)' },
  { nome:'4ª volta', anel:'#2E7A41', feito:'#B7E86A', tinta:'rgba(90,200,90,.20)' },
  { nome:'5ª volta', anel:'#7A2E6B', feito:'#F09AD8', tinta:'rgba(200,80,180,.20)' }
];

/* ---------- onde ela está ---------- */
function totalVitorias(){
  if(typeof vitorias === 'function') return vitorias();
  return (typeof quantasTem === 'function') ? quantasTem() : 0;
}

const voltaDe  = v => Math.floor(v / POR_VOLTA);
const paradaDe = v => v % POR_VOLTA;

function coresDaVolta(v){
  return CORES_VOLTA[voltaDe(v) % CORES_VOLTA.length];
}

/* o jogo de cada parada, deslocado a cada volta: a mesma Ponyville
   não cai sempre na memória */
function jogoDaParada(i, v){
  return JOGOS_ORDEM[(i + voltaDe(v)) % JOGOS_ORDEM.length];
}

/* Até onde o mapa já foi mostrado. Guardado em número absoluto de
   vitórias, para saber quantos passos faltam animar. */
function jaVisto(){
  try{
    const n = parseInt(localStorage.getItem(MAPA_LEMBRA), 10);
    if(n >= 0) return Math.min(n, totalVitorias());
  }catch(e){}
  return totalVitorias();   // primeira abertura: não anima o passado
}

function guardaVisto(n){
  try{ localStorage.setItem(MAPA_LEMBRA, String(n)); }catch(e){}
}

function injetaEstiloMapa(){
  if(document.getElementById('estiloMapa')) return;
  const s = document.createElement('style');
  s.id = 'estiloMapa';
  s.textContent = `
    #mapa{
      width:100%; max-width:520px; margin:0 auto 10px;
      border-radius:20px; overflow:auto;
      -webkit-overflow-scrolling:touch;
      background:#BFE4F5;
      box-shadow:0 4px 14px rgba(107,63,191,.22), inset 0 0 0 3px #fff;
      max-height:62vh;
    }
    #mapa .lona{
      position:relative;
      width:${MAPA_LARGURA}px; height:${MAPA_ALTURA}px;
      background-image:url('${MAPA_ARTE}');
      background-size:cover; background-position:center;
      background-color:#A8D8B4;   /* reserva, se a arte faltar */
    }
    /* a tinta da volta: a mesma arte, em outro clima */
    #mapa .lona::after{
      content:""; position:absolute; inset:0; pointer-events:none;
      background:var(--volta-tinta, transparent);
      transition:background .8s ease;
    }

    #mapa .parada{
      position:absolute; transform:translate(-50%,-50%);
      border:none; background:none; padding:0; margin:0;
      font-family:inherit; cursor:default; z-index:2;
      display:flex; flex-direction:column; align-items:center; gap:2px;
    }
    #mapa .bolha{
      width:46px; height:46px; border-radius:50%;
      overflow:hidden; background:#fff; border:3px solid #fff;
      box-shadow:0 0 0 2px var(--volta-anel,#6B3FBF), 0 3px 8px rgba(40,25,70,.45);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; color:#B9A8D4;
    }
    #mapa .bolha img{ width:100%; height:100%; object-fit:cover; object-position:center 30%; }
    #mapa .nomeLugar{
      font-size:11px; font-weight:800; color:#fff;
      text-shadow:0 1px 3px rgba(30,20,60,.95), 0 0 6px rgba(30,20,60,.85);
      white-space:nowrap;
    }

    #mapa .parada.feita .bolha{
      box-shadow:0 0 0 2px var(--volta-feito,#FFC93C), 0 3px 8px rgba(40,25,70,.45);
    }
    #mapa .parada.venceuAgora .bolha{ animation:seloAcende .9s ease-out both; }
    @keyframes seloAcende{
      0%  { transform:scale(1); }
      45% { transform:scale(1.3); box-shadow:0 0 0 8px var(--volta-feito,#FFC93C), 0 0 26px rgba(255,201,60,1); }
      100%{ transform:scale(1); }
    }

    #mapa .parada.aqui{ cursor:pointer; z-index:4; }
    #mapa .parada.aqui .bolha{
      width:64px; height:64px;
      box-shadow:0 0 0 3px #FF6FB0, 0 0 20px rgba(255,111,176,.85);
      animation:aquiPulsa 1.8s ease-in-out infinite;
    }
    @keyframes aquiPulsa{
      0%,100%{ transform:scale(1); } 50%{ transform:scale(1.08); }
    }
    #mapa .parada.aqui .nomeLugar{ font-size:13px; }
    #mapa .parada.aqui .jogar{
      margin-top:2px; padding:5px 14px; border-radius:14px;
      background:linear-gradient(180deg,#FF8FC0,#EC5FA6); color:#fff;
      font-size:13px; font-weight:800; box-shadow:0 3px 0 #C93F82;
      white-space:nowrap;
    }

    /* 'left' e 'top' animados de propósito: são duas mudanças em um
       segundo e meio, não sessenta por segundo, então o custo de
       layout não existe na prática — e é o que permite seguir a curva
       do mapa sem calcular pixels. */
    #mapa .parada.andando{
      transition:left 1.4s ease-in-out, top 1.4s ease-in-out;
      z-index:6;
    }
    #mapa .parada.andando .jogar,
    #mapa .parada.andando .nomeLugar{ opacity:0; transition:opacity .3s; }
    #mapa .parada.andando .bolha{ animation:pulaAndando .45s ease-in-out 3; }
    @keyframes pulaAndando{
      0%,100%{ transform:translateY(0)     scale(1); }
      50%    { transform:translateY(-11px) scale(1.06); }
    }

    #mapa .parada.presa{ opacity:.75; }
    #mapa .parada.presa .bolha{ background:#E7DEF3; box-shadow:0 0 0 2px #9A83C4; }

    #faixaFase{
      text-align:center; font-size:13px; font-weight:800;
      color:#8A6FBF; margin:0 0 8px; min-height:18px;
    }
    #faixaFase .selo{
      display:inline-block; margin-right:6px; padding:2px 9px;
      border-radius:10px; color:#fff; font-size:12px;
      background:var(--volta-anel,#6B3FBF);
    }

    /* ---- a tela de volta completa ---- */
    #voltaFeita{
      position:fixed; inset:0; z-index:400; display:flex;
      align-items:center; justify-content:center; flex-direction:column;
      gap:14px; padding:24px; text-align:center;
      font-family:'Baloo 2','Segoe UI Rounded',system-ui,sans-serif;
      background:radial-gradient(circle at 50% 38%, #FFF6D8 0%, #FFE3F0 55%, #E9DBFF 100%);
    }
    #voltaFeita h2{ font-size:clamp(26px,8vw,40px); color:#6B3FBF; text-shadow:0 3px 0 #fff; }
    #voltaFeita p{ font-size:16px; color:#8A6FBF; max-width:320px; }
    #voltaFeita .desfile{
      display:flex; flex-wrap:wrap; justify-content:center; gap:6px;
      max-width:330px;
    }
    #voltaFeita .desfile span{
      width:44px; height:44px; border-radius:50%; overflow:hidden;
      border:3px solid #fff; box-shadow:0 0 0 2px #FFC93C, 0 3px 7px rgba(107,63,191,.3);
      animation:desfilaEntra .5s cubic-bezier(.2,1.5,.4,1) both;
    }
    #voltaFeita .desfile img{ width:100%; height:100%; object-fit:cover; object-position:center 30%; }
    @keyframes desfilaEntra{
      from{ transform:scale(.2) rotate(-20deg); opacity:0; }
      to  { transform:scale(1) rotate(0); opacity:1; }
    }
    #voltaFeita .botao{
      border:none; border-radius:24px; cursor:pointer; font-family:inherit;
      font-weight:800; font-size:21px; color:#fff; padding:16px 32px;
      background:linear-gradient(180deg,#FF6FB0,#E3488F); box-shadow:0 5px 0 #C43A79;
    }
    #voltaFeita .botao:active{ transform:translateY(4px); box-shadow:0 1px 0 #C43A79; }

    #btnLivre{
      display:block; margin:12px auto 0; border:none; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:800;
      color:#8A6FBF; background:rgba(255,255,255,.75);
      border-radius:18px; padding:10px 20px; box-shadow:0 3px 0 #D9C6F2;
    }
    #btnLivre:active{ transform:translateY(2px); box-shadow:0 1px 0 #D9C6F2; }
    .jogos.recolhida{ display:none; }
  `;
  document.head.appendChild(s);
}

/* visto = número absoluto de vitórias que o mapa está representando.
   Durante a passagem de fase é o valor antigo, para a caminhada
   acontecer na frente dela. */
function montaMapa(visto, recemVencida){
  const alvo = document.getElementById('mapa');
  if(!alvo) return;
  injetaEstiloMapa();

  const parada = paradaDe(visto);
  const cores  = coresDaVolta(visto);
  const ganhas = (typeof colecao === 'function') ? colecao() : [];

  alvo.style.setProperty('--volta-anel',  cores.anel);
  alvo.style.setProperty('--volta-feito', cores.feito);
  alvo.style.setProperty('--volta-tinta', cores.tinta);

  let html = '<div class="lona">';

  PARADAS.forEach((p, i) => {
    let classe, miolo;

    if(i < parada){
      classe = 'feita' + (i === recemVencida ? ' venceuAgora' : '');
      /* a pônei ganha nesta parada. Na primeira volta o índice bate
         com a coleção; nas seguintes o álbum pode ter acabado, e aí
         entra a estrela — a parada continua marcada como vencida. */
      const q = ganhas[visto - parada + i];
      miolo = (q && typeof imgDoAlbum === 'function')
        ? '<img src="' + imgDoAlbum(q) + '" alt="">' : '★';
    }
    else if(i === parada){
      classe = 'aqui';
      const foto = (typeof imgDaAmiga === 'function') ? imgDaAmiga() : null;
      miolo = foto ? '<img src="' + foto + '" alt="">' : '★';
    }
    else{
      classe = 'presa';
      miolo = '🔒';
    }

    html +=
      '<button class="parada ' + classe + '" style="left:' + p.x + '%; top:' + p.y + '%">' +
        '<span class="bolha">' + miolo + '</span>' +
        '<span class="nomeLugar">' + p.lugar + '</span>' +
        (classe === 'aqui'
          ? '<span class="jogar">' + JOGOS[jogoDaParada(i, visto)].nome + '</span>' : '') +
      '</button>';
  });

  html += '</div>';
  alvo.innerHTML = html;

  escreveFaixa(visto);

  const aqui = alvo.querySelector('.parada.aqui');
  if(aqui){
    aqui.addEventListener('click', () => {
      if(aqui.classList.contains('andando')) return;
      if(typeof somToque === 'function') try{ somToque(); }catch(e){}
      setTimeout(() => {
        location.href = JOGOS[jogoDaParada(parada, visto)].pagina;
      }, 220);
    });
    centraliza(aqui, false);
  }
}

function escreveFaixa(visto){
  const faixa = document.getElementById('faixaFase');
  if(!faixa) return;
  const cores = coresDaVolta(visto);
  const p = paradaDe(visto);
  faixa.innerHTML =
    (voltaDe(visto) > 0 ? '<span class="selo">' + cores.nome + '</span>' : '') +
    'Fase ' + (p + 1) + ' de ' + POR_VOLTA + ' — ' + PARADAS[p].lugar;
}

/* mexe no scroll do próprio container, e não scrollIntoView, que
   arrastaria a página inteira junto */
function centraliza(el, suave){
  const alvo = document.getElementById('mapa');
  if(!alvo || !el) return;
  const x = Math.max(0, el.offsetLeft - alvo.clientWidth  / 2);
  const y = Math.max(0, el.offsetTop  - alvo.clientHeight / 2);
  setTimeout(() => {
    if(suave && alvo.scrollTo){
      try{ alvo.scrollTo({ left:x, top:y, behavior:'smooth' }); return; }catch(e){}
    }
    alvo.scrollLeft = x; alvo.scrollTop = y;
  }, 80);
}

/* A CAMINHADA. Move a pônei da parada atual para a seguinte e
   redesenha o mapa já lá. Se a próxima vitória fecha a volta, quem
   entra é a tela de campeã, não mais um passo. */
function caminhaAte(visto){
  const proximo = visto + 1;

  if(paradaDe(proximo) === 0){        // a volta fechou
    guardaVisto(proximo);
    festejaVolta(visto, () => {
      montaMapa(proximo);
      if(totalVitorias() > proximo) setTimeout(() => caminhaAte(proximo), 900);
    });
    return;
  }

  const alvo = document.getElementById('mapa');
  const el = alvo && alvo.querySelector('.parada.aqui');
  const destino = PARADAS[paradaDe(proximo)];
  if(!el || !destino){ guardaVisto(totalVitorias()); return; }

  el.classList.add('andando');
  el.style.left = destino.x + '%';
  el.style.top  = destino.y + '%';
  centraliza(el, true);
  if(typeof somToque === 'function') try{ somToque(); }catch(e){}

  const faixa = document.getElementById('faixaFase');
  if(faixa) faixa.textContent = 'Indo para ' + destino.lugar + '…';

  setTimeout(() => {
    guardaVisto(proximo);
    montaMapa(proximo, paradaDe(visto));   // acende a estrela na vencida
    if(typeof somVitoria === 'function') try{ somVitoria(); }catch(e){}
    if(totalVitorias() > proximo) setTimeout(() => caminhaAte(proximo), 900);
  }, 1500);
}

/* A TELA DE VOLTA COMPLETA. Sem ela, terminar as 20 paradas não era
   nada: a criança vencia a última e continuava lá, jogando sem sair
   do lugar. Aqui a volta fecha, as pôneis conquistadas desfilam, e o
   caminho recomeça em outra cor. */
function festejaVolta(visto, aoFechar){
  const numero  = voltaDe(visto) + 1;
  const proxima = coresDaVolta(visto + 1);
  const ganhas  = (typeof colecao === 'function') ? colecao() : [];
  const desfile = ganhas.slice(-POR_VOLTA);

  const cx = document.createElement('div');
  cx.id = 'voltaFeita';
  cx.innerHTML =
    '<h2>Você deu a volta<br>em Ponyville!</h2>' +
    '<div class="desfile">' +
      desfile.map((n, i) =>
        '<span style="animation-delay:' + (i * .06).toFixed(2) + 's">' +
          (typeof imgDoAlbum === 'function' ? '<img src="' + imgDoAlbum(n) + '" alt="">' : '') +
        '</span>').join('') +
    '</div>' +
    '<p>' + (numero === 1 ? 'Todas as ' + POR_VOLTA + ' paradas.' : numero + ' voltas completas.') +
      ' Agora o caminho recomeça com jogos trocados — e o mapa muda de cor.</p>' +
    '<button class="botao" id="voltaOk">Começar a ' + (numero + 1) + 'ª volta</button>';
  document.body.appendChild(cx);

  if(typeof somVitoria === 'function') try{ somVitoria(); }catch(e){}

  document.getElementById('voltaOk').addEventListener('click', () => {
    cx.remove();
    const alvo = document.getElementById('mapa');
    if(alvo){
      alvo.style.setProperty('--volta-anel',  proxima.anel);
      alvo.style.setProperty('--volta-tinta', proxima.tinta);
    }
    if(typeof aoFechar === 'function') aoFechar();
  });
}

/* A grade antiga não morre: vira "brincar à vontade", escondida atrás
   de um botão. O mapa é o caminho; a grade é para quando ela quiser
   repetir um jogo de que gostou. */
function ligaModoLivre(){
  const grade = document.querySelector('.jogos');
  if(!grade) return;
  grade.classList.add('recolhida');

  const b = document.createElement('button');
  b.id = 'btnLivre';
  b.textContent = 'Brincar à vontade';
  b.addEventListener('click', () => {
    if(typeof somToque === 'function') try{ somToque(); }catch(e){}
    const fechada = grade.classList.toggle('recolhida');
    b.textContent = fechada ? 'Brincar à vontade' : 'Voltar ao mapa';
  });
  grade.parentNode.insertBefore(b, grade);
}

function iniciaAventura(){
  if(typeof colecao !== 'function'){
    const r = document.getElementById('recado');
    if(r){
      r.textContent = 'O aventura.js precisa ser carregado depois do album.js.';
      r.classList.remove('escondida');
    }
    return;
  }

  const visto = jaVisto();
  montaMapa(visto);
  ligaModoLivre();

  if(totalVitorias() > visto) setTimeout(() => caminhaAte(visto), 800);
  else guardaVisto(visto);
}

if(document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciaAventura);
else iniciaAventura();
