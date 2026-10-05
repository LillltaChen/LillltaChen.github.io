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
    let startY = 0;
    let scrollStart = 0;
    let draggedDistance = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumID = null;

    // Prevent HTML5 native image / link dragging from interfering with smooth drag
    railContainer.addEventListener('dragstart', (e) => e.preventDefault());

    // Only intercept clicks if a genuine drag (> 8px) occurred!
    railContainer.addEventListener('click', (e) => {
      if (draggedDistance > 8) {
        e.preventDefault();
        e.stopPropagation();
        draggedDistance = 0;
      }
    }, true); // Use capture phase so we intercept before <a> navigates if dragged

    railContainer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only primary mouse button
      isDown = true;
      draggedDistance = 0;
      if (momentumID) cancelAnimationFrame(momentumID);
      railContainer.classList.remove('is-gliding');

      startX = e.pageX;
      startY = e.pageY;
      scrollStart = railContainer.scrollLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocity = 0;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX;
      const y = e.pageY;
      const walk = x - startX;
      draggedDistance = Math.hypot(x - startX, y - startY);

      // Only enter drag state if moved more than 8 pixels
      if (draggedDistance > 8) {
        railContainer.classList.add('is-dragging');
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

      if (draggedDistance > 8 && Math.abs(velocity) > 0.12) {
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
          }
        };
        momentumID = requestAnimationFrame(momentumStep);
      }
    };

    window.addEventListener('mouseup', stopDragging);

    // Arrow navigation with dynamic step & state reflection
    const getScrollStep = () => {
      const card = railContainer.querySelector('.rail-item:not([style*="display: none"])') || railContainer.querySelector('.rail-item');
      const track = railContainer.querySelector('.rail-track');
      if (!card || !track) return 600;
      const gap = parseFloat(window.getComputedStyle(track).gap) || 28;
      return card.offsetWidth + gap;
    };

    const updateArrowStates = () => {
      if (!prevBtn || !nextBtn) return;
      const maxScroll = Math.max(0, railContainer.scrollWidth - railContainer.clientWidth - 5);
      const isStart = railContainer.scrollLeft <= 5;
      const isEnd = railContainer.scrollLeft >= maxScroll;

      prevBtn.style.opacity = isStart ? '0.35' : '1';
      prevBtn.style.pointerEvents = isStart ? 'none' : 'auto';
      nextBtn.style.opacity = isEnd ? '0.35' : '1';
      nextBtn.style.pointerEvents = isEnd ? 'none' : 'auto';
    };

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        railContainer.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        railContainer.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      });

      railContainer.addEventListener('scroll', updateArrowStates, { passive: true });
      window.addEventListener('resize', updateArrowStates, { passive: true });
      window.addEventListener('load', updateArrowStates, { passive: true });
      updateArrowStates();
      setTimeout(updateArrowStates, 300);
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
        // Scroll back to center of first visible card
        railContainer.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(updateArrowStates, 320);
      });
    });

    // Center a specific card in rail-container and scroll #work into view
    function scrollToCard(targetCard, smooth = true) {
      if (!targetCard || !railContainer) return;

      // 1. Ensure target card is visible if filter was applied
      if (targetCard.style.display === 'none') {
        filterTabs.forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.filter-tab[data-filter="all"]');
        if (allTab) allTab.classList.add('active');
        railItems.forEach(item => item.style.display = 'flex');
      }

      // 2. Vertically scroll to #work section
      const workSection = document.getElementById('work');
      if (workSection) {
        if (typeof lenis !== 'undefined' && lenis) {
          lenis.scrollTo(workSection, { offset: -30, duration: 0.9 });
        } else {
          workSection.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
      }

      // 3. Horizontally scroll the rail-container to center the card
      setTimeout(() => {
        const cardRect = targetCard.getBoundingClientRect();
        const containerRect = railContainer.getBoundingClientRect();
        const currentScrollLeft = railContainer.scrollLeft;
        const cardCenterInContainer = (cardRect.left - containerRect.left) + currentScrollLeft + (cardRect.width / 2);
        const targetScrollLeft = cardCenterInContainer - (containerRect.width / 2);

        railContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: smooth ? 'smooth' : 'auto'
        });

        // 4. Subtle brief focus highlight
        targetCard.classList.add('card-target-focus');
        setTimeout(() => {
          targetCard.classList.remove('card-target-focus');
        }, 2200);

        setTimeout(updateArrowStates, 360);
      }, 120);
    }

    // Auto-jump to card based on URL hash or query params
    function checkUrlCardTarget() {
      const rawHash = (window.location.hash || '').replace('#', '').trim();
      const params = new URLSearchParams(window.location.search);
      const cardParam = (params.get('card') || params.get('project') || '').trim();

      const candidateKey = rawHash || cardParam;
      if (!candidateKey) return;

      const cleanKey = candidateKey.replace(/^card-/, '');
      const targetCard = document.getElementById(`card-${cleanKey}`) ||
                         document.getElementById(candidateKey) ||
                         document.querySelector(`[data-project="${cleanKey}"]`);

      if (targetCard) {
        scrollToCard(targetCard, true);
      }
    }

    // Check on page load, hashchange, and pageshow (bfcache)
    setTimeout(checkUrlCardTarget, 200);
    setTimeout(checkUrlCardTarget, 500);
    window.addEventListener('hashchange', checkUrlCardTarget);
    window.addEventListener('pageshow', () => {
      setTimeout(checkUrlCardTarget, 200);
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

  // 6. Cutting-Edge 3D Holographic Tilt & Specular Glare (Apple TV / Linear / Raycast style)
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (isFinePointer) {
    const fanCards = document.querySelectorAll('.fan-card');
    fanCards.forEach((card) => {
      const glare = card.querySelector('.card-glare');
      let rect = null;
      let rafId = null;

      const cardIndex = card.classList.contains('fan-card-1') ? 1 :
                        card.classList.contains('fan-card-2') ? 2 :
                        card.classList.contains('fan-card-3') ? 3 : 4;
      const baseOffset = cardIndex === 1 ? -175 :
                         cardIndex === 2 ? -52 :
                         cardIndex === 3 ? 52 : 175;

      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
        card.style.transition = 'transform 0.08s ease-out, box-shadow 0.2s ease-out, opacity 0.35s ease';
      });

      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          const xPct = (x / rect.width) - 0.5; // -0.5 to 0.5
          const yPct = (y / rect.height) - 0.5;

          // 3D tilt angles
          const tiltX = (-yPct * 18).toFixed(2);
          const tiltY = (xPct * 18).toFixed(2);
          const glareX = ((x / rect.width) * 100).toFixed(1);
          const glareY = ((y / rect.height) * 100).toFixed(1);

          card.style.transform = `translateX(${baseOffset}px) translateY(-26px) perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.08)`;

          if (glare) {
            glare.style.background = `radial-gradient(circle 280px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.2) 40%, transparent 75%)`;
          }
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        rect = null;
        card.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';
        card.style.transform = '';
        if (glare) {
          glare.style.background = '';
        }
      });
    });
  }
});
