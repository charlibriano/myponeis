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

  el('balaoSumiu').textContent = 'Olha bem…';
  el('rotuloOpcoes').textContent = '';
  el('opcoes').innerHTML = '';

  const mesa = el('tabuleiro');
  desenhaMesa(sMesa);

  /* ANTES: aqui o jogo disparava faíscas e um som em cima do pônei
     escolhido, um instante antes de ele sumir. Era só olhar onde
     brilhou. Agora nada distingue o alvo enquanto todos estão à vista. */

  depois(()=>{
    fechaCortina(()=>{
      // a nuvem cobre a mesa; a troca acontece escondida
      const restantes = sMesa.filter(p => p !== sAlvo);
      restantes.sort(()=>Math.random()-.5);   // embaralha: o buraco entregaria a posição
      desenhaMesa(restantes);
    }, ()=>{
      el('balaoSumiu').textContent = 'Quem sumiu?';
      el('rotuloOpcoes').textContent = 'Toque no pônei que faltou';
      montaOpcoes();
      sTravado = false;
    });
  }, 4200);
}

/* desenha os pôneis da mesa */
function desenhaMesa(lista){
  const mesa = el('tabuleiro');
  mesa.innerHTML = '';
  lista.forEach(p=>{
    const d = document.createElement('div');
    d.className = 'carta fixa';
    d.dataset.nome = p.nome;
    d.innerHTML = retrato(p);
    mesa.appendChild(d);
  });
}

/* ---------- a nuvem que cobre a mesa ----------
   Some com todos ao mesmo tempo, e não com um só. Assim o momento do
   sumiço não denuncia quem sumiu, e a mesa pode ser reorganizada por
   trás sem que ela veja de onde o buraco saiu. */
function fechaCortina(duranteEscondido, aoAbrir){
  const mesa = el('tabuleiro');
  if(getComputedStyle(mesa).position === 'static') mesa.style.position = 'relative';

  const c = document.createElement('div');
  c.className = 'cortina';
  c.innerHTML =
    '<div class="nuvem n1"></div><div class="nuvem n2"></div><div class="nuvem n3"></div>' +
    '<div class="magia">✨</div>';
  mesa.appendChild(c);

  bip([440, 560], .12);

  depois(()=>{
    c.classList.add('cheia');
    if(typeof duranteEscondido === 'function') duranteEscondido();
    depois(()=>{
      c.classList.add('abrindo');
      bip([660, 880], .12);
      depois(()=>{
        c.remove();
        if(typeof aoAbrir === 'function') aoAbrir();
      }, 620);
    }, 700);
  }, 60);
}

/* estilos da nuvem, injetados daqui para não precisar mexer no CSS */
(function estiloCortina(){
  if(document.getElementById('estiloCortina')) return;
  const st = document.createElement('style');
  st.id = 'estiloCortina';
  st.textContent = `
    .cortina{ position:absolute; inset:-8px; z-index:20; pointer-events:none; overflow:hidden; }
    .cortina .nuvem{
      position:absolute; border-radius:50%;
      background:radial-gradient(circle at 40% 34%, #fff 0%, #EEF6FF 70%);
      box-shadow:0 6px 20px rgba(80,110,160,.28);
      opacity:0; transform:scale(.2);
      transition:opacity .5s ease, transform .6s cubic-bezier(.2,1.3,.4,1);
    }
    .cortina .n1{ left:-8%;  top:-16%; width:74%; height:96%; }
    .cortina .n2{ left:28%;  top:-26%; width:78%; height:112%; transition-delay:.08s; }
    .cortina .n3{ left:8%;   top:14%;  width:88%; height:96%;  transition-delay:.16s; }
    .cortina.cheia .nuvem{ opacity:1; transform:scale(1); }
    .cortina .magia{
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-size:44px; opacity:0; transition:opacity .3s ease, transform .5s ease;
      transform:scale(.4) rotate(-25deg);
    }
    .cortina.cheia .magia{ opacity:1; transform:scale(1) rotate(0); }
    .cortina.abrindo .nuvem{ opacity:0; transform:scale(1.5) translateY(-14%); }
    .cortina.abrindo .magia{ opacity:0; transform:scale(2) rotate(20deg); }
    .carta.voltando{ animation:poneiVolta .55s cubic-bezier(.2,1.6,.4,1) both; }
    @keyframes poneiVolta{
      0%  { transform:scale(.2) rotate(-25deg); opacity:0; }
      100%{ transform:scale(1) rotate(0); opacity:1; }
    }
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
    /* o pônei volta para a mesa, entrando com destaque. A lacuna com "?"
       não existe mais: a mesa é redesenhada sem buraco, senão a posição
       vazia entregaria a resposta. */
    const mesa = el('tabuleiro');
    const d = document.createElement('div');
    d.className = 'carta fixa certa voltando';
    d.dataset.nome = sAlvo.nome;
    d.innerHTML = retrato(sAlvo);
    mesa.appendChild(d);

    bip([660,880,1180],.11);
    festa(botao);
    festa(d);
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
