(function () {
  'use strict';

  /* =========================================================
     CONFIGURAÇÃO — trocar aqui pelos links reais de checkout
     de cada plano
     ========================================================= */
  const CHECKOUT_BASICO = 'https://SEU-CHECKOUT-BASICO-AQUI';
  const CHECKOUT_COMPLETO = 'https://SEU-CHECKOUT-COMPLETO-AQUI';

  /* Botões dos planos → cada um vai para o seu checkout, em nova aba */
  document.querySelectorAll('.cta-plano-basico').forEach(function (btn) {
    btn.setAttribute('href', CHECKOUT_BASICO);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });
  document.querySelectorAll('.cta-plano-completo').forEach(function (btn) {
    btn.setAttribute('href', CHECKOUT_COMPLETO);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  /* Restantes CTAs da página (hero, tiras, rodapé) não apontam a um
     checkout único — fazem scroll suave até à secção de planos (#oferta),
     onde a pessoa escolhe entre Básico e Completo. O scroll suave já é
     garantido pelo `scroll-behavior: smooth` no CSS. */

  /* =========================================================
     CONTADOR DOS PLANOS — evergreen por visitante (55 minutos)
     Guarda a hora de expiração em localStorage: não reinicia ao
     atualizar a página, mas reinicia um novo ciclo de 55 min
     assim que chega a 00:00:00.
     ========================================================= */
  (function contadorPlanos() {
    const DURACAO_MS = 55 * 60 * 1000;
    const CHAVE = 'recantoPerfeito_planosExpiraEm';

    const elHoras = document.getElementById('contador-planos-horas');
    const elMinutos = document.getElementById('contador-planos-minutos');
    const elSegundos = document.getElementById('contador-planos-segundos');
    if (!elHoras || !elMinutos || !elSegundos) return;

    function lerOuCriarExpiracao() {
      const agora = Date.now();
      const guardado = parseInt(localStorage.getItem(CHAVE), 10);
      if (!guardado || isNaN(guardado) || guardado <= agora) {
        const novaExpiracao = agora + DURACAO_MS;
        localStorage.setItem(CHAVE, String(novaExpiracao));
        return novaExpiracao;
      }
      return guardado;
    }

    let expiraEm = lerOuCriarExpiracao();

    function atualizar() {
      let restanteMs = expiraEm - Date.now();
      if (restanteMs <= 0) {
        expiraEm = Date.now() + DURACAO_MS;
        localStorage.setItem(CHAVE, String(expiraEm));
        restanteMs = DURACAO_MS;
      }

      const totalSegundos = Math.floor(restanteMs / 1000);
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      elHoras.textContent = String(horas).padStart(2, '0');
      elMinutos.textContent = String(minutos).padStart(2, '0');
      elSegundos.textContent = String(segundos).padStart(2, '0');
    }

    atualizar();
    setInterval(atualizar, 1000);
  })();

  /* =========================================================
     DATA DE URGÊNCIA — barra do topo ("OFERTA VÁLIDA APENAS HOJE, DD/MM/AAAA")
     Preenchida sempre com a data atual do dispositivo do visitante.
     Recalcula a cada minuto para atualizar sozinha se passar da meia-noite.
     ========================================================= */
  (function dataUrgencia() {
    const el = document.getElementById('data-urgencia');
    if (!el) return;

    function atualizar() {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      el.textContent = dia + '/' + mes + '/' + ano;
    }

    atualizar();
    setInterval(atualizar, 60000);
  })();

  /* =========================================================
     ALTURA DINÂMICA DA TOPBAR — mantém a nav interna e o
     padding do body alinhados mesmo quando a barra do topo
     quebra em duas linhas em ecrãs estreitos.
     ========================================================= */
  (function ajustarAlturaTopbar() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    function medir() {
      document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
    }

    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(medir);
    }
  })();

  /* =========================================================
     FAQ — acordeão (abre/fecha ao clicar)
     ========================================================= */
  (function acordeaoFaq() {
    const perguntas = document.querySelectorAll('.faq-pergunta');
    perguntas.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.faq-item');
        const jaAberto = item.classList.contains('aberto');

        item.classList.toggle('aberto', !jaAberto);
        btn.setAttribute('aria-expanded', String(!jaAberto));
      });
    });
  })();

  /* =========================================================
     LIGHTBOX — ampliar imagens (antes/depois e WhatsApp)
     ========================================================= */
  (function lightbox() {
    const overlay = document.getElementById('lightbox');
    const imgEl = document.getElementById('lightbox-img');
    const legendaEl = document.getElementById('lightbox-legenda');
    const fecharBtn = document.getElementById('lightbox-fechar');
    if (!overlay) return;

    function abrir(src, alt, legenda) {
      imgEl.src = src;
      imgEl.alt = alt || '';
      legendaEl.textContent = legenda || '';
      overlay.classList.add('ativo');
      document.body.style.overflow = 'hidden';
    }

    function fechar() {
      overlay.classList.remove('ativo');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.lightbox-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const img = trigger.querySelector('img');
        if (!img) return;
        abrir(img.currentSrc || img.src, img.alt, trigger.getAttribute('data-legenda'));
      });
    });

    fecharBtn.addEventListener('click', fechar);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) fechar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });
  })();

  /* =========================================================
     CARROSSEL DE DEPOIMENTOS — loop infinito, setas, dots,
     swipe/arrasto e autoplay que pausa ao interagir.
     ========================================================= */
  (function carrosselDepoimentos() {
    const raiz = document.getElementById('carrossel-depoimentos');
    if (!raiz) return;

    const viewport = raiz.querySelector('.carrossel__viewport');
    const trilho = raiz.querySelector('.carrossel__trilho');
    const setaPrev = raiz.querySelector('.carrossel__seta--prev');
    const setaNext = raiz.querySelector('.carrossel__seta--next');
    const dots = Array.from(raiz.querySelectorAll('.carrossel__dot'));

    const slidesOriginais = Array.from(trilho.children);
    const total = slidesOriginais.length;
    if (total < 2) return;

    // Clones no início/fim para permitir o loop infinito sem "saltos" visuais
    const cloneInicial = slidesOriginais[0].cloneNode(true);
    const cloneFinal = slidesOriginais[total - 1].cloneNode(true);
    cloneInicial.setAttribute('aria-hidden', 'true');
    cloneFinal.setAttribute('aria-hidden', 'true');
    trilho.appendChild(cloneInicial);
    trilho.insertBefore(cloneFinal, slidesOriginais[0]);

    let indice = 1; // 1..total = slides reais; 0 e total+1 = clones

    function irPara(novoIndice, comTransicao) {
      trilho.style.transition = comTransicao ? '' : 'none';
      trilho.style.transform = 'translateX(-' + (novoIndice * 100) + '%)';
      indice = novoIndice;
      atualizarDots();
    }

    function atualizarDots() {
      const indiceReal = ((indice - 1) + total) % total;
      dots.forEach(function (dot, i) {
        const ativo = i === indiceReal;
        dot.classList.toggle('ativo', ativo);
        dot.setAttribute('aria-selected', String(ativo));
      });
    }

    function seguinte() { irPara(indice + 1, true); }
    function anterior() { irPara(indice - 1, true); }

    trilho.addEventListener('transitionend', function () {
      if (indice === total + 1) {
        irPara(1, false);
      } else if (indice === 0) {
        irPara(total, false);
      }
    });

    irPara(1, false);

    let autoplayId = setInterval(seguinte, 5000);
    function pararAutoplay() {
      if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    if (setaNext) {
      setaNext.addEventListener('click', function () { pararAutoplay(); seguinte(); });
    }
    if (setaPrev) {
      setaPrev.addEventListener('click', function () { pararAutoplay(); anterior(); });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        pararAutoplay();
        irPara(i + 1, true);
      });
    });

    /* Swipe (touch) e arrasto (rato) */
    let arrastando = false;
    let inicioX = 0;
    let deslocamentoAtual = 0;

    function posicaoX(e) {
      return e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    }

    function iniciarArrasto(e) {
      pararAutoplay();
      arrastando = true;
      inicioX = posicaoX(e);
      deslocamentoAtual = 0;
      trilho.style.transition = 'none';
    }

    function moverArrasto(e) {
      if (!arrastando) return;
      deslocamentoAtual = posicaoX(e) - inicioX;
      trilho.style.transform = 'translateX(calc(-' + (indice * 100) + '% + ' + deslocamentoAtual + 'px))';
    }

    function terminarArrasto() {
      if (!arrastando) return;
      arrastando = false;
      const limiar = viewport.offsetWidth * 0.15;
      if (deslocamentoAtual > limiar) {
        irPara(indice - 1, true);
      } else if (deslocamentoAtual < -limiar) {
        irPara(indice + 1, true);
      } else {
        irPara(indice, true);
      }
      deslocamentoAtual = 0;
    }

    viewport.addEventListener('touchstart', iniciarArrasto, { passive: true });
    viewport.addEventListener('touchmove', moverArrasto, { passive: true });
    viewport.addEventListener('touchend', terminarArrasto);

    viewport.addEventListener('mousedown', function (e) {
      e.preventDefault();
      iniciarArrasto(e);
    });
    window.addEventListener('mousemove', moverArrasto);
    window.addEventListener('mouseup', terminarArrasto);
  })();

})();
