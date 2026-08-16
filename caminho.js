/* ============================================================
   A JORNADA — dono único da tela do "Cadê o Pônei?"

   Este arquivo controla as DUAS coisas da tela do quiz: a faixa da
   caminhada até o castelo e o campo onde os pôneis ficam espalhados.

   Ficavam em arquivos separados, cada um com sua folha de estilo, e
   as duas mexiam nas mesmas regras da .carta. Como cada folha era
   injetada num momento diferente, quem entrava por último vencia — e
   isso mudava conforme o toque do usuário. Foi o que estourou os
   medalhões em tela cheia. Uma folha só, injetada no carregamento,
   elimina a disputa em vez de arbitrar quem ganha.

   Não altera o jogo.js: envolve o novaRodada por fora e só posiciona
   as cartas que ele já montou. Acerto, erro, prêmio e missão
   continuam sendo tratados lá.

   Depende de perfil.js (imgDaAmiga). Sem ele, usa uma estrela.
   Carregue DEPOIS do jogo.js.
   ============================================================ */

const CAMINHO_PASSOS = 5;
const CAMINHO_ALTURA = 88;   // px reservados no topo do #jogo

const CAMINHOS_CENARIO = [
  { id:'campo',  ceu1:'#BFEAFF', ceu2:'#E8F8EC', morro:'#8FD89A', morro2:'#5FBF7A',
    trilha:'#F0DDB0', borda:'#D2B481', torre:'#F2E4F8', teto:'#B98FD8',
    campo1:'#CFEEFF', campo2:'#DFF4FF', grama1:'#9FDCAE', grama2:'#7CC98D', enfeite:'🌼' },
  { id:'poente', ceu1:'#FFD9A8', ceu2:'#FFC2C7', morro:'#C89A7E', morro2:'#9A6A56',
    trilha:'#F5D3A0', borda:'#CFA26C', torre:'#FFF0E0', teto:'#E08A6E',
    campo1:'#FFDDB4', campo2:'#FFCBC6', grama1:'#D8A98E', grama2:'#B98A70', enfeite:'🌻' },
  { id:'noite',  ceu1:'#4E5DAE', ceu2:'#8E86D8', morro:'#3E5A78', morro2:'#2C4058',
    trilha:'#C4BEE8', borda:'#8E86BE', torre:'#E4E0F8', teto:'#7F6FC4',
    campo1:'#5A68B8', campo2:'#8E86D8', grama1:'#4E6E8E', grama2:'#3A5470', enfeite:'⭐' },
  { id:'jardim', ceu1:'#D9F0FF', ceu2:'#FFE9F5', morro:'#9ADCA8', morro2:'#6FBF8E',
    trilha:'#F2D4E4', borda:'#D0A4BE', torre:'#FFF2F8', teto:'#F08FC0',
    campo1:'#DDF2FF', campo2:'#FFE9F5', grama1:'#A8E0B8', grama2:'#7FC998', enfeite:'🌸' },
  { id:'gelo',   ceu1:'#DCF2FF', ceu2:'#F6FBFF', morro:'#BFE4F5', morro2:'#8FC4E0',
    trilha:'#E4F0F8', borda:'#AECEE2', torre:'#FFFFFF', teto:'#7FC2EA',
    campo1:'#E4F6FF', campo2:'#F6FBFF', grama1:'#CFEAF8', grama2:'#A8D4E8', enfeite:'❄️' }
];

const INTERVALO_DERIVA = 3000;   // ms entre uma andança e outra dos pôneis

let caminhoPasso = 0;
let caminhoCenario = -1;
let caminhoCaixa = null;
let relogioDeriva = null;

/* O castelo é desenhado, não emoji: emoji muda de forma em cada
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

/* ------------------------------------------------------------------
   FOLHA ÚNICA — injetada uma vez, no carregamento
   ------------------------------------------------------------------ */
