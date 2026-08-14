/* ============================================================
   A CAMINHADA  —  o quiz deixa de ser um laço sem fim

   Trajeto de 5 passos até um castelo. A amiga escolhida no menu anda
   um passo por acerto. Ver a distância encurtando é o que segura a
   atenção; o prêmio no fim só fecha o que ela já acompanhava.

   Depende de: perfil.js (imgDaAmiga). Sem ele, usa uma estrela.
   ============================================================ */

const CAMINHO_PASSOS = 5;
const CAMINHO_ALTURA = 88;   // px reservados na coluna do #jogo

const CAMINHOS_CENARIO = [
  { id:'campo',  ceu1:'#BFEAFF', ceu2:'#E8F8EC', morro:'#8FD89A', morro2:'#5FBF7A',
    trilha:'#F0DDB0', borda:'#D2B481', torre:'#F2E4F8', teto:'#B98FD8', enfeite:'🌼' },
  { id:'poente', ceu1:'#FFD9A8', ceu2:'#FFC2C7', morro:'#C89A7E', morro2:'#9A6A56',
    trilha:'#F5D3A0', borda:'#CFA26C', torre:'#FFF0E0', teto:'#E08A6E', enfeite:'🌻' },
  { id:'noite',  ceu1:'#4E5DAE', ceu2:'#8E86D8', morro:'#3E5A78', morro2:'#2C4058',
    trilha:'#C4BEE8', borda:'#8E86BE', torre:'#E4E0F8', teto:'#7F6FC4', enfeite:'⭐' },
  { id:'jardim', ceu1:'#D9F0FF', ceu2:'#FFE9F5', morro:'#9ADCA8', morro2:'#6FBF8E',
    trilha:'#F2D4E4', borda:'#D0A4BE', torre:'#FFF2F8', teto:'#F08FC0', enfeite:'🌸' },
  { id:'gelo',   ceu1:'#DCF2FF', ceu2:'#F6FBFF', morro:'#BFE4F5', morro2:'#8FC4E0',
    trilha:'#E4F0F8', borda:'#AECEE2', torre:'#FFFFFF', teto:'#7FC2EA', enfeite:'❄️' }
];

/* O castelo é desenhado, não emoji. Emoji muda de forma em cada
   aparelho, não aceita a cor do cenário e no Android sai minúsculo —
   e este é o ponto da tela que precisa parecer um lugar. */
function svgCastelo(){
  return '<svg viewBox="0 0 64 60" aria-hidden="true">' +
    '<path d="M32 4 L46 9 L32 14 Z" fill="#FF6FB0"/>' +
    '<rect x="30.5" y="2" width="2.4" height="16" rx="1.2" fill="#8A6FBF"/>' +
    '<rect class="mur" x="4"  y="26" width="15" height="30" rx="2"/>' +
    '<rect class="mur" x="45" y="26" width="15" height="30" rx="2"/>' +
    '<path class="tet" d="M2 26 L11.5 14 L21 26 Z"/>' +
    '<path class="tet" d="M43 26 L52.5 14 L62 26 Z"/>' +
    '<rect class="mur" x="18" y="18" width="28" height="38" rx="2"/>' +
    '<path class="tet" d="M15 18 L32 3 L49 18 Z"/>' +
    '<rect class="mur" x="19" y="14" width="5" height="6"/>' +
    '<rect class="mur" x="29.5" y="14" width="5" height="6"/>' +
    '<rect class="mur" x="40" y="14" width="5" height="6"/>' +
    '<path class="portao" d="M25 56 L25 40 Q32 32 39 40 L39 56 Z"/>' +
    '<circle class="jan" cx="11.5" cy="36" r="3"/>' +
    '<circle class="jan" cx="52.5" cy="36" r="3"/>' +
    '</svg>';
}

let caminhoPasso = 0;
let caminhoCenario = -1;
let caminhoCaixa = null;

