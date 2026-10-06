/**
 * Project Timeless Shared JavaScript (project-timeless.js)
 * High-performance, zero-dependency UX scripts for child pages
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Smart scroll-aware floating back button
  const backWrap = document.querySelector('.floating-back-wrap');
  if (backWrap) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY <= 60) {
            backWrap.classList.remove('is-hidden');
          } else if (currentY > lastScrollY + 8 && currentY > 80) {
            backWrap.classList.add('is-hidden');
          } else if (currentY < lastScrollY - 8) {
            backWrap.classList.remove('is-hidden');
          }
          lastScrollY = Math.max(0, currentY);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 2. Universal Lightbox for Gallery Tiles
  const tiles = Array.from(document.querySelectorAll('.gallery-tile'));
  if (tiles.length > 0) {
    // Collect items
    const items = tiles.map(tile => {
      const img = tile.querySelector('img');
      const video = tile.querySelector('video');
      const title = tile.querySelector('.gallery-title')?.textContent || tile.getAttribute('data-title') || img?.alt || '';
      const tag = tile.querySelector('.gallery-tag')?.textContent || tile.querySelector('.gallery-page-tag')?.textContent || tile.getAttribute('data-tag') || '';
      const desc = tile.querySelector('.gallery-desc')?.textContent || tile.getAttribute('data-desc') || '';
      return {
        type: video ? 'video' : 'img',
        src: video ? (video.querySelector('source')?.src || video.src) : (img?.src || ''),
        title,
        tag,
        desc
      };
    });

    let currentIndex = 0;

    // Create Lightbox DOM if not present
    let overlay = document.getElementById('timelessLightbox');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'timelessLightbox';
      overlay.className = 'timeless-lightbox-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="lightbox-modal">
          <div class="lightbox-header">
            <div class="lightbox-title-wrap">
              <span class="lightbox-title" id="tlbTitle"></span>
              <span class="lightbox-counter" id="tlbCounter"></span>
            </div>
            <button class="lightbox-close-btn" id="tlbCloseBtn" aria-label="关闭">✕</button>
          </div>
          <div class="lightbox-body">
            <button class="lightbox-nav-btn lightbox-prev" id="tlbPrevBtn" aria-label="上一个">←</button>
            <div id="tlbMediaWrap" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></div>
            <button class="lightbox-nav-btn lightbox-next" id="tlbNextBtn" aria-label="下一个">→</button>
          </div>
          <div class="lightbox-footer" id="tlbDesc"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const tlbTitle = document.getElementById('tlbTitle');
    const tlbCounter = document.getElementById('tlbCounter');
    const tlbMediaWrap = document.getElementById('tlbMediaWrap');
    const tlbDesc = document.getElementById('tlbDesc');
    const tlbCloseBtn = document.getElementById('tlbCloseBtn');
    const tlbPrevBtn = document.getElementById('tlbPrevBtn');
    const tlbNextBtn = document.getElementById('tlbNextBtn');

    function renderItem(index) {
      const item = items[index];
      if (!item) return;
      tlbTitle.textContent = item.title;
      tlbCounter.textContent = `${index + 1} / ${items.length}`;
      tlbDesc.textContent = item.desc;

      tlbMediaWrap.innerHTML = '';
      if (item.type === 'video') {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.controls = true;
        vid.autoplay = true;
        vid.loop = true;
        vid.playsInline = true;
        tlbMediaWrap.appendChild(vid);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.title;
        tlbMediaWrap.appendChild(img);
      }
    }

    function openLightbox(index) {
      currentIndex = index;
      renderItem(currentIndex);
      overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      overlay.classList.remove('is-active');
      const vid = tlbMediaWrap.querySelector('video');
      if (vid) vid.pause();
      document.body.style.overflow = '';
    }

    function prevItem() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      renderItem(currentIndex);
    }

    function nextItem() {
      currentIndex = (currentIndex + 1) % items.length;
      renderItem(currentIndex);
    }

    tiles.forEach((tile, idx) => {
      tile.addEventListener('click', () => openLightbox(idx));
    });

    tlbCloseBtn.addEventListener('click', closeLightbox);
    tlbPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevItem(); });
    tlbNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextItem(); });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });

    window.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevItem();
      else if (e.key === 'ArrowRight') nextItem();
    });
  }

  // 3. Footer back-to-top
  document.querySelectorAll('.footer-back-to-top').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});
