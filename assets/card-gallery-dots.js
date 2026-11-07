/**
 * Card Gallery Dots
 * - Overlays dot indicators on product card images
 * - Wrapper zone blocks all clicks (prevents link navigation)
 * - Only dots trigger slide navigation
 */

(function () {
  function initDots(gallery) {
    const wrapper = gallery.querySelector('.card-gallery-dots-wrapper');
    if (!wrapper) return;

    const dotsContainer = wrapper.querySelector('.card-gallery-dots');
    if (!dotsContainer) return;

    const dots = Array.from(dotsContainer.querySelectorAll('.card-gallery-dots__dot'));
    if (!dots.length) return;

    const scroller = gallery.querySelector('slideshow-slides');
    if (!scroller) return;

    // Update active dot based on scroll position
    function updateDots() {
      const slideWidth = scroller.offsetWidth;
      if (slideWidth === 0) return;
      const activeIndex = Math.round(scroller.scrollLeft / slideWidth);
      dots.forEach((dot, i) => {
        dot.classList.toggle('card-gallery-dots__dot--active', i === activeIndex);
      });
    }

    // Wrapper blocks all clicks from reaching the <a> link beneath
    wrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    }, { capture: true });

    // Dots handle navigation
    dots.forEach((dot) => {
      dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const index = parseInt(dot.dataset.index, 10);
        scroller.scrollTo({
          left: scroller.offsetWidth * index,
          behavior: 'smooth',
        });
      });
    });

    scroller.addEventListener('scroll', updateDots, { passive: true });
    updateDots();
  }

  function initAllGalleries() {
    document.querySelectorAll('.card-gallery').forEach(initDots);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllGalleries);
  } else {
    initAllGalleries();
  }

  // Handle dynamically added galleries (filters, infinite scroll)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.classList && node.classList.contains('card-gallery')) {
          initDots(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('.card-gallery').forEach(initDots);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
