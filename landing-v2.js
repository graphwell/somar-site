document.addEventListener('DOMContentLoaded', () => {

  /* 1. Header — blur/borda ao rolar */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 2. Menu drawer (hambúrguer) */
  const burgerBtn = document.getElementById('burger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');

  const openMenu = () => {
    if (!mobileMenu || !burgerBtn) return;
    mobileMenu.classList.add('open');
    burgerBtn.classList.add('open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    if (!mobileMenu || !burgerBtn) return;
    mobileMenu.classList.remove('open');
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (burgerBtn) burgerBtn.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) closeMenu();
  });

  /* 3. Scroll reveal */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal-v2').forEach((el) => revealObserver.observe(el));

  /* 4. Contadores animados (números) */
  function animateCount(el) {
    const target = parseFloat(el.dataset.target || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.stat-count').forEach((el) => countObserver.observe(el));

  /* 5. Carrossel coverflow de celulares (uma instância por .phone-carousel) */
  document.querySelectorAll('.phone-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.videos-grid');
    if (!track) return;

    const cards = Array.from(track.querySelectorAll('.phone-card'));
    const prevBtn = carousel.querySelector('.carousel-arrow--prev');
    const nextBtn = carousel.querySelector('.carousel-arrow--next');
    const dotsWrap = carousel.parentElement.querySelector('.carousel-dots');

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      cards.forEach((card, i) => {
        const name = card.querySelector('h3') ? card.querySelector('h3').textContent : `projeto ${i + 1}`;
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ver ${name}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.carousel-dot')) : [];

    let activeIndex = 0;
    let ticking = false;

    function setActive(index) {
      if (index === activeIndex) return;
      activeIndex = index;
      cards.forEach((card, i) => card.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function updateCarousel() {
      ticking = false;
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let closestDist = Infinity;

      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        const norm = Math.min(dist / (trackRect.width / 2), 1);
        const scale = 1 - norm * 0.14;
        const opacity = 1 - norm * 0.4;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = opacity;
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });

      setActive(closest);
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateCarousel);
      }
    }

    track.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateCarousel();
    cards[0]?.classList.add('is-active');
    if (dots[0]) dots[0].classList.add('is-active');

    function goTo(index) {
      const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIndex + 1));

    /* Pausa vídeos fora do carrossel visível */
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { root: track, rootMargin: '0px', threshold: 0.1 });

    cards.forEach((card) => {
      const video = card.querySelector('video');
      if (video) videoObserver.observe(video);
    });

    /* Convite ao swipe */
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      let hintTimeout = null;

      const stopHint = () => {
        carousel.classList.remove('hint-active');
        if (hintTimeout) clearTimeout(hintTimeout);
        track.removeEventListener('scroll', stopHint);
        track.removeEventListener('touchstart', stopHint);
        track.removeEventListener('pointerdown', stopHint);
        if (prevBtn) prevBtn.removeEventListener('click', stopHint);
        if (nextBtn) nextBtn.removeEventListener('click', stopHint);
      };

      const hintObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            carousel.classList.add('hint-active');
            hintTimeout = setTimeout(stopHint, 4500);
            track.addEventListener('scroll', stopHint, { once: true, passive: true });
            track.addEventListener('touchstart', stopHint, { once: true, passive: true });
            track.addEventListener('pointerdown', stopHint, { once: true });
            if (prevBtn) prevBtn.addEventListener('click', stopHint, { once: true });
            if (nextBtn) nextBtn.addEventListener('click', stopHint, { once: true });
            hintObserver.disconnect();
          }
        });
      }, { threshold: 0.4 });

      hintObserver.observe(carousel);
    }

    /* 6. Botão de som por card — só um vídeo com som por vez */
    carousel.querySelectorAll('.sound-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.phone-card');
        const video = card?.querySelector('video');
        if (!video) return;

        const willUnmute = video.muted;

        carousel.querySelectorAll('.phone-screen video').forEach((v) => {
          v.muted = true;
        });
        carousel.querySelectorAll('.sound-toggle').forEach((b) => {
          b.textContent = '🔇';
          b.setAttribute('aria-label', 'Ativar som');
        });

        if (willUnmute) {
          video.muted = false;
          btn.textContent = '🔊';
          btn.setAttribute('aria-label', 'Silenciar');
        }
      });
    });
  });

});
