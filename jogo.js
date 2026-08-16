/* ============================================================
   ESTADO E LÓGICA
   ============================================================ */
const el = id => document.getElementById(id);
let estrelas = 0, rodada = 0, alvo = null, travado = false;

/* a seleção de voz saiu junto com as falas */

function marcaStatus(){}   // o botão de status da voz foi removido

function avisa(txt){
  const r = el('recado');
  if(!txt){ r.classList.add('escondida'); return; }
  r.textContent = txt;
  r.classList.remove('escondida');
}
el('recado').addEventListener('click', ()=>avisa(''));

/* ------------------------------------------------------------------
   DIAGNÓSTICO NA TELA

   Sem isto, quando algo falha aqui dentro simplesmente não acontece
   nada: a criança acerta, some a festa e o jogo segue. Quem testa não
   tem como saber se o arquivo certo carregou, se uma dependência
   faltou ou se deu erro no meio.

   Nada disso aparece para ela. O aviso de erro só surge se houver erro,
   e a confirmação de versão só com ?dev=1 no endereço.
   ------------------------------------------------------------------ */
const JOGO_VERSAO = 'jogo.js v3 — caminhada até o castelo';
const MODO_TESTE  = location.search.includes('dev');

addEventListener('error', e => {
  avisa('ERRO: ' + e.message + (e.lineno ? ' (linha ' + e.lineno + ')' : '') +
        ' — toque para fechar');
});

if(MODO_TESTE){
  const falta = ['premiar','concluiuDesafio','festejaMissao','colecao','iniciaCaminho']
    .filter(f => typeof window[f] !== 'function');
  avisa(JOGO_VERSAO +
        (falta.length ? ' · FALTANDO: ' + falta.join(', ') : ' · dependências ok') +
        ' · passos até o castelo: ' + (typeof CAMINHO_PASSOS !== 'undefined' ? CAMINHO_PASSOS : 5));
}

/* As falas foram removidas do jogo. A função continua existindo, vazia,
   porque é chamada em dezenas de lugares — arrancar cada chamada daria
   mais risco de quebrar do que ganho. */
function fala(){}

function testaVoz(){}   // falas removidas do jogo

/* --- sons curtinhos --- */
let ctx = null;
function bip(freqs, dur=.12){
  try{
    ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
    freqs.forEach((f,i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='triangle'; o.frequency.value=f;
      const t = ctx.currentTime + i*dur;
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(.25,t+.02);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+dur+.02);
    });
  }catch(e){}
}

/* --- sorteio --- */
const sorteia = arr => arr[Math.floor(Math.random()*arr.length)];
/* Com true, o jogo só usa pôneis que têm imagem de verdade, para ficar
   igual ao jogo da memória. Vira false para voltar a aceitar os desenhados
   em SVG (útil enquanto faltarem imagens de personagens que ela ama). */
const SO_COM_IMAGEM = true;

/* Um acerto solto é curto demais para valer um desafio da missão.
   A cada 5 acertos o jogo credita um, o que dá tempo de brincadeira
   parecido com uma rodada de memória ou um labirinto.

   A cada 5 acertos a rodada também TERMINA e entra o prêmio do álbum.
   Antes isto só creditava a missão: o labirinto, a memória e o jogo do
   nome chamavam premiar() ao vencer, e o quiz era o único que não
   entregava figurinha nenhuma — justamente o jogo em que ela mais
   acerta. E era o único sem fim, rodando até ela cansar.

   Devolve true quando premiou, para quem chamou não marcar a próxima
   rodada: ela começaria por trás da tela de prêmio e, ao fechar, o
   jogo já estaria no meio de outra pergunta. */
