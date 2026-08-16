/* ============================================================
   MAPA DE PONYVILLE — as fases

   A tela inicial é o mapa. Cada parada é uma fase, e cada fase é um
   jogo diferente do anterior, numa rotação declarada em JOGOS_ORDEM.

   PARA INCLUIR UM JOGO NOVO no futuro: acrescente-o em JOGOS e o nome
   dele em JOGOS_ORDEM. As 20 paradas se redistribuem sozinhas, sem
   mexer em mais nada.

   PARA TROCAR A ARTE DO MAPA: ponha a imagem em arte/mapa.png. As
   paradas ficam por cima, nas coordenadas de PARADAS (x e y em % da
   imagem) — ajuste ali para casar com os lugares do seu desenho. Sem
   a imagem, o fundo cai numa cor lisa e nada quebra.

   O TRUQUE que dispensa mexer nos jogos: cada vitória, em qualquer
   jogo, entrega exatamente uma pônei do álbum. Então o tamanho da
   coleção JÁ É o número de fases vencidas. Nenhum gancho, nenhuma
   alteração em memoria.html, labirinto.html, nome.html ou jogo.js —
   este arquivo só lê o que o album.js já guarda.

   Depende de: album.js (colecao, imgDoAlbum) e perfil.js (imgDaAmiga).
   Carregue depois dos dois. Só no index.html.
   ============================================================ */

const MAPA_ARTE    = 'arte/mapa.png';
const MAPA_LARGURA = 900;    // px do desenho; a tela rola por cima dele
const MAPA_ALTURA  = 553;

const JOGOS = {
  memoria:   { pagina:'memoria.html',           nome:'Memória' },
  cade:      { pagina:'poneis.html?modo=cade',  nome:'Cadê o Pônei?' },
  labirinto: { pagina:'labirinto.html',         nome:'Leva o Pônei' },
  sumiu:     { pagina:'poneis.html?modo=sumiu', nome:'Quem Sumiu?' },
  nome:      { pagina:'nome.html',              nome:'Balões do Nome' }
};

/* a rotação: fase 1 memória, fase 2 cadê o pônei, e assim por diante */
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

/* junta lugar + jogo: a rotação decide qual brincadeira é cada parada */
const FASES = PARADAS.map((p, i) => ({
  lugar: p.lugar, x: p.x, y: p.y,
  jogo: JOGOS_ORDEM[i % JOGOS_ORDEM.length]
}));

/* Quantas fases ela já venceu. É o tamanho da coleção: uma vitória,
   uma pônei, uma fase. Se um dia um jogo deixar de premiar, esta conta
   para de andar — e é o comportamento certo, porque a fase também não
   terminou. */
function faseAtual(){
  const tem = (typeof quantasTem === 'function') ? quantasTem() : 0;
  return Math.min(tem, FASES.length - 1);
}

function terminouTudo(){
  return (typeof quantasTem === 'function') && quantasTem() >= FASES.length;
}

