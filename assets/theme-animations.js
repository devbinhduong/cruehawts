/**
 * Theme Animations — GSAP powered
 * Reads config from the script tag's data attributes.
 * Activated only when "Enable advanced animations" is on in Theme Settings.
 */

(function () {
  const script = document.currentScript ||
    document.querySelector('script[src*="theme-animations"]');

  const config = {
    style: script?.dataset.style || 'fade-up',
    duration: parseFloat(script?.dataset.duration || 700) / 1000,
    stagger: parseFloat(script?.dataset.stagger || 100) / 1000,
    hoverBanners: script?.dataset.hoverBanners !== 'false',
    hoverButtons: script?.dataset.hoverButtons !== 'false',
  };

  // ─── Wait for GSAP ──────────────────────────────────────────────────────────
  function waitForGSAP(cb, attempts = 0) {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      cb();
    } else if (attempts < 30) {
      setTimeout(() => waitForGSAP(cb, attempts + 1), 100);
    }
  }

  // ─── Entrance animation config per style ───────────────────────────────────
  function getFromVars(style) {
    const base = { opacity: 0 };
    switch (style) {
      case 'fade-up':    return { ...base, y: 40 };
      case 'fade-in':    return { ...base };
      case 'slide-left': return { ...base, x: -60 };
      case 'scale-up':   return { ...base, scale: 0.92 };
      default:           return { ...base, y: 40 };
    }
  }

  // ─── Animate elements on scroll ────────────────────────────────────────────
  function initScrollAnimations() {
    const selectors = [
      // Exclude footer, header, drawers to prevent invisible-element bugs
      '#MainContent .group-block',
      '#MainContent h1, #MainContent h2, #MainContent h3',
      '#MainContent .card-gallery',
      '#MainContent .mega-menu-custom__banner',
      '[data-animate]',
    ].join(', ');

    const fromVars = getFromVars(config.style);
    const elements = document.querySelectorAll(selectors);

    elements.forEach((el) => {
      if (el.dataset.animInit) return;
      el.dataset.animInit = '1';

      gsap.fromTo(el, fromVars, {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: config.duration,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          once: true,
          // Safety: if element never triggers (already visible or off-screen),
          // force it visible after a timeout
          onToggle: (self) => {
            if (!self.isActive) return;
          },
        },
        onComplete: () => {
          // Ensure element is always visible after animation
          gsap.set(el, { clearProps: 'opacity,transform' });
        },
      });

      // Failsafe: if scroll trigger never fires within 3s, force visible
      setTimeout(() => {
        if (window.getComputedStyle(el).opacity === '0') {
          gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1, clearProps: 'transform' });
        }
      }, 3000);
    });
  }

  // ─── Hover: banner zoom (hero sections and group-blocks with bg image) ────────
  function addBannerHover(block) {
    if (block.dataset.bannerHoverInit) return;
    block.dataset.bannerHoverInit = '1';

    // Find image target — could be CSS bg or an <img> inside hero
    const heroSection = block.closest('.hero');
    const heroImg = heroSection?.querySelector('.hero__image, .hero__media-wrapper img');
    const hasCssBg = window.getComputedStyle(block).backgroundImage !== 'none';

    if (!heroImg && !hasCssBg) return;

    if (hasCssBg) block.style.overflow = 'hidden';

    const content = block.querySelector('.group-block-content');

    block.addEventListener('mouseenter', () => {
      if (heroImg) {
        gsap.to(heroImg, { scale: 1.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
      } else {
        gsap.to(block, { scale: 1.02, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      }
      if (content) gsap.to(content, { y: -4, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });

    block.addEventListener('mouseleave', () => {
      if (heroImg) {
        gsap.to(heroImg, { scale: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
      } else {
        gsap.to(block, { scale: 1, duration: 0.5, ease: 'power2.inOut', overwrite: 'auto' });
      }
      if (content) gsap.to(content, { y: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
    });
  }

  function initBannerHover() {
    if (!config.hoverBanners) return;

    // Hero sections — map each group-block to its corresponding image by index
    document.querySelectorAll('.hero').forEach((hero) => {
      if (hero.dataset.bannerHoverInit) return;
      hero.dataset.bannerHoverInit = '1';

      const images = hero.querySelectorAll('.hero__image, .hero__media-wrapper img');
      if (!images.length) return;

      const wrapper = images[0]?.closest('.hero__media-wrapper');
      if (wrapper) wrapper.style.overflow = 'hidden';

      images.forEach((img) => {
        img.style.transformOrigin = 'center';
        img.style.willChange = 'transform';
      });

      const groupBlocks = hero.querySelectorAll(':scope .hero__content-wrapper > .group-block');
      const isSingleImage = images.length === 1;

      if (isSingleImage || groupBlocks.length === 0) {
        // Single image — hover anywhere on hero zooms it
        const img = images[0];
        const content = hero.querySelector('.group-block-content');
        hero.addEventListener('mouseenter', () => {
          gsap.to(img, { scale: 1.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
          if (content) gsap.to(content, { y: -4, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
        });
        hero.addEventListener('mouseleave', () => {
          gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
          if (content) gsap.to(content, { y: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
        });
      } else {
        // Multiple images — each group-block maps to its index image
        groupBlocks.forEach((block, i) => {
          const img = images[i] || images[images.length - 1];
          const content = block.querySelector('.group-block-content');

          block.addEventListener('mouseenter', () => {
            // Reset all images first, then zoom the matched one
            images.forEach((im) => gsap.to(im, { scale: 1, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' }));
            gsap.to(img, { scale: 1.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
            if (content) gsap.to(content, { y: -4, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
          });
          block.addEventListener('mouseleave', () => {
            gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
            if (content) gsap.to(content, { y: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
          });
        });
      }
    });

    // Group blocks with CSS background-image (e.g. banners_3col section)
    document.querySelectorAll('.group-block').forEach((block) => {
      if (block.dataset.bannerHoverInit) return;

      // Check for CSS background-image OR background-image-container with img
      const bg = window.getComputedStyle(block).backgroundImage;
      const bgContainerImg = block.querySelector('.background-image-container img, .group-block__media-wrapper img');
      const hasBg = (bg && bg !== 'none') || bgContainerImg;

      if (!hasBg) return;

      block.dataset.bannerHoverInit = '1';

      const imgTarget = bgContainerImg;
      const content = block.querySelector('.group-block-content');

      if (imgTarget) {
        imgTarget.style.transformOrigin = 'center';
        imgTarget.style.willChange = 'transform';
        const wrapper = imgTarget.closest('.background-image-container, .group-block__media-wrapper');
        if (wrapper) wrapper.style.overflow = 'hidden';
      } else {
        block.style.overflow = 'hidden';
      }

      block.addEventListener('mouseenter', () => {
        if (imgTarget) {
          gsap.to(imgTarget, { scale: 1.06, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        } else {
          gsap.to(block, { scale: 1.02, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        }
        if (content) gsap.to(content, { y: -4, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      });
      block.addEventListener('mouseleave', () => {
        if (imgTarget) {
          gsap.to(imgTarget, { scale: 1, duration: 0.5, ease: 'power2.inOut', overwrite: 'auto' });
        } else {
          gsap.to(block, { scale: 1, duration: 0.5, ease: 'power2.inOut', overwrite: 'auto' });
        }
        if (content) gsap.to(content, { y: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
      });
    });
  }

  // ─── Hover: directional fill (circle expand from cursor entry point) ────────
  function setupButtonFill() {
    const fillStyle = document.createElement('style');
    fillStyle.textContent = `
      .btn-fill-wrap {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        /* keep existing color transitions but override on hover via fill layer */
      }
      /* Never break the accessibility skip link */
      .skip-to-content-link.btn-fill-wrap {
        position: absolute !important;
        overflow: hidden !important;
        height: 1px !important;
        left: -99999px !important;
        isolation: auto !important;
      }
      .btn-fill-layer {
        position: absolute;
        /* oversized circle so it covers the whole button regardless of shape */
        width: 200%;
        padding-bottom: 200%;
        border-radius: 50%;
        background-color: var(--btn-fill-color, rgba(255,255,255,0.18));
        top: var(--fill-y);
        left: var(--fill-x);
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        z-index: -1;
        will-change: transform, opacity;
      }
      /* Keep all direct children above the fill layer */
      .btn-fill-wrap > *:not(.btn-fill-layer) {
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(fillStyle);
  }

  function getRelativePos(e, el) {
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width * 100).toFixed(2) + '%',
      y: ((e.clientY - rect.top) / rect.height * 100).toFixed(2) + '%',
    };
  }

  function addButtonHover(btn) {
    if (btn.dataset.btnHoverInit) return;
    btn.dataset.btnHoverInit = '1';

    btn.classList.add('btn-fill-wrap');

    // Determine fill color based on button type
    const isSecondary = btn.classList.contains('button-secondary');
    const fillColor = isSecondary
      ? 'var(--color-secondary-button-hover-background, rgba(0,0,0,0.06))'
      : 'var(--color-primary-button-hover-background, rgba(255,255,255,0.18))';

    const fill = document.createElement('span');
    fill.className = 'btn-fill-layer';
    fill.style.setProperty('--btn-fill-color', fillColor);
    btn.appendChild(fill);

    btn.addEventListener('mouseenter', (e) => {
      const pos = getRelativePos(e, btn);
      fill.style.setProperty('--fill-x', pos.x);
      fill.style.setProperty('--fill-y', pos.y);

      gsap.killTweensOf(fill);
      gsap.fromTo(fill,
        { scale: 0, opacity: 1 },
        { scale: 1.5, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    });

    btn.addEventListener('mouseleave', (e) => {
      // Update exit position for smooth retreat
      const pos = getRelativePos(e, btn);
      fill.style.setProperty('--fill-x', pos.x);
      fill.style.setProperty('--fill-y', pos.y);

      gsap.killTweensOf(fill);
      gsap.to(fill, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => { gsap.set(fill, { opacity: 1 }); },
      });
    });
  }

  function initButtonHover() {
    if (!config.hoverButtons) return;
    setupButtonFill();
    document.querySelectorAll('.button:not(.button-unstyled):not(.skip-to-content-link), .button-secondary:not(.skip-to-content-link)').forEach(addButtonHover);
  }

  // ─── Hover: mega menu text links & banner cards ──────────────────────────────
  function addMegaLinkHover(link) {
    if (link.dataset.megaLinkInit) return;
    link.dataset.megaLinkInit = '1';

    link.addEventListener('mouseenter', () => {
      gsap.to(link, { x: 4, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    });
    link.addEventListener('mouseleave', () => {
      gsap.to(link, { x: 0, duration: 0.2, ease: 'power2.inOut', overwrite: 'auto' });
    });
  }

  function addMegaBannerHover(banner) {
    if (banner.dataset.megaBannerInit) return;
    banner.dataset.megaBannerInit = '1';

    const img = banner.querySelector('.mega-menu-custom__img');
    const label = banner.querySelector('.mega-menu-custom__banner-label');

    banner.addEventListener('mouseenter', () => {
      if (img) gsap.to(img, { scale: 1.06, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      if (label) gsap.to(label, { y: -3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    });
    banner.addEventListener('mouseleave', () => {
      if (img) gsap.to(img, { scale: 1, duration: 0.5, ease: 'power2.inOut', overwrite: 'auto' });
      if (label) gsap.to(label, { y: 0, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' });
    });
  }

  function initMegaMenuHover() {
    document.querySelectorAll('.mega-menu-custom__link, .mega-menu__link').forEach(addMegaLinkHover);
    document.querySelectorAll('.mega-menu-custom__banner').forEach(addMegaBannerHover);
  }

  function watchMegaMenuOpen() {
    document.querySelectorAll('.menu-list__list-item').forEach((item) => {
      if (item.dataset.megaWatchInit) return;
      item.dataset.megaWatchInit = '1';
      item.addEventListener('pointerenter', () => {
        setTimeout(() => {
          initMegaMenuHover();
          animateMegaMenuIn(item);
        }, 20);
      });
      item.addEventListener('pointerleave', () => {
        const submenu = item.querySelector('.menu-list__submenu');
        if (submenu) delete submenu.dataset.megaEntranceDone;
      });
    });
  }

  // ─── Entrance: mega menu banners & links appear when submenu opens ───────────
  function animateMegaMenuIn(item) {
    const submenu = item.querySelector('.menu-list__submenu');
    if (!submenu || submenu.dataset.megaEntranceDone) return;

    const banners = submenu.querySelectorAll('.mega-menu-custom__banner');
    const links = submenu.querySelectorAll('.mega-menu-custom__link, .mega-menu__link');

    if (banners.length) {
      submenu.dataset.megaEntranceDone = '1';
      gsap.set(banners, { opacity: 0, scale: 0.96 });
      gsap.to(banners, {
        opacity: 1, scale: 1,
        duration: 0.4, stagger: 0.06,
        ease: 'power2.out', clearProps: 'transform',
      });
    }

    if (links.length) {
      gsap.set(links, { opacity: 0, x: -8 });
      gsap.to(links, {
        opacity: 1, x: 0,
        duration: 0.25, stagger: 0.035,
        ease: 'power2.out', clearProps: 'transform',
      });
    }
  }

  // ─── Hero section reveal ────────────────────────────────────────────────────
  function initHeroReveal() {
    document.querySelectorAll('.hero-section, [data-section-type="hero"]').forEach((hero) => {
      const content = hero.querySelector('.group-block-content, .hero-section__content');
      if (!content || content.dataset.animInit) return;
      content.dataset.animInit = '1';

      gsap.fromTo(
        Array.from(content.children),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: config.duration, stagger: config.stagger * 1.5, ease: 'power3.out', delay: 0.2 }
      );
    });
  }

  // ─── Page transition ────────────────────────────────────────────────────────
  function initPageTransition() {
    const main = document.querySelector('#MainContent');
    if (!main) return;
    gsap.fromTo(main, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  waitForGSAP(() => {
    initPageTransition();
    initHeroReveal();
    initScrollAnimations();
    initBannerHover();
    initButtonHover();
    initMegaMenuHover();
    watchMegaMenuOpen();
  });

  // CSS helpers
  const style = document.createElement('style');
  style.textContent = `
    .mega-menu-custom__banner-image { overflow: hidden; }
    .mega-menu-custom__img { transform-origin: center; will-change: transform; }
    .mega-menu-custom__link { display: inline-block; will-change: transform; }
    .menu-list__list-item .mega-menu-custom__banner,
    .menu-list__list-item .mega-menu-custom__link,
    .menu-list__list-item .mega-menu__link { will-change: transform, opacity; }

    /* ── Animated underline for plain <a> links (not buttons) ── */
    :is(
      p a,
      li a:not(.button):not(.button-secondary):not(.menu-list__link):not(.menu-drawer__menu-item),
      .rte a,
      .link,
      .mega-menu-custom__link,
      .mega-menu__link,
      .mega-menu-custom__banner-label,
      .menu-drawer__featured-content a,
      footer a:not(.button):not(.button-secondary)
    ) {
      text-decoration: none;
      background-image: linear-gradient(currentColor, currentColor);
      background-position: 0% 100%;
      background-repeat: no-repeat;
      background-size: 0% 1px;
      transition: background-size 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      padding-bottom: 1px;
    }

    :is(
      p a,
      li a:not(.button):not(.button-secondary):not(.menu-list__link):not(.menu-drawer__menu-item),
      .rte a,
      .link,
      .mega-menu-custom__link,
      .mega-menu__link,
      .mega-menu-custom__banner-label,
      .menu-drawer__featured-content a,
      footer a:not(.button):not(.button-secondary)
    ):hover {
      background-size: 100% 1px;
    }
  `;
  document.head.appendChild(style);
})();