function contaDesafio(){
  /* Quem decide o fim da rodada é a caminhada, na tela do "Cadê o
     Pônei?": acabou quando a amiga chega no castelo. Contar acertos
     soltos não dizia nada para ela, porque não dava para ver o quanto
     faltava.

     No "Quem Sumiu?" não existe caminhada, e o andaCaminho devolvia
     false para sempre — a fase nunca terminava e ela ficava presa no
     mesmo jogo. Lá uma rodada certa já é a fase inteira: achar quem
     sumiu é uma tarefa fechada, não uma sequência.

     Sem o caminho.js carregado, cai na contagem antiga de 5. */
  const noQuiz = !el('jogo').classList.contains('escondida');
  let chegou;
  if(!noQuiz)                                  chegou = true;
  else if(typeof andaCaminho === 'function')   chegou = andaCaminho();
  else                                         chegou = (estrelas !== 0 && estrelas % 5 === 0);
  if(!chegou) return false;

  let m = null;
  if(typeof concluiuDesafio === "function") m = concluiuDesafio();

  const proxima = () => {
    if(m && m.completouAgora && typeof festejaMissao === "function") festejaMissao();
    if(!el('jogo').classList.contains('escondida')){
      if(typeof iniciaCaminho === 'function') iniciaCaminho(el('jogo'));
      novaRodada();
    }
    else if(!el('sumiu').classList.contains('escondida')) novaRodadaSumiu();
  };

  /* o atraso deixa a festa de estrelinhas do acerto acabar antes da tela
     de prêmio subir; atropeladas, ela não liga uma coisa à outra */
  if(typeof premiar !== "function"){
    avisa('O prêmio não saiu: premiar() não existe. O album.js não carregou nesta página.');
    setTimeout(proxima, 1500);
    return true;
  }
  setTimeout(() => {
    try{ premiar(proxima); }
    catch(err){
      avisa('O prêmio falhou: ' + err.message + ' — toque para fechar');
      proxima();
    }
  }, 1400);
  return true;
}

function elenco(){
  const n = estrelas < 6 ? 1 : (estrelas < 16 ? 2 : 3);
  const grupo = PONEIS.filter(p => p.nivel <= n);
  if(!SO_COM_IMAGEM) return grupo;
  const comImagem = grupo.filter(p => imagemDe(p));
  // se sobrar pouca gente com imagem, prefere jogar a travar
  return comImagem.length >= 3 ? comImagem : grupo;
}
function quantasCartas(){
  if(rodada <= 3) return 2;
  if(rodada <= 8) return 3;
  if(rodada <= 14) return 4;
  return 6;
}

function novaRodada(){
  travado = false;
  rodada++;
  const grupo = elenco();
  const qtd = Math.min(quantasCartas(), grupo.length);
  const opcoes = [];
  while(opcoes.length < qtd){
    const p = sorteia(grupo);
    if(!opcoes.includes(p)) opcoes.push(p);
  }
  alvo = sorteia(opcoes);

  el('artigo').textContent = alvo.art;
  el('nome').textContent = alvo.nome;

  const cartas = el('cartas');
  cartas.className = 'cartas' + (qtd===2 ? ' duas' : '');
  cartas.innerHTML = '';
  opcoes.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'carta';
    b.setAttribute('aria-label', p.nome);
    b.innerHTML = retrato(p);
    b.addEventListener('click', ()=>responde(p, b));
    cartas.appendChild(b);
  });

  setTimeout(()=>fala('Cadê ' + alvo.art + ' ' + alvo.nome + '?'), 250);
}

function responde(p, botao){
  if(travado) return;
  if(p === alvo){
    travado = true;
    estrelas++;
    el('placar').textContent = estrelas;
    const premiando = contaDesafio();
    botao.classList.add('certa');
    [...document.querySelectorAll('.carta')].forEach(c=>{ if(c!==botao) c.classList.add('apagada'); });
    bip([660,880,1180],.11);
    festa(botao);
    const elogios = ['Isso!','Muito bem!','Boa!','Você acertou!'];
    fala(sorteia(elogios) + ' ' + (alvo.art==='a'?'Essa é a ':'Esse é o ') + alvo.nome + '!');
    if(!premiando) setTimeout(novaRodada, 2100);
  }else{
    botao.classList.remove('errada');
    void botao.offsetWidth;
    botao.classList.add('errada');
    bip([300,240],.14);
    fala('Tenta de novo. Cadê ' + alvo.art + ' ' + alvo.nome + '?');
  }
}

