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
    let startX = 0;
    let scrollStart = 0;
    let hasDragged = false;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumID = null;

    // Prevent HTML5 native image / link dragging from interfering
    railContainer.addEventListener('dragstart', (e) => e.preventDefault());

    // Intercept clicks on links if a real drag occurred
    railContainer.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true); // Use capture phase to intercept before <a> navigates

    railContainer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only primary mouse button
      isDown = true;
      hasDragged = false;
      if (momentumID) cancelAnimationFrame(momentumID);
      railContainer.classList.add('is-dragging');
      railContainer.classList.remove('is-gliding');

      startX = e.pageX;
      scrollStart = railContainer.scrollLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocity = 0;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX;
      const walk = x - startX;

      if (Math.abs(walk) > 6) {
        hasDragged = true;
      }

      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 8) {
        velocity = (lastX - x) / dt; // pixels per ms
        lastX = x;
        lastTime = now;
      }

      railContainer.scrollLeft = scrollStart - walk;
    });

    const stopDragging = () => {
      if (!isDown) return;
      isDown = false;
      railContainer.classList.remove('is-dragging');

      if (hasDragged && Math.abs(velocity) > 0.12) {
        railContainer.classList.add('is-gliding');
        let currentVelocity = velocity * 16; // px per frame
        const friction = 0.94;

        const momentumStep = () => {
          if (Math.abs(currentVelocity) > 0.6) {
            railContainer.scrollLeft += currentVelocity;
            currentVelocity *= friction;
            momentumID = requestAnimationFrame(momentumStep);
          } else {
            railContainer.classList.remove('is-gliding');
            setTimeout(() => {
              hasDragged = false;
            }, 60);
          }
        };
        momentumID = requestAnimationFrame(momentumStep);
      } else {
        setTimeout(() => {
          hasDragged = false;
        }, 60);
      }
    };

    window.addEventListener('mouseup', stopDragging);

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
