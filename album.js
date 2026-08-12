/* ============================================================
   ÁLBUM DE PÔNEIS  —  o motivo para voltar amanhã

   Aos 4 anos, contador de pontos não motiva: ela não lê números
   e eles somem quando fecha o navegador. Colecionar, sim.
   Cada vitória entrega uma pônei que fica sendo dela.

   Guardado em localStorage, ou seja: fica no aparelho dela,
   não some ao fechar, e não depende de servidor nem de conta.

   Usado por memoria.html, labirinto.html, poneis.html e album.html.
   Basta incluir <script src="album.js"></script> e chamar premiar().
   ============================================================ */

const ALBUM_CHAVE = "poneis.album.v1";

/* O álbum é uma seleção fechada, não a pasta inteira de 210.
   Colecionar precisa de fim à vista: 32 é alcançável em semanas,
   210 seria desanimador. Todas conferidas: têm imagem na pasta. */
const ALBUM = [
  "Rarity", "Princesa Celestia", "Princesa Cadance", "Princesa Ember",
  "Flurry Heart", "Apple Bloom", "Sweetie Belle", "Scootaloo",
  "Big McIntosh", "Trixie", "Diamond Tiara", "Silver Spoon",
  "Cheerilee", "Lyra Heartstrings", "Octavia Melody", "DJ Pon-3",
  "Babs Seed", "Coco Pommel", "Sunburst", "Zephyr Breeze",
  "Twist", "Pipsqueak", "Gilda", "Smolder",
  "Winona", "Tank", "Owlowiscious", "Rainha Chrysalis",
  "Discórdia", "Rei Sombra", "Tempest Shadow", "Songbird Serenade"
];

const imgDoAlbum = nome => "imagens/" + encodeURIComponent(nome) + ".png";