function festa(origem){
  const r = origem.getBoundingClientRect();
  const simbolos = ['⭐','✨','💖','🌈','💫'];
  for(let i=0;i<14;i++){
    const s = document.createElement('div');
    s.className = 'brilho';
    s.textContent = sorteia(simbolos);
    s.style.left = (r.left + r.width/2) + 'px';
    s.style.top  = (r.top + r.height/2) + 'px';
    s.style.setProperty('--dx', (Math.random()*240-120).toFixed(0)+'px');
    s.style.setProperty('--dy', (-Math.random()*200-40).toFixed(0)+'px');
    s.style.setProperty('--rot', (Math.random()*360-180).toFixed(0)+'deg');
    s.style.animationDelay = (Math.random()*.25).toFixed(2)+'s';
    document.body.appendChild(s);
    setTimeout(()=>s.remove(), 1500);
  }
}


/* ============================================================
   MODO 2 — QUEM SUMIU?
   Mostra um grupo de pôneis, um desaparece, ela diz quem era.
   ============================================================ */
let sTimers = [], sAlvo = null, sRodada = 0, sTravado = true, sGrupo = [], sMesa = [];
function limpaTimers(){ sTimers.forEach(clearTimeout); sTimers = []; }
function depois(fn, ms){ sTimers.push(setTimeout(fn, ms)); }

/* ===================================================================
   QUEM SUMIU?

   A versão anterior escondia o pônei atrás de moitas, barris e casas
   desenhados em SVG, com um rabinho de pista saindo de trás. Saiu:
   desenho vetorial feito à mão não sustenta a comparação com as
   imagens da série que estão na pasta, e o rabinho ficava tosco.

   Aqui todo elemento visível é foto de verdade. Os pôneis brincam no
   campo, uma rajada de folhas passa, um deles some e deixa o lugar
   vazio. Ela toca em quem faltou, entre três retratos.

   Uma rodada certa encerra a fase — quem decide isso é o
   contaDesafio, que devolve true na primeira acertada deste modo.
   =================================================================== */

function quantosNaMesa(){
  if(sRodada <= 2) return 3;
  if(sRodada <= 5) return 4;
  return 5;
}

/* estilos do campo, injetados daqui para não mexer no CSS do projeto */
(function estiloCampo(){
  if(document.getElementById('estiloCampo')) return;
  const st = document.createElement('style');
  st.id = 'estiloCampo';
  st.textContent = `
    #tabuleiro.campo{
      position:relative; display:block;
      width:100%; aspect-ratio:16/10; max-height:46vh;
      border-radius:22px; overflow:hidden;
      box-shadow:inset 0 2px 10px rgba(40,80,60,.2), 0 4px 12px rgba(62,42,92,.2);
    }
    #tabuleiro.campo .ceuCampo{
      position:absolute; inset:0 0 32% 0;
      background:linear-gradient(180deg,#BFEAFF 0%,#E4F6FF 100%);
    }
    #tabuleiro.campo .grama{
      position:absolute; left:0; right:0; bottom:0; height:34%;
      background:linear-gradient(180deg,#8FD89A 0%,#5FBF7A 100%);
      border-radius:44% 44% 0 0 / 22% 22% 0 0;
    }

    /* os pôneis brincando: retratos redondos, com pulinho próprio */
    #tabuleiro.campo .brincando{
      position:absolute; left:5%; right:5%; top:16%;
      display:flex; justify-content:center; align-items:center; gap:4%;
      z-index:4;
    }
    #tabuleiro.campo .poneiCampo{
      width:20%; max-width:78px; aspect-ratio:1;
      animation:pulinho 1.1s ease-in-out infinite alternate;
      transition:transform .5s ease, opacity .5s ease;
    }
    #tabuleiro.campo .poneiCampo img{
      width:100%; height:100%; border-radius:50%;
      object-fit:cover; object-position:center 30%;
      border:3px solid #fff; box-sizing:border-box;
      box-shadow:0 3px 8px rgba(40,80,60,.35);
    }
    @keyframes pulinho{
      from{ transform:translateY(0)    rotate(-3deg); }
      to  { transform:translateY(-9px) rotate(3deg); }
    }

    /* o que sumiu vira um lugar vazio, não um buraco: ela precisa ver
       que ALGUÉM estava ali */
    #tabuleiro.campo .poneiCampo.sumindo{ animation:sumiuPuf .5s ease-in forwards; }
    @keyframes sumiuPuf{
      0%  { transform:scale(1)   rotate(0);    opacity:1; }
      100%{ transform:scale(.25) rotate(18deg); opacity:0; }
    }
    #tabuleiro.campo .poneiCampo.vaga{
      animation:none;
      border-radius:50%; border:3px dashed #fff;
      background:rgba(255,255,255,.35);
      display:flex; align-items:center; justify-content:center;
      font-family:'Baloo 2',cursive; font-weight:800;
      font-size:clamp(20px,6vw,34px); color:#fff;
      text-shadow:0 2px 4px rgba(40,80,60,.5);
    }

    /* a rajada de folhas que cobre o campo na hora do sumiço */
    #tabuleiro.campo .folha{
      position:absolute; z-index:6; font-size:22px; pointer-events:none;
      animation:folhaVoa 1.5s ease-in forwards;
    }
    @keyframes folhaVoa{
      0%  { transform:translate(-30px,0) rotate(0);      opacity:0; }
      20% { opacity:1; }
      100%{ transform:translate(120px,-24px) rotate(320deg); opacity:0; }
    }

    /* as três respostas, em retrato redondo como no campo */
    #opcoes .opcao{
      border:0; padding:0; background:none; cursor:pointer;
      border-radius:50%; overflow:hidden; aspect-ratio:1;
      box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(62,42,92,.3);
      transition:transform .25s ease, opacity .25s ease;
    }
    #opcoes .opcao img{
      width:100%; height:100%; display:block;
      object-fit:cover; object-position:center 30%;
    }
    #opcoes .opcao.certa{ box-shadow:0 0 0 4px #FFC93C, 0 0 22px rgba(255,201,60,.9); }
    #opcoes .opcao.errada{ animation:tremeOpcao .45s ease; }
    @keyframes tremeOpcao{
      0%,100%{ transform:translateX(0); }
      25%    { transform:translateX(-8px) rotate(-4deg); }
      75%    { transform:translateX(8px)  rotate(4deg); }
    }
    #opcoes .opcao.apagada{ opacity:.35; transform:scale(.92); }
  `;
  document.head.appendChild(st);
})();

