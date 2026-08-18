/* ============================================================
   O CAMPO DA ESCOLHA — tela do "Cadê o Pônei?"

   Os pôneis ficam espalhados pelo campo, cada um trocando de lugar
   sozinho a cada três segundos. Antes era uma grade: com 3 pôneis
   sobrava uma carta órfã na fila de baixo e nada se movia.

   ESTE ARQUIVO JÁ TEVE A CAMINHADA ATÉ O CASTELO. Ela foi removida,
   não escondida: com uma fase por acerto o viajante nunca passava do
   primeiro passo, e quem mostra o avanço agora é o mapa de Ponyville.
   Ficaram só o campo e a folha de estilo dele.

   Não altera o jogo.js: envolve o novaRodada por fora e só posiciona
   as cartas que ele já montou. Carregue depois do jogo.js.
   ============================================================ */

const INTERVALO_DERIVA = 3000;   // ms entre uma andança e outra
let relogioDeriva = null;

function injetaEstiloCampo(){
  if(document.getElementById('estiloCampo')) return;
  const s = document.createElement('style');
  s.id = 'estiloCampo';
  s.textContent = `
    #jogo .cartas, #jogo .cartas.duas{
      display:block; position:relative;
      flex:1; min-height:0;
      border-radius:20px; overflow:hidden;
      background:
        radial-gradient(circle at 18% 20%, rgba(255,255,255,.5) 0 3%, transparent 4%),
        radial-gradient(circle at 76% 32%, rgba(255,255,255,.4) 0 2.5%, transparent 3.5%),
        linear-gradient(180deg, #CFEEFF 0%, #DFF4FF 54%, #9FDCAE 54.1%, #7CC98D 100%);
      box-shadow:inset 0 2px 10px rgba(74,42,135,.12);
    }

    /* Largura amarrada à TELA (vw), não ao container: o container muda
       de altura conforme o conteúdo, e em % o medalhão mudava de
       tamanho junto. 'left' e 'top' só mudam de 3 em 3 segundos, então
       o custo de layout é irrelevante. */
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
    /* 30%: as imagens da wiki são de corpo inteiro, e num círculo
       grande o enquadramento do menu cortava a cabeça */
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

/* Os limites deixam de fora a faixa que o próprio medalhão ocupa,
   senão metade dele sai pela borda. A separação é generosa porque com
   seis pôneis eles se encavalavam. */
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

function instalaCampo(){
  injetaEstiloCampo();

  if(typeof novaRodada !== 'function'){
    if(typeof avisa === 'function') avisa('O caminho.js precisa vir depois do jogo.js.');
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

if(document.readyState === 'loading') addEventListener('DOMContentLoaded', instalaCampo);
else instalaCampo();

addEventListener('resize', espalhaCampo);
