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
   parecido com uma rodada de memória ou um labirinto. */
function contaDesafio(){
  if(typeof concluiuDesafio !== "function") return;
  if(estrelas === 0 || estrelas % 5 !== 0) return;
  const m = concluiuDesafio();
  if(m.completouAgora && typeof festejaMissao === "function") setTimeout(festejaMissao, 900);
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
    contaDesafio();
    botao.classList.add('certa');
    [...document.querySelectorAll('.carta')].forEach(c=>{ if(c!==botao) c.classList.add('apagada'); });
    bip([660,880,1180],.11);
    festa(botao);
    const elogios = ['Isso!','Muito bem!','Boa!','Você acertou!'];
    fala(sorteia(elogios) + ' ' + (alvo.art==='a'?'Essa é a ':'Esse é o ') + alvo.nome + '!');
    setTimeout(novaRodada, 2100);
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

/* --- vitrine da tela inicial --- */
function montaVitrine(){
  const p = sorteia(elenco());   // usa o mesmo filtro do jogo, senão a vitrine mostra SVG
  el('vitrine').innerHTML = retrato(p);
}
montaVitrine();
setInterval(()=>{ if(!el('inicio').classList.contains('escondida')) montaVitrine(); }, 2600);

/* ============================================================
   MODO 2 — QUEM SUMIU?
   Mostra um grupo de pôneis, um desaparece, ela diz quem era.
   ============================================================ */
let sTimers = [], sAlvo = null, sRodada = 0, sTravado = true, sGrupo = [], sMesa = [];
function limpaTimers(){ sTimers.forEach(clearTimeout); sTimers = []; }
function depois(fn, ms){ sTimers.push(setTimeout(fn, ms)); }

function quantosNaMesa(){
  if(sRodada <= 2) return 3;
  if(sRodada <= 5) return 4;
  if(sRodada <= 8) return 5;
  return 6;
}

/* ===================================================================
   QUEM SUMIU  —  encenação

   Antes eram figuras paradas num quadrado, sumindo: a mesma
   experiência do jogo da memória, com outro enunciado.

   Agora tem história. Os pôneis entram andando, brincam um pouco,
   entram na casinha, a porta fecha, e quando reabre eles voltam —
   menos um. O sumiço vira acontecimento, não troca de imagem.
   =================================================================== */

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

  el('balaoSumiu').textContent = 'Olha os pôneis!';
  el('rotuloOpcoes').textContent = '';
  el('opcoes').innerHTML = '';

  montaPalco(sMesa);

  // 1. entram andando, um atrás do outro
  depois(()=> entramEmCena(), 60);

  // 2. brincam à vista dela
  depois(()=>{ el('balaoSumiu').textContent = 'Olha bem…'; }, 1800);

  // 3. entram na casinha
  depois(()=>{
    el('balaoSumiu').textContent = 'Foram na casinha!';
    entramNaCasa();
  }, 4200);

  // 4. a porta fecha e sacode: é a hora em que alguém fica para trás
  depois(()=>{ el('casinha').classList.add('fechada'); bip([420,340],.14); }, 5600);

  // 5. voltam, menos um, e em ordem trocada
  depois(()=>{
    el('casinha').classList.remove('fechada');
    bip([620,820],.12);
    const restantes = sMesa.filter(p => p !== sAlvo).sort(()=>Math.random()-.5);
    montaPalco(restantes, true);
    depois(()=> entramEmCena(), 60);
  }, 6600);

  // 6. a pergunta
  depois(()=>{
    el('balaoSumiu').textContent = 'Quem sumiu?';
    el('rotuloOpcoes').textContent = 'Toque no pônei que faltou';
    montaOpcoes();
    sTravado = false;
  }, 8400);
}

/* monta o cenário: chão de grama, casinha à direita, pôneis fora de cena */
function montaPalco(lista, semCasa){
  const mesa = el('tabuleiro');
  mesa.innerHTML = '';
  mesa.classList.add('palco');

  if(!semCasa || !el('casinha')){
    mesa.insertAdjacentHTML('beforeend',
      '<div class="chao"></div>' +
      '<div class="casinha" id="casinha">' +
        '<div class="telhado"></div>' +
        '<div class="parede"><div class="porta"></div></div>' +
      '</div>');
  }else{
    mesa.insertAdjacentHTML('beforeend', '<div class="chao"></div>');
    const c = document.createElement('div');
    c.className = 'casinha'; c.id = 'casinha';
    c.innerHTML = '<div class="telhado"></div><div class="parede"><div class="porta"></div></div>';
    mesa.appendChild(c);
  }

  const trilha = document.createElement('div');
  trilha.className = 'trilha';
  lista.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'poneiPalco fora';
    d.dataset.nome = p.nome;
    d.style.setProperty('--atraso', (i * 0.18) + 's');
    d.innerHTML = '<div class="anda">' + retrato(p) + '</div>';
    trilha.appendChild(d);
  });
  mesa.appendChild(trilha);
}