/* ---------- guardar e ler ---------- */
function colecao(){
  try{
    const bruto = localStorage.getItem(ALBUM_CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter(n => ALBUM.includes(n)) : [];
  }catch(e){ return []; }   // navegador com armazenamento bloqueado: joga sem álbum
}

function guardaColecao(lista){
  try{ localStorage.setItem(ALBUM_CHAVE, JSON.stringify(lista)); return true; }
  catch(e){ return false; }
}

function temPonei(nome){ return colecao().includes(nome); }
function quantasTem(){ return colecao().length; }
function totalDoAlbum(){ return ALBUM.length; }

/* ---------- sortear o prêmio ---------- */
/* Entrega sempre uma que ela ainda não tem, enquanto houver.
   Repetir prêmio é a forma mais rápida de matar a graça. */
function sorteiaPremio(){
  const tem = colecao();
  const faltam = ALBUM.filter(n => !tem.includes(n));
  if(!faltam.length) return null;              // álbum completo
  return faltam[Math.floor(Math.random() * faltam.length)];
}

/* ---------- a tela de revelação ---------- */
function injetaEstiloAlbum(){
  if(document.getElementById("estiloAlbum")) return;
  const s = document.createElement("style");
  s.id = "estiloAlbum";
  s.textContent = `
    #premio{
      position:fixed; inset:0; z-index:200; display:none;
      align-items:center; justify-content:center; flex-direction:column;
      gap:12px; padding:22px; text-align:center;
      background:radial-gradient(circle at 50% 42%, #FFF9DC 0%, #FFE9F4 55%, #EFE0FF 100%);
      font-family:'Baloo 2','Segoe UI Rounded',system-ui,sans-serif;
    }
    #premio.visivel{ display:flex; }
    #premio .faixa{ font-size:15px; font-weight:800; letter-spacing:.18em;
      text-transform:uppercase; color:#B08AD8; }
    #premio .moldura{
      width:min(64vw, 240px); aspect-ratio:1; border-radius:32px;
      background:#fff; border:6px solid #FFD34A;
      box-shadow:0 12px 34px rgba(107,63,191,.28);
      display:flex; align-items:center; justify-content:center; overflow:hidden;
      animation:premioEntra .55s cubic-bezier(.2,1.5,.4,1) both;
    }
    #premio .moldura img{ width:100%; height:100%; object-fit:contain; padding:10px; }
    @keyframes premioEntra{
      0%{ transform:scale(.2) rotate(-18deg); opacity:0; }
      100%{ transform:scale(1) rotate(0); opacity:1; }
    }
    #premio .nome{ font-size:clamp(26px,8vw,40px); font-weight:800; color:#6B3FBF;
      line-height:1.05; text-shadow:0 3px 0 #fff; }
    #premio .conta{ font-size:16px; font-weight:600; color:#8A6FBF; }
    #premio .botao{
      margin-top:8px; border:none; border-radius:24px; cursor:pointer;
      font-family:inherit; font-weight:800; font-size:22px; color:#fff;
      padding:16px 34px;
      background:linear-gradient(180deg,#FF6FB0 0%,#E3488F 100%);
      box-shadow:0 5px 0 #C43A79;
    }
    #premio .botao:active{ transform:translateY(4px); box-shadow:0 1px 0 #C43A79; }
    #premio .brilho{ position:absolute; font-size:26px; pointer-events:none;
      animation:brilhaSobe 1.6s ease-out forwards; }
    @keyframes brilhaSobe{
      0%{ transform:translateY(0) scale(.5); opacity:0; }
      30%{ opacity:1; }
      100%{ transform:translateY(-140px) scale(1.2); opacity:0; }
    }
  `;
  document.head.appendChild(s);
}

/* premiar(aoFechar) — chame ao vencer uma rodada.
   Sorteia, guarda, mostra a revelação e fala o nome.
   aoFechar roda quando ela toca no botão. */
function premiar(aoFechar){
  const nome = sorteiaPremio();

  if(!nome){                       // álbum completo: comemora e segue
    if(typeof fala === "function") try{ fala("Você já tem todas as pôneis do álbum! Que campeã!"); }catch(e){}
    if(typeof aoFechar === "function") aoFechar();
    return;
  }

  const lista = colecao();
  lista.push(nome);
  const salvou = guardaColecao(lista);

  injetaEstiloAlbum();

  let cx = document.getElementById("premio");
  if(!cx){
    cx = document.createElement("div");
    cx.id = "premio";
    document.body.appendChild(cx);
  }

  const tem = salvou ? lista.length : 0;
  cx.innerHTML =
    '<div class="faixa">Você ganhou</div>' +
    '<div class="moldura"><img src="' + imgDoAlbum(nome) + '" alt="' + nome + '"></div>' +
    '<div class="nome">' + nome + '</div>' +
    '<div class="conta">' + (salvou
        ? tem + ' de ' + ALBUM.length + ' pôneis no álbum'
        : 'Este navegador não deixa guardar o álbum') + '</div>' +
    '<button class="botao" id="premioOk">Continuar</button>';

  cx.classList.add("visivel");
  brilhos(cx);

  if(typeof somVitoria === "function") try{ somVitoria(); }catch(e){}
  setTimeout(() => {
    if(typeof fala === "function") try{ fala("Você ganhou " + nome + "! Agora ela é sua."); }catch(e){}
  }, 320);

  document.getElementById("premioOk").addEventListener("click", () => {
    cx.classList.remove("visivel");
    if(typeof aoFechar === "function") aoFechar();
  });
}

function brilhos(cx){
  const s = ["✨","⭐","💖","🌈"];
  for(let i = 0; i < 14; i++){
    const b = document.createElement("div");
    b.className = "brilho";
    b.textContent = s[Math.floor(Math.random() * s.length)];
    b.style.left = (10 + Math.random() * 80) + "%";
    b.style.top  = (35 + Math.random() * 35) + "%";
    b.style.animationDelay = (Math.random() * .7) + "s";
    cx.appendChild(b);
    setTimeout(() => b.remove(), 2400);
  }
}