function injetaEstiloCaminho(){
  if(document.getElementById('estiloCaminho')) return;
  const s = document.createElement('style');
  s.id = 'estiloCaminho';
  s.textContent = `
    /* O #jogo é .tela{flex:1;display:flex;flex-direction:column}, e todo
       filho de flex encolhe por padrão. Só 'height' não segura: sem espaço
       sobrando o navegador espremia a faixa até dois pixels e ela sumia da
       tela estando montada. flex:0 0 é o que reserva a altura de verdade. */
    #caminho{
      flex:0 0 ${CAMINHO_ALTURA}px;
      position:relative; width:100%; max-width:560px;
      height:${CAMINHO_ALTURA}px; min-height:${CAMINHO_ALTURA}px;
      margin:2px auto 8px; border-radius:20px; overflow:hidden;
      background:linear-gradient(180deg, var(--cam-ceu1) 0%, var(--cam-ceu2) 100%);
      box-shadow:inset 0 2px 8px rgba(74,42,135,.12), 0 3px 10px rgba(74,42,135,.16);
      transition:background .8s ease;
    }

    /* As cartas ignoravam o espaço que sobrava: aspect-ratio 1/1 com
       width:100% faz a altura vir da largura da coluna, então a última
       fila era cortada pela borda de baixo — e piorava com 4 e 6 cartas.
       Mandando a carta ocupar a ALTURA da fila e derivar a largura dela,
       o quadrado se mantém e nada mais vaza da tela. */
    #jogo .cartas{ min-height:0; }
    #jogo .cartas .carta{
      height:100%; width:auto; max-width:100%;
      margin-inline:auto; align-self:center;
    }

    #caminho .morros{
      position:absolute; left:0; right:0; bottom:20px; height:34px;
      background:linear-gradient(180deg, var(--cam-morro) 0%, var(--cam-morro2) 100%);
      clip-path:polygon(0 60%, 16% 26%, 33% 56%, 50% 20%, 67% 52%, 84% 26%, 100% 50%, 100% 100%, 0 100%);
      transition:background .8s ease;
    }

    #caminho .trilha{
      position:absolute; left:0; right:0; bottom:0; height:30px;
      background:var(--cam-trilha);
      border-top:3px solid var(--cam-borda);
      transition:background .8s ease, border-color .8s ease;
    }
    #caminho .pegadas{
      position:absolute; left:0; right:0; bottom:9px; height:14px;
      display:flex; align-items:center;
    }
    /* cada marco fica no MEIO do seu trecho, alinhado com onde o
       viajante realmente para — por isso flex:1, não space-around */
    #caminho .pegada{ flex:1; display:flex; align-items:center; justify-content:center; }
    #caminho .pegada i{
      width:11px; height:11px; border-radius:50%; display:block;
      background:var(--cam-borda); opacity:.5;
      transition:transform .35s cubic-bezier(.2,1.6,.4,1), opacity .3s, background .3s;
    }
    #caminho .pegada.pisada i{
      background:#FFC93C; opacity:1; transform:scale(1.7);
      box-shadow:0 0 8px rgba(255,201,60,.9);
    }

    #caminho .castelo{
      position:absolute; right:4px; bottom:12px;
      width:52px; height:49px; line-height:0;
      filter:drop-shadow(0 2px 3px rgba(60,40,110,.4));
      transition:transform .5s ease;
    }
    #caminho .castelo svg{ width:100%; height:100%; overflow:visible; }
    #caminho .castelo .mur{ fill:var(--cam-torre); stroke:rgba(90,60,140,.35); stroke-width:1.2; }
    #caminho .castelo .tet{ fill:var(--cam-teto);  stroke:rgba(90,60,140,.3);  stroke-width:1.2; }
    #caminho .castelo .jan{ fill:#FFD86E; }
    #caminho .castelo .portao{ fill:#6B3FBF; transform-origin:32px 56px; transition:transform .6s ease; }
    #caminho.chegou .castelo{ transform:scale(1.18) translateY(-2px); }
    #caminho.chegou .castelo .portao{ transform:scaleY(.08); }
    #caminho.chegou .castelo .jan{ fill:#FFF3B0; }

    /* Anda com transform, que a placa de vídeo resolve sozinha — animar
       'left' obrigaria o navegador a recalcular o layout a cada quadro,
       que foi o que já travou as nuvens no celular. */
    #caminho .viajante{
      position:absolute; left:0; bottom:14px;
      width:44px; height:44px; border-radius:50%;
      background:#fff; overflow:hidden; border:3px solid #fff;
      box-shadow:0 0 0 2px #FF6FB0, 0 3px 8px rgba(60,40,110,.45);
      transform:translateX(0);
      transition:transform .8s cubic-bezier(.34,1.25,.5,1);
      display:flex; align-items:center; justify-content:center; font-size:22px;
      will-change:transform; z-index:2;
    }
    #caminho .viajante img{ width:100%; height:100%; object-fit:cover; object-position:center 34%; }
    #caminho .viajante.pulando{ animation:viajaPula .8s ease-out; }
    @keyframes viajaPula{
      0%{ bottom:14px; } 45%{ bottom:30px; } 100%{ bottom:14px; }
    }

    #caminho .enfeite{
      position:absolute; font-size:13px; opacity:.85; pointer-events:none;
      animation:camFlutua 5s ease-in-out infinite;
    }
    @keyframes camFlutua{
      0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); }
    }

    #caminho.chegou .trilha{
      background:#FFE9A8; border-color:#FFC93C;
      box-shadow:0 -2px 14px rgba(255,201,60,.85);
    }
  `;
  document.head.appendChild(s);
}

