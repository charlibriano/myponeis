/* ============================================================
   SONS DO JOGO

   As falas foram removidas. Nem voz sintética, nem áudio gravado.

   Este arquivo mantém os nomes que o resto do código chama —
   fala(), avisa(), marcaStatus() e companhia — para que nenhuma
   página quebre. Eles simplesmente não fazem nada.

   O que continua funcionando: os efeitos sonoros dos jogos.
   ============================================================ */

const _el = id => document.getElementById(id);

/* ---------- efeitos sonoros ---------- */
let ctx = null;
function bip(freqs, dur = .12){
  try{
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const t = ctx.currentTime + i * dur;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.25, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
    });
  }catch(e){}
}

const somToque   = () => bip([700], .07);
const somAchou   = () => bip([784, 988, 1319], .12);
const somErrou   = () => bip([330, 262], .14);
const somVitoria = () => bip([523, 659, 784, 1047, 784, 1047], .15);
const somComeco  = () => bip([523, 659, 784], .10);

/* ---------- textos de elogio ----------
   Continuam existindo porque algumas telas os exibem escritos. */
const ELOGIOS    = ['Isso!', 'Muito bem!', 'Boa!', 'Achou!', 'Que legal!', 'Você conseguiu!'];
const INCENTIVOS = ['Tenta de novo.', 'Quase!', 'Procura mais um pouquinho.', 'Vai achar!'];
const escolhe = a => a[Math.floor(Math.random() * a.length)];

/* ---------- funções de voz, agora vazias ----------
   Mantidas só para o resto do código continuar chamando sem erro. */
function fala(){}
function falaGravada(){ return false; }
function paraAudio(){}
function testaVoz(){}
function trocaVoz(){ return false; }
function escolheVoz(){}
function vozLigada(){ return false; }
function ligaDesligaVoz(){}
function marcaStatus(){}

/* avisa() ainda serve: é a barra de erro na tela, que não tem
   relação com voz e continua útil para diagnóstico */
function avisa(txt){
  const r = _el('recado');
  if(!r) return;
  if(!txt){ r.classList.add('escondida'); return; }
  r.textContent = txt;
  r.classList.remove('escondida');
}

/* ---------- limpeza da barra ----------
   Os botões de voz ficaram órfãos nas páginas. Em vez de pedir para
   reenviar seis HTML só por causa deles, escondemos daqui. */
addEventListener('DOMContentLoaded', () => {
  ['btnStatus', 'btnTrocaVoz', 'btnVozLigada'].forEach(id => {
    const b = _el(id);
    if(b) b.style.display = 'none';
  });
  const r = _el('recado');
  if(r) r.addEventListener('click', () => avisa(''));
});
