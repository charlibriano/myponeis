/* ============================================================
   A CAMINHADA  —  o quiz deixa de ser um laço sem fim

   O "Cadê o Pônei?" acertava e recomeçava, para sempre. Aos 4 anos
   isso esvazia rápido: não há destino, e o placar de estrelas ela
   não lê. A recompensa a cada 5 acertos ajudava pouco, porque
   chegava sem aviso — ela não via que estava perto.

   Aqui a rodada vira um trajeto de 6 passos até um castelo. A amiga
   escolhida no menu anda um passo por acerto, na frente dela. Ver a
   distância encurtando é o que segura a atenção; o prêmio no fim só
   fecha o que ela já estava acompanhando.

   Cada trajeto sorteia um cenário diferente, então a tela não é a
   mesma três vezes seguidas — foi o que mais rápido cansou até aqui.

   Tudo é CSS e SVG embutido: nenhuma imagem nova para baixar, e o
   estilo é injetado por JS, como o album.js e o perfil.js já fazem,
   para não precisar mexer no css/estilo.css.

   Depende de: perfil.js (imgDaAmiga). Se faltar, usa uma estrela.
   ============================================================ */

/* 5 passos, não 6: era o número que já valia um prêmio antes, e mudar
   isso junto com o resto só criou confusão no teste. */
const CAMINHO_PASSOS = 5;

/* Os cenários mudam só variáveis de cor. O desenho da trilha é o
   mesmo, então trocar de cenário não custa nada em desempenho. */
const CAMINHOS_CENARIO = [
  { id:'campo',   ceu1:'#BFEAFF', ceu2:'#EAF9E8', morro:'#8FD89A', morro2:'#64BE7C',
    trilha:'#F2E0B8', borda:'#D9BE87', enfeite:'🌼' },
  { id:'poente',  ceu1:'#FFD9A8', ceu2:'#FFC2C7', morro:'#C89A7E', morro2:'#A5745E',
    trilha:'#F6D9A6', borda:'#D9AE74', enfeite:'🌻' },
  { id:'noite',   ceu1:'#5B6BC0', ceu2:'#8E86D8', morro:'#4E6E8E', morro2:'#3A5470',
    trilha:'#C9C4E8', borda:'#9A93C4', enfeite:'⭐' },
  { id:'jardim',  ceu1:'#D9F0FF', ceu2:'#FFE9F5', morro:'#9ADCA8', morro2:'#6FBF8E',
    trilha:'#F5DCE8', borda:'#DCB4C8', enfeite:'🌸' },
  { id:'gelo',    ceu1:'#DCF2FF', ceu2:'#F2FAFF', morro:'#BFE4F5', morro2:'#8FC4E0',
    trilha:'#E8F4FB', borda:'#B4D4E8', enfeite:'❄️' }
];

let caminhoPasso = 0;
let caminhoCenario = 0;
let caminhoCaixa = null;