function iniciaCaminho(alvo){
  if(!alvo) return;
  injetaEstiloCaminho();

  let cx = document.getElementById('caminho');
  if(!cx){
    cx = document.createElement('div');
    cx.id = 'caminho';
    alvo.insertBefore(cx, alvo.firstChild);
  }
  caminhoCaixa = cx;

  let n = Math.floor(Math.random() * CAMINHOS_CENARIO.length);
  if(n === caminhoCenario) n = (n + 1) % CAMINHOS_CENARIO.length;
  caminhoCenario = n;
  const c = CAMINHOS_CENARIO[n];

  ['ceu1','ceu2','morro','morro2','trilha','borda','torre','teto']
    .forEach(k => cx.style.setProperty('--cam-' + k, c[k]));
  cx.classList.remove('chegou');

  let pegadas = '';
  for(let i = 0; i < CAMINHO_PASSOS; i++) pegadas += '<span class="pegada"><i></i></span>';

  let enfeites = '';
  [[14,8],[38,4],[60,10],[78,5]].forEach((e, i) => {
    enfeites += '<span class="enfeite" style="left:' + e[0] + '%; top:' + e[1] +
                'px; animation-delay:' + (i * .8) + 's">' + c.enfeite + '</span>';
  });

  const foto = (typeof imgDaAmiga === 'function') ? imgDaAmiga() : null;

  cx.innerHTML =
    '<div class="morros"></div>' + enfeites +
    '<div class="trilha"></div>' +
    '<div class="pegadas">' + pegadas + '</div>' +
    '<div class="castelo">' + svgCastelo() + '</div>' +
    '<div class="viajante">' + (foto ? '<img src="' + foto + '" alt="">' : '⭐') + '</div>';

  caminhoPasso = 0;
  posicionaViajante();

  /* se a faixa voltar a ser esmagada, isso aparece escrito na tela
     em vez de sumir sem explicação */
  setTimeout(() => {
    if(cx.clientHeight >= 40) return;
    cx.style.flex = '0 0 ' + CAMINHO_ALTURA + 'px';
    cx.style.minHeight = CAMINHO_ALTURA + 'px';
    posicionaViajante();
    if(cx.clientHeight < 40 && typeof avisa === 'function'){
      avisa('A trilha está sendo esmagada pelo layout (altura ' + cx.clientHeight + 'px).');
    }
  }, 60);
}

/* Medido em pixels na hora: porcentagem dentro de translateX se refere
   ao tamanho do próprio viajante, não da trilha, e ele pararia no lugar
   errado. Ele para no MEIO de cada trecho, em cima do marco. */
function larguraDoTrecho(){
  if(!caminhoCaixa) return 0;
  return (caminhoCaixa.clientWidth - 56) / CAMINHO_PASSOS;   // 56 = castelo
}

function posicionaViajante(){
  const v = caminhoCaixa && caminhoCaixa.querySelector('.viajante');
  if(!v) return;
  const t = larguraDoTrecho();
  const x = (caminhoPasso * t) + (t / 2) - (v.offsetWidth / 2);
  v.style.transform = 'translateX(' + Math.max(2, x).toFixed(1) + 'px)';
}

/* Dá um passo. Devolve true quando chegou ao castelo. */
function andaCaminho(){
  if(!caminhoCaixa) return false;

  caminhoPasso = Math.min(caminhoPasso + 1, CAMINHO_PASSOS);

  const marcos = caminhoCaixa.querySelectorAll('.pegada');
  if(marcos[caminhoPasso - 1]) marcos[caminhoPasso - 1].classList.add('pisada');

  const v = caminhoCaixa.querySelector('.viajante');
  if(v){
    v.classList.remove('pulando');
    void v.offsetWidth;          // reinicia a animação em passos seguidos
    v.classList.add('pulando');
  }
  posicionaViajante();

  if(caminhoPasso >= CAMINHO_PASSOS){
    caminhoCaixa.classList.add('chegou');
    return true;
  }
  return false;
}

function passosQueFaltam(){ return Math.max(0, CAMINHO_PASSOS - caminhoPasso); }

addEventListener('resize', posicionaViajante);
