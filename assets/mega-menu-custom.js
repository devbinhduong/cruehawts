/**
 * Mega Menu Custom
 * Desktop: Injects custom banner mega menu after header section hydration.
 * Mobile: Injects banners into accordion items in the mobile drawer.
 */

(function () {
  function buildBannersHtml(block) {
    const banners = [];
    for (let i = 1; i <= 4; i++) {
      const img = block.getAttribute(`data-banner-${i}-image`);
      const label = block.getAttribute(`data-banner-${i}-label`) || '';
      const linkUrl = block.getAttribute(`data-banner-${i}-link`) || '#';
      if (img || label) banners.push({ img, label, link: linkUrl });
    }
    return banners.map((b) => `
      <a href="${b.link}" class="mega-menu-custom__banner">
        <div class="mega-menu-custom__banner-image">
          ${b.img
            ? `<img src="${b.img}" loading="lazy" class="mega-menu-custom__img" alt="${b.label}">`
            : '<div class="mega-menu-custom__img-placeholder"></div>'}
        </div>
        ${b.label ? `<span class="mega-menu-custom__banner-label">${b.label}</span>` : ''}
      </a>`).join('');
  }

  // ─── DESKTOP ───────────────────────────────────────────────────────────────

  function injectDesktop() {
    const dataBlocks = document.querySelectorAll('.mega-menu-content-data');
    if (!dataBlocks.length) return;

    document.querySelectorAll('.menu-list__list-item').forEach((item) => {
      if (item.dataset.megaInjected) return;

      const link = item.querySelector('a[ref="menuitem"]');
      if (!link) return;

      const linkTitle = (link.querySelector('.menu-list__link-title') || link)
        .textContent.trim().toLowerCase();

      let matchedBlock = null;
      dataBlocks.forEach((block) => {
        const trigger = (block.getAttribute('data-trigger') || '').toLowerCase().trim();
        if (trigger === linkTitle) matchedBlock = block;
      });

      if (!matchedBlock) return;

      const bannersHtml = buildBannersHtml(matchedBlock);
      if (!bannersHtml) return;

      item.dataset.megaInjected = '1';
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-controls', link.getAttribute('aria-controls') || `submenu-custom-${linkTitle}`);
      link.setAttribute('aria-expanded', 'false');

      let submenu = item.querySelector('[ref="submenu[]"]');
      if (!submenu) {
        submenu = document.createElement('div');
        submenu.className = 'menu-list__submenu color-scheme-matches-parent';
        submenu.setAttribute('ref', 'submenu[]');
        item.appendChild(submenu);
      }

      let subLinksHtml = '';
      const existingLinks = submenu.querySelectorAll('.mega-menu__link');
      if (existingLinks.length) {
        subLinksHtml = '<ul class="mega-menu-custom__links list-unstyled">';
        existingLinks.forEach((l) => {
          const title = l.querySelector('.mega-menu__link-title')?.textContent.trim() || l.textContent.trim();
          subLinksHtml += `<li><a href="${l.href}" class="mega-menu-custom__link">${title}</a></li>`;
        });
        subLinksHtml += '</ul>';
      }

      submenu.innerHTML = `
        <div class="menu-list__submenu-inner">
          <div class="mega-menu-custom section section--full-width-margin section--page-width">
            <div class="mega-menu-custom__inner">
              ${subLinksHtml}
              <div class="mega-menu-custom__banners">${bannersHtml}</div>
            </div>
          </div>
        </div>`;
    });
  }

  // ─── MOBILE ────────────────────────────────────────────────────────────────

  function injectMobile() {
    const dataBlocks = document.querySelectorAll('.mega-menu-content-data');
    if (!dataBlocks.length) return;

    const drawer = document.querySelector('header-drawer');
    if (!drawer) return;

    // Find all accordion items (both levels < 3 and 3-level menus)
    const accordionDetails = drawer.querySelectorAll(
      'accordion-custom details, .menu-drawer__menu-container details'
    );

    accordionDetails.forEach((details) => {
      if (details.dataset.mobileInjected) return;

      const summary = details.querySelector('summary');
      if (!summary) return;

      const titleEl = summary.querySelector('.menu-drawer__menu-item-text');
      if (!titleEl) return;

      const linkTitle = titleEl.textContent.trim().toLowerCase();

      let matchedBlock = null;
      dataBlocks.forEach((block) => {
        const trigger = (block.getAttribute('data-trigger') || '').toLowerCase().trim();
        if (trigger === linkTitle) matchedBlock = block;
      });

      if (!matchedBlock) return;

      const bannersHtml = buildBannersHtml(matchedBlock);
      if (!bannersHtml) return;

      details.dataset.mobileInjected = '1';

      const bannerDiv = document.createElement('div');
      bannerDiv.className = 'menu-drawer__mega-banners';
      bannerDiv.innerHTML = bannersHtml;
      details.appendChild(bannerDiv);
    });
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────

  function waitForHydration() {
    const headerSection = document.querySelector('.header-section');
    if (!headerSection) {
      setTimeout(waitForHydration, 100);
      return;
    }

    if (headerSection.dataset.hydrated === 'true') {
      injectDesktop();
      injectMobile();
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-hydrated' &&
          headerSection.dataset.hydrated === 'true'
        ) {
          observer.disconnect();
          injectDesktop();
          injectMobile();
          return;
        }
      }
    });

    observer.observe(headerSection, { attributes: true });

    setTimeout(() => {
      observer.disconnect();
      injectDesktop();
      injectMobile();
    }, 2000);
  }

  // Re-inject mobile when accordion opens (details toggle)
  document.addEventListener('toggle', (e) => {
    if (e.target.closest('header-drawer')) {
      injectMobile();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHydration);
  } else {
    waitForHydration();
  }
})();
