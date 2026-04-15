/* ============================================================
   GUAYA BARBERÍA — JavaScript principal
   Módulos: Video iOS · Hero BG · Navbar · Menú · Reveal
            Lightbox · Carrusel · Smooth Scroll
============================================================ */

/* ─────────────────────────────────────────────
   0. VÍDEO — arranque en iOS
   iOS requiere interacción del usuario antes de
   reproducir vídeo aunque sea muted + autoplay.
   Al primer toque intentamos play() como seguro.
───────────────────────────────────────────── */
(function () {
  const video = document.getElementById('ambientVideo');
  if (!video) return;

  document.addEventListener('touchstart', function tryPlay () {
    if (video.paused) video.play().catch(function () {});
    document.removeEventListener('touchstart', tryPlay);
  }, { once: true });
})();

/* ─────────────────────────────────────────────
   1. HERO BG — efecto zoom suave al cargar
───────────────────────────────────────────── */
(function () {
  const heroBg = document.getElementById('heroBg');
  if (!heroBg) return;

  window.addEventListener('load', function () {
    heroBg.classList.add('loaded');
  });
})();

/* ─────────────────────────────────────────────
   2. NAVBAR — sticky con cambio de estilo al scroll
───────────────────────────────────────────── */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ─────────────────────────────────────────────
   3. MENÚ HAMBURGUESA
───────────────────────────────────────────── */
(function () {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  let isOpen = false;

  hamburger.addEventListener('click', function () {
    isOpen = !isOpen;
    hamburger.classList.toggle('open', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
})();

/* closeMenu() es llamada desde el HTML (onclick en links del menú móvil) */
function closeMenu () {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────
   4. REVEAL ON SCROLL — IntersectionObserver
   Anima los elementos con clase .reveal cuando
   entran en el viewport.
───────────────────────────────────────────── */
(function () {
  const reveals = document.querySelectorAll('.reveal');

  /* Fallback para navegadores sin soporte */
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); /* deja de observar tras animar */
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(function (el) { observer.observe(el); });
})();

/* ─────────────────────────────────────────────
   5. LIGHTBOX — galería de fotos
   Abre la imagen ampliada al hacer clic.
   Cierra con botón ×, clic fuera o tecla Escape.
───────────────────────────────────────────── */
(function () {
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryItems  = document.querySelectorAll('.gallery-item[data-src]');

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  galleryItems.forEach(function (item) {
    item.addEventListener('click', function () {
      lightboxImg.src = item.getAttribute('data-src');
      lightboxImg.alt = item.querySelector('img').getAttribute('alt');
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox () {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
})();

/* ─────────────────────────────────────────────
   6. CARRUSEL DE RESEÑAS
   - Autoplay cada 5s
   - Navegación con botones y puntos
   - Swipe táctil
   - Pausa al hover
───────────────────────────────────────────── */
(function () {
  const track         = document.getElementById('reviewsTrack');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards   = track.querySelectorAll('.review-card');
  const total   = cards.length;
  let current   = 0;
  let autoPlay  = null;

  if (total === 0) return;

  /* Crear puntos de navegación */
  cards.forEach(function (_, i) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Reseña ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', function () { goTo(i); });
    dotsContainer.appendChild(dot);
  });

  function getCardWidth () {
    const gap = parseFloat(getComputedStyle(track).gap) || 20;
    return cards[0].offsetWidth + gap;
  }

  function goTo (index) {
    current = (index + total) % total;
    track.style.transform = 'translateX(-' + (current * getCardWidth()) + 'px)';

    dotsContainer.querySelectorAll('.carousel-dot').forEach(function (dot, i) {
      const active = i === current;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  prevBtn.addEventListener('click', function () { resetAutoPlay(); goTo(current - 1); });
  nextBtn.addEventListener('click', function () { resetAutoPlay(); goTo(current + 1); });

  /* Swipe táctil */
  let startX    = 0;
  let isDragging = false;

  track.addEventListener('touchstart', function (e) {
    startX     = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    if (!isDragging) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      resetAutoPlay();
      goTo(diff > 0 ? current + 1 : current - 1);
    }
    isDragging = false;
  }, { passive: true });

  /* Autoplay */
  function startAutoPlay () {
    autoPlay = setInterval(function () { goTo(current + 1); }, 5000);
  }

  function resetAutoPlay () {
    clearInterval(autoPlay);
    startAutoPlay();
  }

  startAutoPlay();

  track.addEventListener('mouseenter', function () { clearInterval(autoPlay); });
  track.addEventListener('mouseleave', startAutoPlay);
})();

/* ─────────────────────────────────────────────
   7. SMOOTH SCROLL con offset para navbar fijo
   El CSS scroll-behavior: smooth ya funciona,
   pero no tiene en cuenta la navbar fija.
   Este script aplica el offset correcto.
───────────────────────────────────────────── */
(function () {
  const OFFSET = 72; /* altura aproximada del navbar */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - OFFSET,
        behavior: 'smooth'
      });
    });
  });
})();