function injetaEstiloCaminho(){
  if(document.getElementById('estiloCaminho')) return;
  const s = document.createElement('style');
  s.id = 'estiloCaminho';
  s.textContent = `
    #caminho{
      /* O #jogo é .tela{flex:1;display:flex;flex-direction:column}, e todo
         filho de flex encolhe por padrão. Só 'height' não segura: sem espaço
         sobrando, o navegador espremia a faixa até dois pixels e ela sumia da
         tela mesmo estando montada. flex:0 0 104px é o que reserva a altura. */
      flex:0 0 104px;
      position:relative; margin:0 auto 10px; width:100%; max-width:560px;
      height:104px; min-height:104px; border-radius:22px; overflow:hidden;
      background:linear-gradient(180deg, var(--cam-ceu1) 0%, var(--cam-ceu2) 100%);
      box-shadow:inset 0 2px 8px rgba(74,42,135,.14), 0 4px 12px rgba(74,42,135,.16);
      transition:background .8s ease;
    }
    /* as colinas: um SVG só, esticado — nada para baixar */
    #caminho .morros{
      position:absolute; left:0; right:0; bottom:26px; height:46px;
      background:
        linear-gradient(180deg, var(--cam-morro) 0%, var(--cam-morro2) 100%);
      clip-path:polygon(0 62%, 14% 34%, 30% 58%, 46% 26%, 62% 54%, 78% 30%, 92% 56%, 100% 40%, 100% 100%, 0 100%);
      transition:background .8s ease;
    }
    /* a trilha onde ela anda */
    #caminho .trilha{
      position:absolute; left:10px; right:10px; bottom:12px; height:26px;
      border-radius:14px;
      background:var(--cam-trilha);
      border:2px solid var(--cam-borda);
      transition:background .8s ease, border-color .8s ease;
    }
    #caminho .pegadas{
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:space-around;
      padding:0 26px 0 34px;
    }
    #caminho .pegada{
      width:10px; height:10px; border-radius:50%;
      background:var(--cam-borda); opacity:.55;
      transition:transform .3s ease, opacity .3s ease, background .3s ease;
    }
    #caminho .pegada.pisada{
      background:#FFC93C; opacity:1; transform:scale(1.5);
    }

    /* o castelo no fim: é o destino que ela enxerga desde o começo */
    #caminho .castelo{
      position:absolute; right:6px; bottom:8px;
      font-size:40px; line-height:1;
      filter:drop-shadow(0 2px 3px rgba(60,40,110,.35));
      animation:castChama 2.4s ease-in-out infinite;
    }
    @keyframes castChama{
      0%,100%{ transform:translateY(0) scale(1); }
      50%    { transform:translateY(-4px) scale(1.06); }
    }
    #caminho .castelo.aberto{ animation:castAbre .9s ease-out both; }
    @keyframes castAbre{
      0%  { transform:scale(1); }
      40% { transform:scale(1.5) rotate(-6deg); }
      100%{ transform:scale(1.25) rotate(0); }
    }

    /* o viajante: a amiga que ela escolheu no menu.
       Anda com transform, que a placa de vídeo resolve sozinha —
       animar 'left' obrigaria o navegador a recalcular a tela inteira
       a cada quadro, que foi o que já travou as nuvens no celular. */
    #caminho .viajante{
      position:absolute; left:6px; bottom:6px;
      width:52px; height:52px; border-radius:50%;
      background:#fff; overflow:hidden;
      border:3px solid #fff;
      box-shadow:0 0 0 2px #FF6FB0, 0 4px 10px rgba(60,40,110,.4);
      transform:translateX(0);
      transition:transform .75s cubic-bezier(.34,1.3,.5,1);
      display:flex; align-items:center; justify-content:center;
      font-size:26px;
      will-change:transform;
    }
    #caminho .viajante img{
      width:100%; height:100%; object-fit:cover; object-position:center 34%;
    }
    #caminho .viajante.pulando{ animation:viajaPula .75s ease-out; }
    @keyframes viajaPula{
      0%  { margin-bottom:0; }
      45% { margin-bottom:16px; }
      100%{ margin-bottom:0; }
    }

    /* enfeitinhos de cenário, só para a tela não repetir */
    #caminho .enfeite{
      position:absolute; font-size:15px; opacity:.8; pointer-events:none;
      animation:camFlutua 5s ease-in-out infinite;
    }
    @keyframes camFlutua{
      0%,100%{ transform:translateY(0); }
      50%    { transform:translateY(-6px); }
    }

    /* a chegada: a trilha inteira acende */
    #caminho.chegou .trilha{
      background:#FFE9A8; border-color:#FFC93C;
      box-shadow:0 0 16px rgba(255,201,60,.9);
    }
  `;
  document.head.appendChild(s);
}