function novaRodadaSumiu(){
  limpaTimers();
  sTravado = true;
  sRodada++;
  sGrupo = elenco();

  const n = Math.min(quantosNaMesa(), sGrupo.length - 2);
  sMesa = [];
  while(sMesa.length < n){
    const p = sorteia(sGrupo);
    if(!sMesa.includes(p)) sMesa.push(p);
  }
  sAlvo = sorteia(sMesa);

  el('balaoSumiu').textContent = 'Os pôneis estão brincando…';
  el('rotuloOpcoes').textContent = '';
  el('opcoes').innerHTML = '';

  montaCampo();

  depois(()=>{ el('balaoSumiu').textContent = 'Olha bem quem está aqui!'; }, 1800);

  depois(()=>{ rajada(); }, 3200);

  /* o sumiço acontece no meio da rajada: as folhas cobrem o momento,
     que é o que dá a sensação de mágica em vez de o pônei só apagar */
  depois(()=>{
    const alvoEl = [...el('tabuleiro').querySelectorAll('.poneiCampo')]
      .find(d => d.dataset.nome === sAlvo.nome);
    if(alvoEl){
      bip([520,380],.12);
      alvoEl.classList.add('sumindo');
      depois(()=>{
        alvoEl.classList.remove('sumindo');
        alvoEl.classList.add('vaga');
        alvoEl.innerHTML = '?';
      }, 500);
    }
  }, 3800);

  depois(()=>{
    el('balaoSumiu').textContent = 'Quem sumiu?';
    el('rotuloOpcoes').textContent = 'Toque no pônei que faltou';
    montaOpcoes();
    sTravado = false;
  }, 4800);
}

function montaCampo(){
  const campo = el('tabuleiro');
  campo.innerHTML = '';
  campo.classList.add('campo');
  campo.insertAdjacentHTML('beforeend', '<div class="ceuCampo"></div><div class="grama"></div>');

  const brincando = document.createElement('div');
  brincando.className = 'brincando';
  sMesa.forEach((p, i)=>{
    const d = document.createElement('div');
    d.className = 'poneiCampo';
    d.dataset.nome = p.nome;
    d.style.animationDelay = (i * .21) + 's';
    d.innerHTML = retrato(p);
    brincando.appendChild(d);
  });
  campo.appendChild(brincando);
}

/* folhas de verdade não existem na pasta, e emoji aqui funciona:
   é elemento de passagem, não personagem */
