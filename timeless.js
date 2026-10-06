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
    let rafID = null;
    let pendingWalk = 0;
    // Velocity history for smoother fling
    let velocitySamples = [];

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
      velocitySamples = [];
      if (momentumID) cancelAnimationFrame(momentumID);
      if (rafID) cancelAnimationFrame(rafID);
      railContainer.classList.remove('is-gliding');

      startX = e.pageX;
      startY = e.pageY;
      scrollStart = railContainer.scrollLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocity = 0;
    });

    const applyScroll = () => {
      railContainer.scrollLeft = scrollStart - pendingWalk;
      rafID = null;
    };

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

      // Track velocity (px per ms) with small rolling window for stable fling
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 4) {
        const v = (lastX - x) / dt;
        velocitySamples.push(v);
        if (velocitySamples.length > 5) velocitySamples.shift();
        velocity = velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length;
        lastX = x;
        lastTime = now;
      }

      // Write scrollLeft once per frame, not per mousemove event
      pendingWalk = walk;
      if (!rafID) rafID = requestAnimationFrame(applyScroll);
    });

    const stopDragging = () => {
      if (!isDown) return;
      isDown = false;
      if (rafID) { cancelAnimationFrame(rafID); rafID = null; }
      railContainer.classList.remove('is-dragging');

      if (draggedDistance > 8 && Math.abs(velocity) > 0.08) {
        railContainer.classList.add('is-gliding');
        let currentVelocity = velocity * 16; // px per frame
        const friction = 0.955;

        const momentumStep = () => {
          if (Math.abs(currentVelocity) > 0.4) {
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
    window.addEventListener('mouseleave', stopDragging);
    window.addEventListener('blur', stopDragging);

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

  // 6. Bencho.dev 3D Card Carousel (Turntable Ring Carousel)
  const carTrack = document.querySelector('#turntableCarousel .car-track');
  if (carTrack) {
    const slots = carTrack.querySelectorAll('.car-slot');
    const prevBtn = document.querySelector('.car-arrow-prev');
    const nextBtn = document.querySelector('.car-arrow-next');
    const activeTitle = document.getElementById('carActiveTitle');
    const activeTag = document.getElementById('carActiveTag');

    const carouselItems = [
      { title: '索尼 WH-1000XM5 世界静音大片', tag: '3C 影音数码' },
      { title: '霸王茶姬 伯牙绝弦商业主视觉', tag: '新茶饮爆款' },
      { title: 'Google Pixel Pro 旗舰影像全案', tag: '先锋硬件视觉' },
      { title: '任天堂 Switch 3D 创意全案', tag: '游戏泛娱乐' },
      { title: '贵州茅台酒 传统工笔四格全案', tag: '国酒文化' },
      { title: '太二酸菜鱼「酸菜比鱼好吃」商业全案', tag: '餐饮潮流全案' },
      { title: '奇多 Cheetos 四格野性之旅插画', tag: '品牌创意插画' },
      { title: '宋凰茶礼 一叶知秋新中式包装', tag: '东方茶礼美学' },
      { title: 'usmile 笑容加 Y10 智能声波牙刷全案', tag: '个人护理美学' },
      { title: '金秋暖阳慢下午 · 实拍转绘风格迁移全案', tag: '艺术风格迁移' }
    ];

    const numCards = slots.length;
    const naturalTilts = [-3.5, 2.4, -1.8, 3.2, -2.2, 2.6, -3.0, 1.8, -2.5, 2.0];
    const PULL = 130; // drag resistance
    let orbit = window.innerWidth <= 640 ? 120 : 235;
    let turn = 0;
    let animFrame = null;
    let isDragging = false;
    let startX = 0;
    let startTurn = 0;
    let lastX = 0;
    let lastTime = 0;
    let vx = 0;

    window.addEventListener('resize', () => {
      orbit = window.innerWidth <= 640 ? 120 : 235;
      updatePositions();
    });

    function updatePositions() {
      slots.forEach((slot, i) => {
        const theta = (i - turn) * (Math.PI * 2 / numCards);
        const f = (Math.cos(theta) + 1) / 2; // 1 front, 0 back
        const x = Math.sin(theta) * orbit;
        const y = -(1 - f) * 30; // back of ring rides up
        const scale = 0.54 + 0.46 * f; // backScale 0.54 to 1
        const zIndex = Math.round(f * 100);
        const opacity = (0.32 + 0.68 * f).toFixed(3);
        const tilt = naturalTilts[i % naturalTilts.length];

        slot.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${tilt}deg) scale(${scale.toFixed(4)})`;
        slot.style.zIndex = String(zIndex);
        slot.style.opacity = opacity;
      });

      // Update metadata text
      let activeIndex = Math.round(turn) % numCards;
      if (activeIndex < 0) activeIndex += numCards;
      if (activeTitle && activeTag && carouselItems[activeIndex]) {
        activeTitle.textContent = carouselItems[activeIndex].title;
        activeTag.textContent = carouselItems[activeIndex].tag;
      }
    }

    function animateTo(target) {
      cancelAnimationFrame(animFrame);
      const startTurnVal = turn;
      const diff = target - startTurnVal;
      const duration = 520;
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 4); // quartic ease-out
        turn = startTurnVal + diff * ease;
        updatePositions();

        if (progress < 1) {
          animFrame = requestAnimationFrame(step);
        } else {
          turn = target;
          updatePositions();
        }
      }
      animFrame = requestAnimationFrame(step);
    }

    // Pointer Dragging Interaction
    let hasMoved = false;

    carTrack.addEventListener('dragstart', (e) => e.preventDefault());

    function onPointerMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        hasMoved = true;
      }
      const dt = Math.max(1, e.timeStamp - lastTime);
      vx = (vx + (e.clientX - lastX) / dt) / 2;
      lastX = e.clientX;
      lastTime = e.timeStamp;
      turn = startTurn - dx / PULL;
      updatePositions();
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      carTrack.removeAttribute('data-held');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const fling = Math.max(-2, Math.min(2, -vx * 160 / PULL));
      const targetTurn = Math.round(turn + fling);
      animateTo(targetTurn);
    }

    carTrack.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      cancelAnimationFrame(animFrame);
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startTurn = turn;
      lastX = e.clientX;
      lastTime = e.timeStamp;
      vx = 0;
      carTrack.setAttribute('data-held', 'true');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });

    // Prevent link click when user dragged
    carTrack.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Keyboard Arrow Keys
    carTrack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        animateTo(Math.round(turn) + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        animateTo(Math.round(turn) - 1);
      }
    });

    // Arrow Buttons
    prevBtn?.addEventListener('click', () => {
      animateTo(Math.round(turn) - 1);
    });
    nextBtn?.addEventListener('click', () => {
      animateTo(Math.round(turn) + 1);
    });

    // Card Hover Sink & Sheen (bencho.dev qg function)
    const cards = carTrack.querySelectorAll('.car-card');
    cards.forEach((card) => {
      const sheen = card.querySelector('.car-sheen');
      card.addEventListener('pointermove', (e) => {
        if (isDragging) return;
        const rect = card.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        const rx = (-ny * 6.5).toFixed(2);
        const ry = (nx * 6.5).toFixed(2);
        card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(-4px)`;

        if (sheen) {
          const sx = (((nx + 1) / 2) * 100).toFixed(1);
          const sy = (((ny + 1) / 2) * 100).toFixed(1);
          sheen.style.backgroundImage = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255, 255, 255, 0.4) 0%, transparent 65%)`;
          sheen.style.opacity = '1';
        }
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
        if (sheen) {
          sheen.style.opacity = '0';
        }
      });
    });

    // Initial positioning
    updatePositions();
  }

  // Rail Project Cards: Surface Sink & Specular Sheen
  if (window.matchMedia('(hover: hover)').matches) {
    const railCards = document.querySelectorAll('.card-media-box');
    railCards.forEach((box) => {
      const sheen = box.querySelector('.card-sheen');
      const MAX_TILT = 4; // degrees, subtler than carousel (cards are larger)

      box.addEventListener('pointermove', (e) => {
        const rect = box.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        const rx = (-ny * MAX_TILT).toFixed(2);
        const ry = (nx * MAX_TILT).toFixed(2);
        box.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(-4px)`;

        if (sheen) {
          const sx = (((nx + 1) / 2) * 100).toFixed(1);
          const sy = (((ny + 1) / 2) * 100).toFixed(1);
          sheen.style.backgroundImage = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)`;
          sheen.style.opacity = '1';
        }
      });

      box.addEventListener('pointerleave', () => {
        box.style.transform = '';
        if (sheen) sheen.style.opacity = '0';
      });
    });
  }
});