function entramEmCena(){
  document.querySelectorAll('#tabuleiro .poneiPalco').forEach(d => d.classList.remove('fora'));
}

function entramNaCasa(){
  document.querySelectorAll('#tabuleiro .poneiPalco').forEach((d, i) => {
    depois(()=>{ d.classList.add('entrando'); bip([700],.06); }, i * 200);
  });
}

/* estilos da encenação, injetados daqui para não mexer no CSS do projeto */
(function estiloPalco(){
  if(document.getElementById('estiloPalco')) return;
  const st = document.createElement('style');
  st.id = 'estiloPalco';
  st.textContent = `
    #tabuleiro.palco{
      position:relative; display:block; overflow:hidden;
      min-height:190px; border-radius:22px;
      background:linear-gradient(180deg,#CDEEFF 0%, #E8F7FF 62%, #DFF3DC 62%, #CDEBC6 100%);
      box-shadow:inset 0 3px 10px rgba(80,120,160,.18);
    }
    #tabuleiro.palco .chao{
      position:absolute; left:0; right:0; bottom:0; height:38%;
      background:linear-gradient(180deg,#8FD68F 0%, #6EBE72 100%);
      border-top:4px solid #5FAE63;
    }

    /* casinha à direita: é para onde eles vão e de onde voltam */
    #tabuleiro.palco .casinha{
      position:absolute; right:4%; bottom:14%; width:86px; z-index:2;
      transition:transform .3s ease;
    }
    #tabuleiro.palco .telhado{
      width:0; height:0; margin:0 auto;
      border-left:47px solid transparent; border-right:47px solid transparent;
      border-bottom:34px solid #E0614F;
    }
    #tabuleiro.palco .parede{
      height:56px; background:#F6E7C8; border:3px solid #C9A87A;
      border-radius:0 0 8px 8px; position:relative;
    }
    #tabuleiro.palco .porta{
      position:absolute; left:50%; bottom:0; transform:translateX(-50%);
      width:34px; height:40px; border-radius:17px 17px 3px 3px;
      background:#8B5A2B;
      transition:transform .35s ease, background .35s ease;
      transform-origin:left center;
    }
    #tabuleiro.palco .casinha.fechada{ animation:casaSacode .5s ease-in-out; }
    #tabuleiro.palco .casinha.fechada .porta{ background:#5E3A18; }
    @keyframes casaSacode{
      0%,100%{ transform:translateX(0) rotate(0); }
      25%    { transform:translateX(-5px) rotate(-2deg); }
      75%    { transform:translateX(5px)  rotate(2deg); }
    }

    /* a fila de pôneis andando */
    #tabuleiro.palco .trilha{
      position:absolute; left:3%; right:26%; bottom:16%;
      display:flex; align-items:flex-end; gap:2%;
      z-index:3;
    }
    #tabuleiro.palco .poneiPalco{
      flex:1 1 0; max-width:78px; aspect-ratio:1;
      transition:transform .7s cubic-bezier(.3,1.1,.5,1), opacity .5s ease;
      transition-delay:var(--atraso, 0s);
    }
    /* fora de cena: esperando à esquerda */
    #tabuleiro.palco .poneiPalco.fora{ transform:translateX(-140%) ; opacity:0; }
    /* entrando na casinha: caminham para a direita e somem na porta */
    /* saindo da casinha: aparece pequeno lá na porta e cresce vindo */
    #tabuleiro.palco .poneiPalco.saindo{
      transform:translateX(320%) scale(.25); opacity:0;
    }
    #tabuleiro.palco .poneiPalco.entrando{
      transform:translateX(320%) scale(.25); opacity:0;
      transition:transform .8s ease-in, opacity .5s ease-in .3s;
      transition-delay:0s;
    }

    /* o gingado: quem anda balança */
    #tabuleiro.palco .anda{
      width:100%; height:100%;
      animation:gingado .55s ease-in-out infinite alternate;
    }
    @keyframes gingado{
      from{ transform:translateY(0)    rotate(-4deg); }
      to  { transform:translateY(-14%) rotate(4deg); }
    }
    #tabuleiro.palco .poneiPalco img{
      width:100%; height:100%; border-radius:50%;
      object-fit:cover; object-position:center 34%;
      border:3px solid #fff; box-sizing:border-box;
      box-shadow:0 3px 8px rgba(40,80,60,.35);
    }
    #tabuleiro.palco .poneiPalco svg{ width:100%; height:100%; }
  `;
  document.head.appendChild(st);
})();

