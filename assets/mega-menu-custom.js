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

      // Read layout settings
      const linksWidthAttr = matchedBlock.getAttribute('data-links-width') || '20';
      const parsedWidth = parseInt(linksWidthAttr, 10);
      const linksWidthPct = isNaN(parsedWidth) ? 20 : parsedWidth;
      const bannersWidthPct = linksWidthPct <= 0 ? 100 : Math.max(0, 100 - linksWidthPct);
      const bannerColumns = matchedBlock.getAttribute('data-banner-columns') || '4';
      const bannerGap = matchedBlock.getAttribute('data-banner-gap') || '16';

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

      // Check if server-side liquid already rendered .mega-menu-custom
      const existingCustom = submenu.querySelector('.mega-menu-custom');
      const existingSubLinks = submenu.querySelectorAll('.mega-menu-custom__link, .mega-menu__link');
      const hasLinks = existingSubLinks.length > 0 && linksWidthPct > 0;

      const gridCols = hasLinks
        ? `minmax(0, ${linksWidthPct}fr) minmax(0, ${bannersWidthPct}fr)`
        : 'minmax(0, 1fr)';

      const bannersStyle = `grid-template-columns: repeat(${bannerColumns}, minmax(0, 1fr)); gap: ${bannerGap}px;`;

      if (existingCustom) {
        // Update layout styles & CSS variables without destroying server-rendered DOM
        existingCustom.style.setProperty('--mm-links-pct', linksWidthPct);
        existingCustom.style.setProperty('--mm-banners-pct', bannersWidthPct);
        existingCustom.style.setProperty('--mm-banner-cols', bannerColumns);
        existingCustom.style.setProperty('--mm-banner-gap', `${bannerGap}px`);
        existingCustom.style.setProperty('--mm-grid-cols', gridCols);
        existingCustom.style.width = '100%';

        const inner = existingCustom.querySelector('.mega-menu-custom__inner');
        if (inner) {
          inner.style.display = 'grid';
          inner.style.gridTemplateColumns = gridCols;
          inner.style.gap = '48px';
          inner.style.alignItems = 'start';
          inner.style.width = '100%';
          inner.style.boxSizing = 'border-box';
          if (!hasLinks) {
            inner.classList.add('mega-menu-custom__inner--no-links');
            const linksEl = inner.querySelector('.mega-menu-custom__links');
            if (linksEl) linksEl.style.display = 'none';
          } else {
            inner.classList.remove('mega-menu-custom__inner--no-links');
            const linksEl = inner.querySelector('.mega-menu-custom__links');
            if (linksEl) linksEl.style.display = '';
          }
        }

        const bannersEl = existingCustom.querySelector('.mega-menu-custom__banners');
        if (bannersEl) {
          bannersEl.style.gridTemplateColumns = `repeat(${bannerColumns}, minmax(0, 1fr))`;
          bannersEl.style.gap = `${bannerGap}px`;
        }
        return;
      }

      // If not server rendered, build sub-links HTML from existing links
      let subLinksHtml = '';
      if (hasLinks) {
        const seen = new Set();
        subLinksHtml = `<ul class="mega-menu-custom__links list-unstyled">`;
        existingSubLinks.forEach((l) => {
          const href = l.getAttribute('href') || '#';
          const title = (l.querySelector('.mega-menu__link-title') || l).textContent.trim();
          const key = href + '|' + title;
          if (title && !seen.has(key)) {
            seen.add(key);
            subLinksHtml += `<li><a href="${href}" class="mega-menu-custom__link">${title}</a></li>`;
          }
        });
        subLinksHtml += '</ul>';
      }

      submenu.innerHTML = `
        <div class="menu-list__submenu-inner">
          <div class="mega-menu-custom section section--full-width-margin section--page-width"
               style="--mm-links-pct: ${linksWidthPct}; --mm-banners-pct: ${bannersWidthPct}; --mm-banner-cols: ${bannerColumns}; --mm-banner-gap: ${bannerGap}px; --mm-grid-cols: ${gridCols}; width: 100%;">
            <div class="mega-menu-custom__inner${hasLinks ? '' : ' mega-menu-custom__inner--no-links'}"
                 style="display: grid; grid-template-columns: ${gridCols}; gap: 48px; align-items: start; width: 100%; box-sizing: border-box;">
              ${hasLinks ? subLinksHtml : ''}
              <div class="mega-menu-custom__banners" style="${bannersStyle} min-width: 0; width: 100%; box-sizing: border-box;">${bannersHtml}</div>
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
