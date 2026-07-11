document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initStickyHeader = () => {
    const header = document.querySelector(".header");
    if (!header) return;

    const SCROLL_THRESHOLD = 80;
    const HIDE_ZONE = 200;
    const MIN_DELTA = 4;
    let lastScrollY = window.scrollY;
    let ticking = false;
    let introDone = false;

    setTimeout(() => { introDone = true; }, 2500);

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY;
      lastScrollY = y;

      header.classList.toggle("is-scrolled", y > SCROLL_THRESHOLD);

      if (y <= HIDE_ZONE) {
        header.classList.remove("is-hidden");
        ticking = false;
        return;
      }

      if (!introDone) {
        ticking = false;
        return;
      }

      if (Math.abs(delta) < MIN_DELTA) {
        ticking = false;
        return;
      }

      if (delta > 0) {
        header.classList.add("is-hidden");
      } else {
        header.classList.remove("is-hidden");
      }

      ticking = false;
    };

    header.classList.remove("is-hidden");

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  };

  const initSmoothScroll = () => {
    if (!window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    if (window.gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    return lenis;
  };

  const initIntroAnimation = () => {
    if (prefersReducedMotion || !window.gsap) return;

    const intro = document.querySelector(".notes-intro");
    if (!intro) return;

    gsap.from(intro.children, {
      y: 28,
      autoAlpha: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.08,
    });
  };

  const initRevealOnScroll = () => {
    const targets = document.querySelectorAll(
      ".about-stats, .about-section, .about-contact"
    );
    if (!targets.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.05,
      }
    );

    targets.forEach((el) => observer.observe(el));
  };

  const initCopyTrigger = () => {
    document.querySelectorAll('.copy-trigger').forEach(trigger => {
      const hint = trigger.querySelector('.copy-hint');
      if (!hint) return;
      const originalText = hint.textContent;

      trigger.addEventListener('click', () => {
        const text = trigger.dataset.copy;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
          hint.textContent = '已复制';
          trigger.classList.add('is-copied');

          setTimeout(() => {
            hint.textContent = originalText;
            trigger.classList.remove('is-copied');
          }, 1800);
        }).catch(err => {
          console.error('复制失败:', err);
        });
      });
    });
  };

  initStickyHeader();

  /* ======== Liquid Glass 导航指示器（Apple 风格 + iridescence）======== */
  const initLiquidGlassNav = () => {
    const nav = document.querySelector(".nav");
    if (!nav || !window.matchMedia("(pointer: fine)").matches) return;
    if (prefersReducedMotion) return;

    const links = nav.querySelectorAll("a");
    if (!links.length) return;

    const glass = document.createElement("div");
    glass.className = "nav-glass";

    const lens = document.createElement("div");
    lens.className = "nav-glass-lens";
    links.forEach((link) => {
      const span = document.createElement("span");
      span.textContent = link.textContent;
      lens.appendChild(span);
    });
    glass.appendChild(lens);

    const edge = document.createElement("div");
    edge.className = "nav-glass-edge";
    glass.appendChild(edge);

    const shadow = document.createElement("div");
    shadow.className = "nav-glass-shadow";
    glass.appendChild(shadow);

    const inner = document.createElement("div");
    inner.className = "nav-glass-inner";
    glass.appendChild(inner);

    nav.appendChild(glass);

    const stiffness = 0.09;
    const damping = 0.72;
    let targetLeft = 0;
    let targetWidth = 0;
    let currentLeft = 0;
    let currentWidth = 0;
    let vx = 0;
    let vw = 0;
    let isMoving = false;
    let movingTimer = null;
    let highlightOffset = 0;

    const updateTarget = (link) => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      targetLeft = linkRect.left - navRect.left;
      targetWidth = linkRect.width;
    };

    // 根据当前 URL 匹配对应的导航链接
    const getActiveLink = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (hash && href.includes(hash)) return link;
      }
      // 关于页：匹配指向当前目录且无 hash 的链接（即"关于"）
      if (path.includes("about")) {
        for (const link of links) {
          const href = link.getAttribute("href") || "";
          if (href === "index.html") return link;
        }
      }
      return links[0];
    };

    const setDefaultTarget = () => {
      updateTarget(getActiveLink());
    };

    // 等待页面完全布局后再定位（字体/Grid 都可能影响 getBoundingClientRect）
    const initPosition = (retries = 0) => {
      setDefaultTarget();
      currentLeft = targetLeft;
      currentWidth = targetWidth;

      // 兜底：如果位置仍为 0，延迟重试（最多 5 次）
      if (currentWidth === 0 && retries < 5) {
        setTimeout(() => initPosition(retries + 1), 100 * (retries + 1));
        return;
      }

      glass.style.left = currentLeft + "px";
      glass.style.width = currentWidth + "px";
      lens.style.left = -currentLeft + "px";

      requestAnimationFrame(animate);
    };

    if (document.readyState === "complete") {
      requestAnimationFrame(() => requestAnimationFrame(() => initPosition()));
    } else {
      window.addEventListener("load", () => {
        requestAnimationFrame(() => requestAnimationFrame(() => initPosition()));
      });
    }

    const animate = () => {
      const prevLeft = currentLeft;
      vx += (targetLeft - currentLeft) * stiffness;
      vw += (targetWidth - currentWidth) * stiffness;
      vx *= damping;
      vw *= damping;
      currentLeft += vx;
      currentWidth += vw;

      const velocity = currentLeft - prevLeft;
      if (Math.abs(velocity) > 0.15) {
        if (!isMoving) {
          isMoving = true;
          glass.classList.add("is-moving");
        }
        clearTimeout(movingTimer);
        movingTimer = setTimeout(() => {
          isMoving = false;
          glass.classList.remove("is-moving");
        }, 150);
      }

      const targetHighlight = -velocity * 3.5;
      highlightOffset += (targetHighlight - highlightOffset) * 0.12;
      glass.style.setProperty("--highlight-shift", highlightOffset + "px");

      glass.style.left = currentLeft + "px";
      glass.style.width = currentWidth + "px";
      lens.style.left = -currentLeft + "px";

      requestAnimationFrame(animate);
    };

    nav.addEventListener("pointerenter", (e) => {
      const link = e.target.closest("a");
      if (link) updateTarget(link);
    });
    nav.addEventListener("pointermove", (e) => {
      const link = e.target.closest("a");
      if (link) updateTarget(link);
    });
    nav.addEventListener("pointerleave", () => {
      setDefaultTarget();
    });

    // 监听 hash 变化（同页内跳转）
    window.addEventListener("hashchange", () => {
      setDefaultTarget();
    });

    window.addEventListener("resize", () => {
      setDefaultTarget();
      currentLeft = targetLeft;
      currentWidth = targetWidth;
      vx = 0;
      vw = 0;
      highlightOffset = 0;
    });
  };

  initLiquidGlassNav();

  initSmoothScroll();
  initIntroAnimation();
  initRevealOnScroll();
  initCopyTrigger();
});
