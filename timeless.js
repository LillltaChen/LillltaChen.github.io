/* ==========================================================================
   Timeless Interactive Engine for LillltaChen (ChenNan Portfolio)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lenis Smooth Scroll
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // 2. Hero Video Scroll Zoom Effect (Timeless Signature)
  const heroCard = document.querySelector('.hero-media-card');
  if (heroCard) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const progress = Math.min(Math.max(scrollY / (windowHeight * 0.7), 0), 1);
      // Scale from 0.95 to 1.02 smoothly
      const scale = 0.95 + progress * 0.07;
      heroCard.style.transform = `scale(${scale})`;
    }, { passive: true });
  }

  // 3. Horizontal Rail Drag-to-Scroll & Navigation Arrows
  const railContainer = document.querySelector('.rail-container');
  const prevBtn = document.querySelector('.rail-arrow-prev');
  const nextBtn = document.querySelector('.rail-arrow-next');

  if (railContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    railContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      railContainer.classList.add('is-dragging');
      startX = e.pageX - railContainer.offsetLeft;
      scrollLeft = railContainer.scrollLeft;
    });

    railContainer.addEventListener('mouseleave', () => {
      isDown = false;
      railContainer.classList.remove('is-dragging');
    });

    railContainer.addEventListener('mouseup', () => {
      isDown = false;
      railContainer.classList.remove('is-dragging');
    });

    railContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - railContainer.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed factor
      railContainer.scrollLeft = scrollLeft - walk;
    });

    // Arrow navigation
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        const cardWidth = railContainer.querySelector('.rail-item')?.offsetWidth || 500;
        railContainer.scrollBy({ left: -cardWidth - 24, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        const cardWidth = railContainer.querySelector('.rail-item')?.offsetWidth || 500;
        railContainer.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
      });
    }

    // Category Filter Tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    const railItems = document.querySelectorAll('.rail-item');

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        railItems.forEach((item) => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
        // Scroll back to start
        railContainer.scrollTo({ left: 0, behavior: 'smooth' });
      });
    });
  }

  // 4. One-Click Copy with Toast Feedback
  const copyButtons = document.querySelectorAll('[data-copy]');
  const toast = document.getElementById('copyToast');

  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      const label = btn.getAttribute('data-copy-label') || textToCopy;

      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast(`已复制 ${label}`);
      } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`已复制 ${label}`);
      }
    });
  });

  let toastTimeout;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // 5. Video Autoplay Fallback Handler
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, silent fallback
      });
    }
  });
});