function montaOpcoes(){
  /* Os pôneis errados agora vêm de QUEM ESTAVA NA MESA e continua lá.

     Antes eram sorteados entre os que nunca apareceram — então bastava
     apontar o único conhecido, sem lembrar de nada. Com todos vindos da
     mesa, ela precisa olhar quem sobrou e achar o ausente. É esse o
     jogo.

     Quantidade cresce com a rodada: 3 opções no começo, 4 depois. */
  const escolhas = [sAlvo];
  const aindaNaMesa = sMesa.filter(p => p !== sAlvo);
  const quantas = sRodada <= 3 ? 3 : 4;

  while(escolhas.length < quantas && escolhas.length - 1 < aindaNaMesa.length){
    const p = sorteia(aindaNaMesa);
    if(!escolhas.includes(p)) escolhas.push(p);
  }

  // mesa pequena demais para encher as opções: completa com os de fora
  if(escolhas.length < 3){
    const fora = sGrupo.filter(p => !sMesa.includes(p));
    while(escolhas.length < 3 && fora.length){
      const p = sorteia(fora);
      if(!escolhas.includes(p)) escolhas.push(p);
    }
  }
  escolhas.sort(()=>Math.random()-.5);

  const box = el('opcoes');
  box.innerHTML = '';
  escolhas.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'carta opcao';
    b.setAttribute('aria-label', p.nome);
    b.innerHTML = retrato(p);
    b.addEventListener('click', ()=>respondeSumiu(p, b));
    box.appendChild(b);
  });
}

function respondeSumiu(p, botao){
  if(sTravado) return;
  if(p === sAlvo){
    sTravado = true;
    estrelas++;
    el('placar').textContent = estrelas;
    contaDesafio();
    botao.classList.add('certa');
    [...document.querySelectorAll('#opcoes .carta')].forEach(c=>{ if(c!==botao) c.classList.add('apagada'); });
    /* o pônei que faltava sai da casinha e volta para a fila. Fecha a
       história: ele estava lá dentro o tempo todo. */
    const trilha = document.querySelector('#tabuleiro .trilha');
    if(trilha){
      const d = document.createElement('div');
      d.className = 'poneiPalco saindo';
      d.dataset.nome = sAlvo.nome;
      d.innerHTML = '<div class="anda">' + retrato(sAlvo) + '</div>';
      trilha.appendChild(d);
      depois(()=>{ d.classList.remove('saindo'); festa(d); }, 60);
    }

    bip([660,880,1180],.11);
    festa(botao);
    fala(sorteia(['Isso!','Muito bem!','Boa!','Acertou!']) + ' ' + (sAlvo.art==='a'?'Era a ':'Era o ') + sAlvo.nome + '!');
    depois(novaRodadaSumiu, 2600);
  }else{
    botao.classList.remove('errada');
    void botao.offsetWidth;
    botao.classList.add('errada');
    bip([300,240],.14);
    fala('Esse não. Quem sumiu?');
  }
}

/* --- botões --- */
el('btnJogar').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('jogo').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  setTimeout(novaRodada, 600);   // 1400 era espera da fala de abertura
});

/* O botão de status da voz e o de repetir a fala não têm mais função:
   as falas foram removidas. Some com os dois em vez de deixá-los na
   tela sem fazer nada — o de status ainda mostrava um diagnóstico de
   voz por cima do jogo. */
['btnStatus', 'btnFalar'].forEach(id => {
  const b = el(id);
  if(b) b.style.display = 'none';
});
el('btnSumiu').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('sumiu').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  sRodada = 0;
  testaVoz();
  depois(novaRodadaSumiu, 1400);
});

/* ---------- entrada direta a partir do menu ----------
   O menu tem um botão para cada modo, e antes os dois caíam nesta
   tela de escolha, obrigando a criança a escolher duas vezes.
   Agora o endereço diz qual modo abrir: ?modo=cade ou ?modo=sumiu.

   Guardamos se veio assim para o botão de casa devolver ao menu dos
   jogos, e não a esta tela intermediária que ela nunca viu. */
const modoDireto = new URLSearchParams(location.search).get('modo');

if(modoDireto === 'cade' || modoDireto === 'sumiu'){
  // o clique programático reusa exatamente o mesmo caminho do botão
  setTimeout(()=>{
    el(modoDireto === 'cade' ? 'btnJogar' : 'btnSumiu').click();
  }, 60);
}

el('btnCasa').addEventListener('click', ()=>{
  // veio direto do menu? então casa é o menu, não a tela de escolha
  if(modoDireto === 'cade' || modoDireto === 'sumiu'){
    location.href = 'index.html';
    return;
  }
  travado = true;
  sTravado = true;
  limpaTimers();
  el('jogo').classList.add('escondida');
  el('sumiu').classList.add('escondida');
  el('inicio').classList.remove('escondida');
  el('btnCasa').classList.add('escondida');
  rodada = 0;
  sRodada = 0;
});


/* --- aviso discreto de quais pôneis ainda estão sem imagem --- */
(function mostraRelatorio(){
  const alvo = el('relatorio');
  if(!alvo) return;
  const r = relatorioImagens();
  if(r.com === 0){ alvo.textContent = 'Desenhos em SVG (nenhuma imagem carregada ainda)'; return; }
  if(r.sem.length === 0){ alvo.textContent = r.com + ' pôneis com imagem'; return; }
  alvo.textContent = r.com + '/' + r.total + ' com imagem — toque para ver quem falta';
  alvo.style.cursor = 'pointer';
  alvo.addEventListener('click', ()=>avisa('Sem imagem (usando desenho): ' + r.sem.join(', ')));
})();