/* ---------- montar a trilha dentro de uma tela ---------- */
/* alvo = o elemento onde a faixa entra (a seção do jogo).
   A faixa vai sempre no topo, antes da pergunta. */
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

  /* cenário novo a cada trajeto, sem repetir o anterior */
  let n = Math.floor(Math.random() * CAMINHOS_CENARIO.length);
  if(n === caminhoCenario) n = (n + 1) % CAMINHOS_CENARIO.length;
  caminhoCenario = n;
  const c = CAMINHOS_CENARIO[n];

  cx.style.setProperty('--cam-ceu1',   c.ceu1);
  cx.style.setProperty('--cam-ceu2',   c.ceu2);
  cx.style.setProperty('--cam-morro',  c.morro);
  cx.style.setProperty('--cam-morro2', c.morro2);
  cx.style.setProperty('--cam-trilha', c.trilha);
  cx.style.setProperty('--cam-borda',  c.borda);
  cx.classList.remove('chegou');

  let pegadas = '';
  for(let i = 0; i < CAMINHO_PASSOS; i++) pegadas += '<span class="pegada"></span>';

  let enfeites = '';
  [[16,10],[44,6],[70,14],[88,8]].forEach((e, i) => {
    enfeites += '<span class="enfeite" style="left:' + e[0] + '%; top:' + e[1] +
                'px; animation-delay:' + (i * .8) + 's">' + c.enfeite + '</span>';
  });

  const foto = (typeof imgDaAmiga === 'function') ? imgDaAmiga() : null;

  cx.innerHTML =
    '<div class="morros"></div>' +
    enfeites +
    '<div class="trilha"><div class="pegadas">' + pegadas + '</div></div>' +
    '<div class="castelo">🏰</div>' +
    '<div class="viajante">' +
      (foto ? '<img src="' + foto + '" alt="">' : '⭐') +
    '</div>';

  caminhoPasso = 0;
  posicionaViajante();

  /* Autoverificação: se a faixa voltar a ser esmagada por algum estilo da
     página, isso aparece escrito na tela em vez de simplesmente sumir sem
     explicação — foi exatamente assim que o problema passou despercebido. */
  setTimeout(() => {
    if(cx.clientHeight >= 40) return;
    cx.style.flex = '0 0 104px';
    cx.style.minHeight = '104px';
    posicionaViajante();
    if(cx.clientHeight < 40 && typeof avisa === 'function'){
      avisa('A trilha está sendo esmagada pelo layout (altura ' +
            cx.clientHeight + 'px). Toque para fechar.');
    }
  }, 60);
}

/* A distância de cada passo é medida em pixels na hora, e não em
   porcentagem: porcentagem dentro de translateX se refere ao tamanho
   do próprio viajante, não da trilha, e ele pararia no lugar errado. */
function larguraDoPasso(){
  if(!caminhoCaixa) return 0;
  const larg = caminhoCaixa.clientWidth;
  const viaj = caminhoCaixa.querySelector('.viajante');
  const vw = viaj ? viaj.offsetWidth : 52;
  return (larg - vw - 52) / CAMINHO_PASSOS;   // 52 = margem + castelo
}

function posicionaViajante(){
  const v = caminhoCaixa && caminhoCaixa.querySelector('.viajante');
  if(!v) return;
  v.style.transform = 'translateX(' + (caminhoPasso * larguraDoPasso()).toFixed(1) + 'px)';
}

/* Dá um passo. Devolve true quando chegou ao castelo — é o sinal de
   que a rodada acabou e o prêmio pode entrar. */
function andaCaminho(){
  if(!caminhoCaixa) return false;

  caminhoPasso = Math.min(caminhoPasso + 1, CAMINHO_PASSOS);

  const pegadas = caminhoCaixa.querySelectorAll('.pegada');
  if(pegadas[caminhoPasso - 1]) pegadas[caminhoPasso - 1].classList.add('pisada');

  const v = caminhoCaixa.querySelector('.viajante');
  if(v){
    v.classList.remove('pulando');
    void v.offsetWidth;          // reinicia a animação mesmo em passos seguidos
    v.classList.add('pulando');
  }
  posicionaViajante();

  if(caminhoPasso >= CAMINHO_PASSOS){
    caminhoCaixa.classList.add('chegou');
    const cast = caminhoCaixa.querySelector('.castelo');
    if(cast) cast.classList.add('aberto');
    return true;
  }
  return false;
}

function passosQueFaltam(){ return Math.max(0, CAMINHO_PASSOS - caminhoPasso); }

/* se a tela girar, o passo muda de tamanho e o viajante sai do lugar */
addEventListener('resize', posicionaViajante);