function injetaEstiloMapa(){
  if(document.getElementById('estiloMapa')) return;
  const s = document.createElement('style');
  s.id = 'estiloMapa';
  s.textContent = `
    /* a moldura ocupa a largura da tela e rola por cima do desenho:
       um mapa espremido em 380px viraria vinte pontinhos ilegíveis */
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
      /* cor de reserva: se arte/mapa.png faltar, isto aparece no lugar
         e as paradas continuam no ar */
      background-color:#A8D8B4;
    }

    #mapa .parada{
      position:absolute; transform:translate(-50%,-50%);
      border:none; background:none; padding:0; margin:0;
      font-family:inherit; cursor:default;
      display:flex; flex-direction:column; align-items:center; gap:2px;
    }
    #mapa .bolha{
      width:46px; height:46px; border-radius:50%;
      overflow:hidden; background:#fff; border:3px solid #fff;
      box-shadow:0 0 0 2px #6B3FBF, 0 3px 8px rgba(40,25,70,.45);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; color:#B9A8D4;
    }
    #mapa .bolha img{ width:100%; height:100%; object-fit:cover; object-position:center 30%; }
    /* o nome fica legível sobre qualquer parte do desenho */
    #mapa .nomeLugar{
      font-size:11px; font-weight:800; color:#fff;
      text-shadow:0 1px 3px rgba(30,20,60,.95), 0 0 6px rgba(30,20,60,.85);
      white-space:nowrap;
    }

    #mapa .parada.feita .bolha{ box-shadow:0 0 0 2px #FFC93C, 0 3px 8px rgba(40,25,70,.45); }

    #mapa .parada.aqui{ cursor:pointer; z-index:3; }
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

    #mapa .parada.presa{ opacity:.75; }
    #mapa .parada.presa .bolha{ background:#E7DEF3; box-shadow:0 0 0 2px #9A83C4; }

    #faixaFase{
      text-align:center; font-size:13px; font-weight:800;
      color:#8A6FBF; margin:0 0 8px;
    }

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

function montaMapa(){
  const alvo = document.getElementById('mapa');
  if(!alvo) return;
  injetaEstiloMapa();

  const atual  = faseAtual();
  const ganhas = (typeof colecao === 'function') ? colecao() : [];

  let html = '<div class="lona">';

  FASES.forEach((f, i) => {
    let classe, miolo;

    if(i < atual){
      /* a pônei ganha nesta fase: a coleção guarda na ordem da
         conquista, então o índice bate com a fase */
      classe = 'feita';
      const p = ganhas[i];
      miolo = (p && typeof imgDoAlbum === 'function')
        ? '<img src="' + imgDoAlbum(p) + '" alt="">' : '★';
    }
    else if(i === atual){
      classe = 'aqui';
      const foto = (typeof imgDaAmiga === 'function') ? imgDaAmiga() : null;
      miolo = foto ? '<img src="' + foto + '" alt="">' : '★';
    }
    else{
      classe = 'presa';
      miolo = '🔒';
    }

    html +=
      '<button class="parada ' + classe + '" style="left:' + f.x + '%; top:' + f.y + '%">' +
        '<span class="bolha">' + miolo + '</span>' +
        '<span class="nomeLugar">' + f.lugar + '</span>' +
        (classe === 'aqui' ? '<span class="jogar">' + JOGOS[f.jogo].nome + '</span>' : '') +
      '</button>';
  });

  html += '</div>';
  alvo.innerHTML = html;

  const faixa = document.getElementById('faixaFase');
  if(faixa){
    faixa.textContent = terminouTudo()
      ? 'Você venceu as ' + FASES.length + ' fases!'
      : 'Fase ' + (atual + 1) + ' de ' + FASES.length + ' — ' + FASES[atual].lugar;
  }

  /* só a parada atual leva a algum lugar: as trancadas não respondem,
     e as vencidas ficam como lembrança do caminho já feito */
  const aqui = alvo.querySelector('.parada.aqui');
  if(aqui){
    aqui.addEventListener('click', () => {
      if(typeof somToque === 'function') try{ somToque(); }catch(e){}
      setTimeout(() => { location.href = JOGOS[FASES[atual].jogo].pagina; }, 220);
    });

    /* centraliza o mapa onde ela está: com 20 paradas ela não pode ter
       que procurar. Feito com scrollLeft/Top do próprio container, e
       não com scrollIntoView, que arrastaria a página inteira junto. */
    setTimeout(() => {
      alvo.scrollLeft = Math.max(0, aqui.offsetLeft - alvo.clientWidth  / 2);
      alvo.scrollTop  = Math.max(0, aqui.offsetTop  - alvo.clientHeight / 2);
    }, 120);
  }
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
  montaMapa();
  ligaModoLivre();
}

if(document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciaAventura);
else iniciaAventura();
