/* ============================================================
   CENÁRIO DA ESCOLHA — a grade de cartas vira um lugar

   A escolha era uma grade: quadrados brancos iguais em 2, 3, 4 e 6.
   Com 3 sobrava uma carta órfã na fila de baixo, e nada se movia —
   aos 4 anos isso é formulário, não brincadeira.

   Aqui as mesmas cartas passam a ficar espalhadas pelo campo, cada
   uma flutuando no seu ritmo e trocando de lugar sozinha. Número
   ímpar nunca fica torto, porque não existe mais fila.

   Não altera o jogo.js: envolve o novaRodada por fora e só muda a
   POSIÇÃO das cartas que ele já montou. Os cliques, o acerto, o erro
   e o prêmio continuam sendo tratados lá dentro, sem cópia de lógica.

   Carregue DEPOIS do jogo.js.
   ============================================================ */

(function(){

  const INTERVALO_DERIVA = 3000;   // ms entre uma andança e outra
  let relogioDeriva = null;

  function injetaEstiloCenario(){
    if(document.getElementById('estiloCenario')) return;
    const s = document.createElement('style');
    s.id = 'estiloCenario';
    s.textContent = `
      /* o container deixa de ser grade e vira campo */
      #jogo .cartas, #jogo .cartas.duas{
        display:block !important;
        position:relative;
        flex:1; min-height:0;
        border-radius:20px;
        overflow:hidden;
        background:
          radial-gradient(circle at 18% 22%, rgba(255,255,255,.55) 0 3%, transparent 4%),
          radial-gradient(circle at 76% 34%, rgba(255,255,255,.45) 0 2.5%, transparent 3.5%),
          linear-gradient(180deg, #CFEEFF 0%, #DFF4FF 54%, #9FDCAE 54.1%, #7CC98D 100%);
        box-shadow:inset 0 2px 10px rgba(74,42,135,.12);
      }

      /* a carta vira um medalhão que mora em qualquer ponto do campo.
         'left' e 'top' só mudam de 3 em 3 segundos, então o custo de
         layout é irrelevante; o que roda a cada quadro é o flutuar,
         que já era transform e continua na placa de vídeo. */
      #jogo .cartas .carta{
        position:absolute;
        width:clamp(66px, 23%, 104px);
        height:auto; aspect-ratio:1/1;
        padding:0; margin:0;
        border-radius:50%;
        background:#fff;
        box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(62,42,92,.32);
        transition:left 2.6s ease-in-out, top 2.6s ease-in-out,
                   transform .3s ease, opacity .3s ease;
        overflow:hidden;
      }
      #jogo .cartas .carta img{
        width:100%; height:100%;
        object-fit:cover; object-position:center 34%;
        padding:0; border-radius:50%;
      }
      #jogo .cartas .carta svg{ width:100%; height:100%; }

      /* o errado se sacode e foge — nada de vermelho, nada de derrota */
      #jogo .cartas .carta.errada{ animation:fugiu .45s ease; }
      @keyframes fugiu{
        0%,100%{ transform:rotate(0); }
        25%    { transform:rotate(-11deg); }
        70%    { transform:rotate(11deg); }
      }
      #jogo .cartas .carta.certa{
        z-index:3;
        box-shadow:0 0 0 4px #FFC93C, 0 0 22px rgba(255,201,60,.9);
      }
    `;
    document.head.appendChild(s);
  }

  /* Sorteia pontos que não se encostam. Se não achar lugar folgado
     depois de muitas tentativas, aceita o que tem: melhor dois pôneis
     próximos do que a rodada travada esperando posição perfeita. */
  function pontos(n){
    const lista = [];
    let tentativas = 0;
    while(lista.length < n && tentativas < 600){
      tentativas++;
      const x = 3 + Math.random() * 68;
      const y = 4 + Math.random() * 62;
      const longe = lista.every(p => Math.abs(p.x - x) > 22 || Math.abs(p.y - y) > 26);
      if(longe) lista.push({ x, y });
    }
    while(lista.length < n){
      lista.push({ x: 3 + Math.random() * 68, y: 4 + Math.random() * 62 });
    }
    return lista;
  }

  function espalha(){
    const campo = document.getElementById('cartas');
    if(!campo) return;
    const itens = campo.querySelectorAll('.carta');
    if(!itens.length) return;
    const locais = pontos(itens.length);
    itens.forEach((c, i) => {
      c.style.left = locais[i].x + '%';
      c.style.top  = locais[i].y + '%';
    });
  }

  /* O pônei errado troca de lugar. Isso muda a tela na hora de tentar
     de novo, então a segunda tentativa não é idêntica à primeira —
     é o que evita a sensação de estar preso na mesma pergunta. */
  function fogeDoErro(){
    const campo = document.getElementById('cartas');
    if(!campo) return;
    campo.addEventListener('click', ev => {
      const carta = ev.target.closest('.carta');
      if(!carta) return;
      const chamado = document.getElementById('nome');
      if(!chamado) return;
      if(carta.getAttribute('aria-label') === chamado.textContent) return;
      setTimeout(() => {
        const l = pontos(1)[0];
        carta.style.left = l.x + '%';
        carta.style.top  = l.y + '%';
      }, 480);
    });
  }

  /* ---------- envolve o novaRodada do jogo.js ---------- */
  function instala(){
    if(typeof novaRodada !== 'function'){
      if(typeof avisa === 'function'){
        avisa('O cenario.js precisa ser carregado depois do jogo.js.');
      }
      return;
    }
    injetaEstiloCenario();
    fogeDoErro();

    const original = novaRodada;
    window.novaRodada = function(){
      clearInterval(relogioDeriva);
      original.apply(this, arguments);   // o jogo.js monta as cartas como sempre
      espalha();                          // e aqui elas ganham lugar no campo
      relogioDeriva = setInterval(espalha, INTERVALO_DERIVA);
    };

    /* se a rodada já estava montada quando este arquivo entrou */
    if(document.querySelectorAll('#cartas .carta').length){
      espalha();
      relogioDeriva = setInterval(espalha, INTERVALO_DERIVA);
    }
  }

  if(document.readyState === 'loading') addEventListener('DOMContentLoaded', instala);
  else instala();

})();