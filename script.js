document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero-section");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======== Sticky Header ======== */
  const initStickyHeader = () => {
    const header = document.querySelector(".header");
    if (!header) return;
    const SCROLL_THRESHOLD = 80;
    window.addEventListener("scroll", () => {
      header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
    }, { passive: true });
  };

  initStickyHeader();

  /* ======== GitHub 星标数 ======== */
  (function fetchGitHubStars() {
    const statEl = document.querySelector(".nav-stat");
    if (!statEl) return;

    const CACHE_KEY = "gh_stars_lillltachen";
    const CACHE_TTL = 1000 * 60 * 60; // 1 小时缓存

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { count, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setNum(count);
          return;
        }
      } catch (_) {}
    }

    fetch("https://api.github.com/users/LillltaChen/repos?per_page=100&type=owner")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((repos) => {
        const total = Array.isArray(repos)
          ? repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
          : 0;
        setNum(total);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ count: total, ts: Date.now() }));
      })
      .catch(() => {
        // 保持 HTML 中的默认值不变
      });

    function setNum(n) {
      const node = statEl.childNodes[0];
      if (node && node.nodeType === Node.TEXT_NODE) {
        node.textContent = formatStars(n) + " ";
      }
    }

    function formatStars(n) {
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
      return String(n);
    }
  })();

  /* ======== Liquid Glass 导航指示器（Apple 风格 + iridescence）======== */
  const initLiquidGlassNav = () => {
    const nav = document.querySelector(".nav");
    if (!nav || !window.matchMedia("(pointer: fine)").matches) return;
    if (prefersReducedMotion) return;

    const links = nav.querySelectorAll("a");
    if (!links.length) return;

    // 创建毛玻璃指示器
    const glass = document.createElement("div");
    glass.className = "nav-glass";

    // 折射层 — 高亮版导航文字副本
    const lens = document.createElement("div");
    lens.className = "nav-glass-lens";
    links.forEach((link) => {
      const span = document.createElement("span");
      span.textContent = link.textContent;
      lens.appendChild(span);
    });
    glass.appendChild(lens);

    // 色散边缘层
    const edge = document.createElement("div");
    edge.className = "nav-glass-edge";
    glass.appendChild(edge);

    // 柔光阴影层
    const shadow = document.createElement("div");
    shadow.className = "nav-glass-shadow";
    glass.appendChild(shadow);

    // 内缘微光层
    const inner = document.createElement("div");
    inner.className = "nav-glass-inner";
    glass.appendChild(inner);

    nav.appendChild(glass);

    // 弹簧物理参数
    const stiffness = 0.09;
    const damping = 0.72;
    let targetLeft = 0;
    let targetWidth = 0;
    let currentLeft = 0;
    let currentWidth = 0;
    let vx = 0;
    let vw = 0;
    let lastVelocity = 0;
    let isMoving = false;
    let movingTimer = null;
    let highlightOffset = 0; // 高光偏移 (px)

    const updateTarget = (link) => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      targetLeft = linkRect.left - navRect.left;
      targetWidth = linkRect.width;
    };

    const getActiveLink = () => {
      const hash = window.location.hash;
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (hash && href.includes(hash)) return link;
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

    // 弹簧动画循环
    const animate = () => {
      const prevLeft = currentLeft;

      vx += (targetLeft - currentLeft) * stiffness;
      vw += (targetWidth - currentWidth) * stiffness;
      vx *= damping;
      vw *= damping;
      currentLeft += vx;
      currentWidth += vw;

      const velocity = currentLeft - prevLeft;

      // 检测移动状态：速度超过阈值时激活色散
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

      // 高光随移动方向偏移（反方向，模拟惯性滞后）
      const targetHighlight = -velocity * 3.5;
      highlightOffset += (targetHighlight - highlightOffset) * 0.12;
      glass.style.setProperty("--highlight-shift", highlightOffset + "px");

      glass.style.left = currentLeft + "px";
      glass.style.width = currentWidth + "px";
      lens.style.left = -currentLeft + "px";

      requestAnimationFrame(animate);
    };

    // hover / 移动
    nav.addEventListener("pointerenter", (e) => {
      const link = e.target.closest("a");
      if (link) updateTarget(link);
    });

    nav.addEventListener("pointermove", (e) => {
      const link = e.target.closest("a");
      if (link) updateTarget(link);
    });

    // 鼠标离开 → 回弹到当前页面对应的链接
    nav.addEventListener("pointerleave", () => {
      setDefaultTarget();
    });

    // 监听 hash 变化（同页内跳转，如 #work → #contact）
    window.addEventListener("hashchange", () => {
      setDefaultTarget();
    });

    // 窗口大小变化时重算
    window.addEventListener("resize", () => {
      setDefaultTarget();
      currentLeft = targetLeft;
      currentWidth = targetWidth;
      vx = 0;
      vw = 0;
      highlightOffset = 0;
    });

    // Scroll spy: 滚动到分类区域时自动高亮对应导航项
    const initScrollSpy = () => {
      const sections = document.querySelectorAll('.category-section');
      if (!sections.length) return;

      const observer = new IntersectionObserver((entries) => {
        let bestEntry = null;
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (!bestEntry || e.boundingClientRect.top < bestEntry.boundingClientRect.top) {
              bestEntry = e;
            }
          }
        });
        if (bestEntry) {
          const link = nav.querySelector('a[href="#' + bestEntry.target.id + '"]');
          if (link) updateTarget(link);
        }
      }, { rootMargin: '-15% 0px -65% 0px' });

      sections.forEach(s => observer.observe(s));

      // Hero 区域时复位到第一个分类
      const projectsEl = document.getElementById('work');
      if (projectsEl) {
        const topObs = new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) updateTarget(links[0]);
        }, { rootMargin: '0px 0px -88% 0px' });
        topObs.observe(projectsEl);
      }
    };

    // 分类导航：点击锚点平滑滚动
    nav.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      e.preventDefault();
      const el = document.querySelector(href);
      if (!el) return;
      history.replaceState(null, "", href);
      updateTarget(link);
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { offset: -80, duration: 0.8 });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    });

    initScrollSpy();
  };

  initLiquidGlassNav();

  /* ======== Cursor Follower（纯 JS，不依赖 GSAP）======== */
  const initCursorFollower = () => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const covers = document.querySelectorAll(".project-cover");
    if (!covers.length) return;

    const cursor = document.createElement("div");
    cursor.className = "cursor-follower";
    document.body.appendChild(cursor);

    let mx = 0, my = 0;    // 原始鼠标位置
    let cx = 0, cy = 0;    // 平滑后的光标位置
    let px = 0, py = 0;    // 上一帧位置（算速度用）

    const MAGNET_RANGE = 120;
    const MAGNET_STRENGTH = 0.12;
    const SPRING = 0.18;

    const header = document.querySelector(".header");

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;

      // header / footer 区域隐藏自定义光标，不遮挡文字
      const overHeader = header && header.contains(e.target);
      const overFooter = e.target.closest(".site-footer");
      if (overHeader || overFooter) {
        cursor.classList.remove("is-visible", "is-project");
      } else {
        cursor.classList.add("is-visible");
      }

      // cover 区域 → 毛玻璃大圆
      const overCover = e.target.closest(".project-cover");
      if (overCover) {
        cursor.classList.add("is-project");
      } else {
        cursor.classList.remove("is-project");
      }

      // 磁吸：靠近卡片时轻微拉向卡片中心
      let pullX = 0, pullY = 0;
      covers.forEach((cover) => {
        const r = cover.getBoundingClientRect();
        const cx_el = r.left + r.width / 2;
        const cy_el = r.top + r.height / 2;
        const dist = Math.hypot(mx - cx_el, my - cy_el);
        if (dist < MAGNET_RANGE) {
          const t = (1 - dist / MAGNET_RANGE) * MAGNET_STRENGTH;
          pullX += (cx_el - mx) * t;
          pullY += (cy_el - my) * t;
        }
      });
      mx += pullX;
      my += pullY;
    });

    document.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-visible", "is-project");
    });

    covers.forEach((cover) => {
      cover.addEventListener("pointerenter", () => {
        const video = cover.querySelector("video");
        if (video) video.play();
      });
      cover.addEventListener("pointerleave", () => {
        const video = cover.querySelector("video");
        if (video) video.pause();
      });
    });

    const follow = () => {
      cx += (mx - cx) * SPRING;
      cy += (my - cy) * SPRING;

      const hovering = cursor.classList.contains("is-project");

      let scale = 1;
      if (!hovering) {
        const vx = cx - px;
        const vy = cy - py;
        const speed = Math.sqrt(vx * vx + vy * vy);
        scale = 1 + Math.min(speed * 0.12, 0.5);
      }

      cursor.style.left = cx + "px";
      cursor.style.top = cy + "px";
      cursor.style.transform = `translate(-50%, -50%) scale(${scale})`;

      px = cx;
      py = cy;
      requestAnimationFrame(follow);
    };
    follow();
  };

  initCursorFollower();

  /* ======== Scroll Reveal ======== */
  const initScrollReveal = () => {
    if (prefersReducedMotion) return;

    const revealEls = document.querySelectorAll(".testimonial-card");
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  };

  initScrollReveal();

  /* ======== 以下依赖 GSAP ======== */
  if (!hero || !window.gsap || prefersReducedMotion) return;

  const initSmoothScroll = () => {
    if (!window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    return lenis;
  };

  initSmoothScroll();

  const playIntroAnimation = () => {
    const titleLetters = hero.querySelectorAll(".title-letter");
    const dot = hero.querySelector(".dot");
    const header = document.querySelector(".header");
    const description = hero.querySelector(".hero-description");

    gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .from(titleLetters, {
        yPercent: 110,
        autoAlpha: 0,
        filter: "blur(16px)",
        duration: 1.1,
        stagger: 0.055,
        clearProps: "filter",
      })
      .from(dot || [], {
        scale: 0,
        autoAlpha: 0,
        duration: 0.55,
        ease: "back.out(1.8)",
      }, "-=0.35")
      .from([header, description], {
        y: 16,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.08,
        clearProps: "all",
      }, "-=0.55");
  };

  playIntroAnimation();

  /* ======== 拖尾图片 ======== */
  const isMobile = window.innerWidth <= 768;
  const config = {
    mouseThreshold: isMobile ? 22 : 100,
    minImageSize: isMobile ? 70 : 100,
    maxImageSize: isMobile ? 140 : 200,
    lifespan: 0.1,
    inDuration: 0.45,
    outDuration: 0.65,
    speedSmoothing: 0.25,
  };

  const images = [
    "./assets/icon/antigravity-color-dark.webp",
    "./assets/icon/claude.webp",
    "./assets/icon/claudecode-color-dark.webp",
    "./assets/icon/codex-color-dark.webp",
    "./assets/icon/cursor-dark.webp",
    "./assets/icon/deepseek.webp",
    "./assets/icon/figma.webp",
    "./assets/icon/gemini-color-dark.webp",
    "./assets/icon/geminicli-color-dark.webp",
    "./assets/icon/google-ai-studio.webp",
    "./assets/icon/jimeng-color-dark.webp",
    "./assets/icon/kimi-color-dark.webp",
    "./assets/icon/kling-color-dark.webp",
    "./assets/icon/lovable-color-dark.webp",
    "./assets/icon/lovart-dark.webp",
    "./assets/icon/midjourney-light.webp",
    "./assets/icon/nanobanana-color-dark.webp",
    "./assets/icon/openai-light.webp",
    "./assets/icon/trae-color-dark.webp",
    "./assets/icon/github-light.webp",
  ];

  let imageIndex = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = performance.now();
  let smoothedSpeed = 0;
  let maxSpeed = 0.5;
  let hasPointer = false;

  const getRelativePoint = (event) => {
    const rect = hero.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const getSpeed = (x, y) => {
    const now = performance.now();
    const distance = Math.hypot(x - lastX, y - lastY);
    const delta = Math.max(now - lastTime, 16);
    const rawSpeed = distance / delta;
    maxSpeed = Math.max(maxSpeed, rawSpeed);
    smoothedSpeed =
      smoothedSpeed * (1 - config.speedSmoothing) +
      Math.min(rawSpeed / maxSpeed, 1) * config.speedSmoothing;
    lastTime = now;
    return smoothedSpeed;
  };

  const createTrailImage = (x, y, speed) => {
    const img = document.createElement("img");
    const imageSize = config.minImageSize + (config.maxImageSize - config.minImageSize) * speed;
    const rotation = gsap.utils.random(-28, 28) * (1 + speed);

    img.className = "trail-img";
    img.src = images[imageIndex];
    img.alt = "";
    img.decoding = "async";
    imageIndex = (imageIndex + 1) % images.length;
    hero.appendChild(img);

    gsap.set(img, {
      x, y,
      xPercent: -50,
      yPercent: -50,
      width: imageSize,
      height: "auto",
      rotation,
      scale: 0,
      autoAlpha: 0,
    });

    gsap.timeline({ onComplete: () => img.remove() })
      .to(img, {
        scale: 1,
        autoAlpha: 1,
        duration: config.inDuration,
        ease: "power3.out",
      })
      .to(img, {
        scale: 0,
        rotation: rotation + 180,
        autoAlpha: 0,
        duration: config.outDuration,
        ease: "power3.inOut",
      }, `+=${config.lifespan}`);
  };

  hero.addEventListener("pointerenter", (event) => {
    const point = getRelativePoint(event);
    lastX = point.x;
    lastY = point.y;
    lastTime = performance.now();
    hasPointer = true;
  });

  hero.addEventListener("pointerleave", () => {
    hasPointer = false;
  });

  hero.addEventListener("pointermove", (event) => {
    const point = getRelativePoint(event);
    const distance = Math.hypot(point.x - lastX, point.y - lastY);
    if (!hasPointer || distance < config.mouseThreshold) return;
    const speed = getSpeed(point.x, point.y);
    createTrailImage(point.x, point.y, speed);
    lastX = point.x;
    lastY = point.y;
  });
});