function rajada(){
  const campo = el('tabuleiro');
  const folhas = ['🍃','🌿','🍂','🌸'];
  for(let i = 0; i < 14; i++){
    const f = document.createElement('div');
    f.className = 'folha';
    f.textContent = sorteia(folhas);
    f.style.left = (Math.random() * 70) + '%';
    f.style.top  = (10 + Math.random() * 60) + '%';
    f.style.animationDelay = (Math.random() * .7).toFixed(2) + 's';
    campo.appendChild(f);
    setTimeout(()=> f.remove(), 2400);
  }
}

function montaOpcoes(){
  const escolhas = [sAlvo];
  const fora = sGrupo.filter(p => !sMesa.includes(p));
  while(escolhas.length < 3 && escolhas.length - 1 < fora.length){
    const p = sorteia(fora);
    if(!escolhas.includes(p)) escolhas.push(p);
  }
  escolhas.sort(()=> Math.random() - .5);

  const box = el('opcoes');
  box.innerHTML = '';
  escolhas.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'opcao';
    b.setAttribute('aria-label', p.nome);
    b.innerHTML = retrato(p);
    b.addEventListener('click', ()=> respondeSumiu(p, b));
    box.appendChild(b);
  });
}

function respondeSumiu(p, botao){
  if(sTravado) return;

  if(p !== sAlvo){
    /* errar não encerra nada: sacode e ela tenta de novo */
    botao.classList.remove('errada');
    void botao.offsetWidth;
    botao.classList.add('errada');
    bip([300,240],.14);
    return;
  }

  sTravado = true;
  estrelas++;
  el('placar').textContent = estrelas;

  botao.classList.add('certa');
  [...el('opcoes').querySelectorAll('.opcao')].forEach(c=>{
    if(c !== botao) c.classList.add('apagada');
  });

  /* o lugar vazio recebe de volta quem estava ali: fecha a história */
  const vaga = el('tabuleiro').querySelector('.poneiCampo.vaga');
  if(vaga){
    vaga.classList.remove('vaga');
    vaga.innerHTML = retrato(sAlvo);
  }

  el('balaoSumiu').textContent = (sAlvo.art === 'a' ? 'Era a ' : 'Era o ') + sAlvo.nome + '!';
  el('rotuloOpcoes').textContent = '';
  bip([660,880,1180],.11);
  festa(botao);

  /* uma rodada certa = uma fase. O contaDesafio entrega o prêmio e o
     album.js devolve ela ao mapa; só se o prêmio não existir é que a
     próxima rodada é marcada aqui. */
  const premiando = contaDesafio();
  if(!premiando) depois(novaRodadaSumiu, 2600);
}

/* ===================================================================
   ABERTURA

   Havia uma tela intermediária aqui — título, vitrine girando e dois
   botões — que o menu já tornara inútil: o endereço dizia qual modo
   abrir, então ela era montada e pulada por um clique programático.
   Aparecia por um instante em toda abertura, e quem entrasse direto
   pelo endereço via o piscar de uma tela que não servia para nada.

   Foi removida do HTML. Agora o modo vem do endereço e o jogo começa
   nele, sem intermediária. Sem modo no endereço, abre o "Cadê o
   Pônei?", que é o principal.
   =================================================================== */
function abreModo(modo){
  limpaTimers();
  el('jogo').classList.add('escondida');
  el('sumiu').classList.add('escondida');

  if(modo === 'sumiu'){
    el('sumiu').classList.remove('escondida');
    sRodada = 0;
    depois(novaRodadaSumiu, 500);
    return;
  }

  el('jogo').classList.remove('escondida');
  rodada = 0;
  /* a trilha é montada antes da primeira pergunta: ela precisa ver o
     castelo lá no fim desde o começo, senão não há para onde ir */
  if(typeof iniciaCaminho === 'function') iniciaCaminho(el('jogo'));
  setTimeout(novaRodada, 500);
}

const modoDireto = new URLSearchParams(location.search).get('modo') === 'sumiu'
  ? 'sumiu' : 'cade';

abreModo(modoDireto);

/* casa é sempre o mapa: não há mais tela intermediária para voltar */
el('btnCasa').addEventListener('click', ()=>{
  travado = true;
  sTravado = true;
  limpaTimers();
  location.href = 'index.html';
});