function injetaEstiloJornada(){
  if(document.getElementById('estiloJornada')) return;
  const s = document.createElement('style');
  s.id = 'estiloJornada';
  s.textContent = `
    /* ===== A FAIXA DA CAMINHADA =====
       O #jogo é .tela{flex:1;display:flex;flex-direction:column}, e todo
       filho de flex encolhe por padrão. Só 'height' não segura: sem espaço
       sobrando o navegador espremia a faixa até dois pixels e ela sumia da
       tela estando montada. flex:0 0 é o que reserva a altura de verdade. */
    #jogo #caminho{
      flex:0 0 ${CAMINHO_ALTURA}px;
      position:relative; width:100%; max-width:560px;
      height:${CAMINHO_ALTURA}px; min-height:${CAMINHO_ALTURA}px;
      margin:2px auto 8px; border-radius:20px; overflow:hidden;
      background:linear-gradient(180deg, var(--cam-ceu1) 0%, var(--cam-ceu2) 100%);
      box-shadow:inset 0 2px 8px rgba(74,42,135,.12), 0 3px 10px rgba(74,42,135,.16);
      transition:background .8s ease;
    }
    #jogo #caminho .morros{
      position:absolute; left:0; right:0; bottom:20px; height:34px;
      background:linear-gradient(180deg, var(--cam-morro) 0%, var(--cam-morro2) 100%);
      clip-path:polygon(0 60%, 16% 26%, 33% 56%, 50% 20%, 67% 52%, 84% 26%, 100% 50%, 100% 100%, 0 100%);
      transition:background .8s ease;
    }
    #jogo #caminho .trilha{
      position:absolute; left:0; right:0; bottom:0; height:30px;
      background:var(--cam-trilha); border-top:3px solid var(--cam-borda);
      transition:background .8s ease, border-color .8s ease;
    }
    #jogo #caminho .pegadas{
      position:absolute; left:0; right:0; bottom:9px; height:14px;
      display:flex; align-items:center;
    }
    /* cada marco no MEIO do seu trecho, alinhado com onde o viajante
       realmente para — por isso flex:1, e não space-around */
    #jogo #caminho .pegada{ flex:1; display:flex; align-items:center; justify-content:center; }
    #jogo #caminho .pegada i{
      width:11px; height:11px; border-radius:50%; display:block;
      background:var(--cam-borda); opacity:.5;
      transition:transform .35s cubic-bezier(.2,1.6,.4,1), opacity .3s, background .3s;
    }
    #jogo #caminho .pegada.pisada i{
      background:#FFC93C; opacity:1; transform:scale(1.7);
      box-shadow:0 0 8px rgba(255,201,60,.9);
    }
    #jogo #caminho .castelo{
      position:absolute; right:4px; bottom:12px;
      width:52px; height:49px; line-height:0;
      filter:drop-shadow(0 2px 3px rgba(60,40,110,.4));
      transition:transform .5s ease;
    }
    #jogo #caminho .castelo svg{ width:100%; height:100%; overflow:visible; }
    #jogo #caminho .castelo .mur{ fill:var(--cam-torre); stroke:rgba(90,60,140,.35); stroke-width:1.2; }
    #jogo #caminho .castelo .tet{ fill:var(--cam-teto);  stroke:rgba(90,60,140,.3);  stroke-width:1.2; }
    #jogo #caminho .castelo .jan{ fill:#FFD86E; }
    #jogo #caminho .castelo .portao{ fill:#6B3FBF; transform-origin:32px 56px; transition:transform .6s ease; }
    #jogo #caminho.chegou .castelo{ transform:scale(1.18) translateY(-2px); }
    #jogo #caminho.chegou .castelo .portao{ transform:scaleY(.08); }
    #jogo #caminho.chegou .castelo .jan{ fill:#FFF3B0; }
    #jogo #caminho.chegou .trilha{
      background:#FFE9A8; border-color:#FFC93C;
      box-shadow:0 -2px 14px rgba(255,201,60,.85);
    }

    /* Anda com transform, que a placa de vídeo resolve sozinha — animar
       'left' obrigaria o navegador a recalcular o layout a cada quadro,
       que foi o que já travou as nuvens no celular. */
    #jogo #caminho .viajante{
      position:absolute; left:0; bottom:14px;
      width:44px; height:44px; border-radius:50%;
      background:#fff; overflow:hidden; border:3px solid #fff;
      box-shadow:0 0 0 2px #FF6FB0, 0 3px 8px rgba(60,40,110,.45);
      transform:translateX(0);
      transition:transform .8s cubic-bezier(.34,1.25,.5,1);
      display:flex; align-items:center; justify-content:center; font-size:22px;
      will-change:transform; z-index:2;
    }
    #jogo #caminho .viajante img{
      width:100%; height:100%; object-fit:cover; object-position:center 30%;
    }
    #jogo #caminho .viajante.pulando{ animation:viajaPula .8s ease-out; }
    @keyframes viajaPula{ 0%{bottom:14px} 45%{bottom:30px} 100%{bottom:14px} }

    #jogo #caminho .enfeite{
      position:absolute; font-size:13px; opacity:.85; pointer-events:none;
      animation:camFlutua 5s ease-in-out infinite;
    }
    @keyframes camFlutua{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

    /* ===== O CAMPO DA ESCOLHA =====
       A grade virava fila: com 3 pôneis sobrava uma carta órfã embaixo,
       e nada se movia. Aqui não há fila, então número ímpar nunca fica
       torto, e o campo tem movimento próprio. */
    #jogo .cartas, #jogo .cartas.duas{
      display:block; position:relative;
      flex:1; min-height:0;
      border-radius:20px; overflow:hidden;
      background:
        radial-gradient(circle at 18% 20%, rgba(255,255,255,.5) 0 3%, transparent 4%),
        radial-gradient(circle at 76% 32%, rgba(255,255,255,.4) 0 2.5%, transparent 3.5%),
        linear-gradient(180deg, var(--cam-campo1) 0%, var(--cam-campo2) 54%,
                                var(--cam-grama1) 54.1%, var(--cam-grama2) 100%);
      box-shadow:inset 0 2px 10px rgba(74,42,135,.12);
      transition:background .8s ease;
    }

    /* Largura amarrada à TELA (vw), não ao container: o container muda de
       altura conforme a faixa, e em % o medalhão mudava de tamanho junto.
       'left' e 'top' só mudam de 3 em 3 segundos, então o custo de layout
       é irrelevante; o flutuar continua sendo transform. */
    #jogo .cartas .carta{
      position:absolute;
      width:clamp(56px, 21vw, 92px);
      height:auto; aspect-ratio:1/1; max-width:none;
      padding:0; margin:0;
      border-radius:50%; background:#fff;
      box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(62,42,92,.32);
      transition:left 2.6s ease-in-out, top 2.6s ease-in-out,
                 transform .3s ease, opacity .3s ease;
      overflow:hidden;
    }
    /* 30% e não 34%: as imagens da wiki são de corpo inteiro, e num
       círculo maior que o do menu o enquadramento antigo cortava a
       cabeça. Aqui o rosto fica centralizado. */
    #jogo .cartas .carta img{
      width:100%; height:100%;
      object-fit:cover; object-position:center 30%;
      padding:0; border-radius:50%;
    }
    #jogo .cartas .carta svg{ width:100%; height:100%; }

    /* errar não é derrota: o pônei se sacode e pula para outro canto */
    #jogo .cartas .carta.errada{ animation:fugiu .45s ease; }
    @keyframes fugiu{
      0%,100%{ transform:rotate(0); }
      25%    { transform:rotate(-11deg); }
      70%    { transform:rotate(11deg); }
    }
    #jogo .cartas .carta.certa{
      z-index:3; box-shadow:0 0 0 4px #FFC93C, 0 0 22px rgba(255,201,60,.9);
    }
  `;
  document.head.appendChild(s);
}

