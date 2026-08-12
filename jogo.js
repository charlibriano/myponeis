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
  mesa.innerHTML = '';
  sMesa.forEach(p=>{
    const d = document.createElement('div');
    d.className = 'carta fixa';
    d.dataset.nome = p.nome;
    d.innerHTML = retrato(p);
    mesa.appendChild(d);
  });

  fala('Olha bem nos pôneis!');

  depois(()=>{
    const alvoEl = [...mesa.children].find(c => c.dataset.nome === sAlvo.nome);
    if(alvoEl){
      bip([520,380],.12);
      festa(alvoEl);
      alvoEl.classList.add('sumindo');
      depois(()=>{
        alvoEl.classList.remove('sumindo','fixa');
        alvoEl.classList.add('vazia');
        alvoEl.innerHTML = '<span class="interrogacao">?</span>';
      }, 520);
    }
    depois(()=>{
      el('balaoSumiu').textContent = 'Quem sumiu?';
      el('rotuloOpcoes').textContent = 'Toque no pônei que faltou';
      fala('Quem sumiu?');
      montaOpcoes();
      sTravado = false;
    }, 900);
  }, 4500);
}

function montaOpcoes(){
  const escolhas = [sAlvo];
  const fora = sGrupo.filter(p => !sMesa.includes(p));
  while(escolhas.length < 3 && escolhas.length - 1 < fora.length){
    const p = sorteia(fora);
    if(!escolhas.includes(p)) escolhas.push(p);
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
    const vazia = document.querySelector('#tabuleiro .vazia');
    if(vazia){ vazia.classList.remove('vazia'); vazia.classList.add('fixa','certa'); vazia.innerHTML = retrato(sAlvo); }
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
