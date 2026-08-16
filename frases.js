/* ============================================================
   COMPATIBILIDADE — o que sobrou da remoção das falas

   Quando as falas saíram, este arquivo foi esvaziado, mas as páginas
   continuaram chamando o que morava aqui: escolhe(), ELOGIOS,
   INCENTIVOS, e os sons somAchou/somErrou/somComeco.

   Chamada a função inexistente não é aviso: é erro que MATA a linha
   e todas as seguintes do mesmo bloco. Foi o que quebrou o jogo da
   memória — o par era marcado, o somAchou() estourava, e a linha
   logo abaixo, que verificava se a fase acabou, nunca rodava. As
   cartas ficavam abertas para sempre.

   Aqui cada nome órfão ganha uma definição de verdade. Os sons são
   gerados na hora pelo próprio navegador, sem arquivo para baixar.

   Tudo é definido só SE ainda não existir: se o voz.js já tiver a
   versão boa de alguma dessas funções, ela é que vale. Por isso
   nada aqui usa 'const' no escopo global — declarar de novo o que
   o voz.js já declarou derrubaria o arquivo inteiro.

   As falas continuam removidas: fala() existe e não faz nada. É de
   propósito, para as páginas poderem chamá-la sem quebrar.
   ============================================================ */

(function(){

  /* ---------- sons curtos, gerados pelo navegador ---------- */
  let ctxSom = null;
  function toca(freqs, dur){
    dur = dur || .12;
    try{
      ctxSom = ctxSom || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ctxSom.createOscillator(), g = ctxSom.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        const t = ctxSom.currentTime + i * dur;
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.25, t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g).connect(ctxSom.destination);
        o.start(t); o.stop(t + dur + .02);
      });
    }catch(e){}
  }

  function poe(nome, valor){
    if(typeof window[nome] === 'undefined') window[nome] = valor;
  }

  poe('somToque',   function(){ toca([520], .07); });
  poe('somCarta',   function(){ toca([440, 620], .07); });
  poe('somAchou',   function(){ toca([660, 880, 1180], .11); });
  poe('somErrou',   function(){ toca([300, 240], .14); });
  poe('somErro',    function(){ toca([300, 240], .14); });
  poe('somComeco',  function(){ toca([440, 550, 660], .10); });
  poe('somVitoria', function(){ toca([660, 780, 990, 1320], .13); });

  /* ---------- listas e utilidades que moravam aqui ---------- */
  poe('escolhe', function(lista){
    if(!Array.isArray(lista) || !lista.length) return '';
    return lista[Math.floor(Math.random() * lista.length)];
  });

  poe('ELOGIOS',    ['Isso!', 'Muito bem!', 'Boa!', 'Você acertou!', 'Que legal!']);
  poe('INCENTIVOS', ['Quase!', 'Tenta de novo!', 'Você consegue!', 'Vai lá!']);
  poe('APLAUSOS',   ['Parabéns!', 'Você conseguiu!', 'Que campeã!']);

  /* ---------- as falas continuam removidas ----------
     fala() existe e não fala: as páginas chamam em vários pontos, e
     sem esta definição cada chamada derrubaria o bloco onde está. */
  poe('fala', function(){});

})();