/* ------------------------------------------------------------------
   A FAIXA
   ------------------------------------------------------------------ */
function iniciaCaminho(alvo){
  if(!alvo) return;
  injetaEstiloJornada();

  let cx = document.getElementById('caminho');
  if(!cx){
    cx = document.createElement('div');
    cx.id = 'caminho';
    alvo.insertBefore(cx, alvo.firstChild);
  }
  caminhoCaixa = cx;

  /* cenário novo a cada trajeto, nunca repetindo o anterior */
  let n = Math.floor(Math.random() * CAMINHOS_CENARIO.length);
  if(n === caminhoCenario) n = (n + 1) % CAMINHOS_CENARIO.length;
  caminhoCenario = n;
  const c = CAMINHOS_CENARIO[n];

  /* as variáveis vão no #app: a faixa e o campo são irmãos, e os dois
     precisam mudar de cenário juntos */
  const raiz = document.getElementById('app') || document.documentElement;
  ['ceu1','ceu2','morro','morro2','trilha','borda','torre','teto',
   'campo1','campo2','grama1','grama2']
    .forEach(k => raiz.style.setProperty('--cam-' + k, c[k]));
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

/* Dá um passo. Devolve true quando chegou ao castelo — é o sinal, para
   o jogo.js, de que a rodada acabou e o prêmio pode entrar. */
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

/* ------------------------------------------------------------------
   O CAMPO
   ------------------------------------------------------------------ */

/* Os limites deixam de fora a faixa que o próprio medalhão ocupa,
   senão metade dele sai pela borda. A separação mínima é generosa
   porque com seis pôneis eles se encavalavam. */
function pontosDoCampo(n){
  const lista = [];
  let tentativas = 0;
  while(lista.length < n && tentativas < 800){
    tentativas++;
    const x = 4 + Math.random() * 66;
    const y = 5 + Math.random() * 60;
    const longe = lista.every(p => Math.abs(p.x - x) > 26 || Math.abs(p.y - y) > 28);
    if(longe) lista.push({ x, y });
  }
  /* sem lugar folgado, aceita o que tem: melhor dois pôneis próximos
     do que a rodada travada esperando posição perfeita */
  while(lista.length < n){
    lista.push({ x: 4 + Math.random() * 66, y: 5 + Math.random() * 60 });
  }
  return lista;
}

function espalhaCampo(){
  const campo = document.getElementById('cartas');
  if(!campo) return;
  const itens = campo.querySelectorAll('.carta');
  if(!itens.length) return;
  const locais = pontosDoCampo(itens.length);
  itens.forEach((c, i) => {
    c.style.left = locais[i].x + '%';
    c.style.top  = locais[i].y + '%';
  });
}

/* O pônei errado troca de lugar: a segunda tentativa não é idêntica à
   primeira, e some a sensação de estar presa na mesma pergunta. */
function ligaFugaDoErro(){
  const campo = document.getElementById('cartas');
  if(!campo) return;
  campo.addEventListener('click', ev => {
    const carta = ev.target.closest('.carta');
    if(!carta) return;
    const chamado = document.getElementById('nome');
    if(!chamado) return;
    if(carta.getAttribute('aria-label') === chamado.textContent) return;
    setTimeout(() => {
      const l = pontosDoCampo(1)[0];
      carta.style.left = l.x + '%';
      carta.style.top  = l.y + '%';
    }, 480);
  });
}

/* ------------------------------------------------------------------
   INSTALAÇÃO — envolve o novaRodada do jogo.js por fora
   ------------------------------------------------------------------ */
function instalaJornada(){
  injetaEstiloJornada();

  if(typeof novaRodada !== 'function'){
    if(typeof avisa === 'function'){
      avisa('A jornada precisa ser carregada depois do jogo.js.');
    }
    return;
  }

  ligaFugaDoErro();

  const original = novaRodada;
  window.novaRodada = function(){
    clearInterval(relogioDeriva);
    original.apply(this, arguments);   // o jogo.js monta as cartas como sempre
    espalhaCampo();                     // e aqui elas ganham lugar no campo
    relogioDeriva = setInterval(espalhaCampo, INTERVALO_DERIVA);
  };
}

if(document.readyState === 'loading') addEventListener('DOMContentLoaded', instalaJornada);
else instalaJornada();

/* se a tela girar, o trecho muda de tamanho e o viajante sai do lugar */
addEventListener('resize', () => { posicionaViajante(); espalhaCampo(); });
