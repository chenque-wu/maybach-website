/* ═══════════════════════════════════════════════════
   梅赛德斯-迈巴赫 · 动效系统 v2
   Lenis 平滑滚动 + GSAP ScrollTrigger 叙事
   ═══════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";

  var safe = {
    hidePreloader: function () {
      var p = document.getElementById("preloader");
      if (p) p.style.display = "none";
      var h = document.getElementById("siteHead");
      if (h) h.classList.add("visible");
      document.querySelectorAll(".scroll-cue").forEach(function (c) { c.style.opacity = 1; });
    }
  };

  if (!hasGsap || reduceMotion) {
    /* 降级：直接展示页面内容，跳过全部动效 */
    safe.hidePreloader();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── 平滑滚动（Lenis + ScrollTrigger 同步） ─── */
  var lenis = null;
  if (hasLenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.25, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;

  /* 锚点导航走 Lenis */
  document.querySelectorAll("a[data-lenis]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var hash = a.getAttribute("href");
      if (!hash || hash.charAt(0) !== "#") return;
      var el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.8 });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ── 顶部金色进度条 ─── */
  gsap.to("#progressBar", {
    scaleX: 1, ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
  });

  /* ── 导航状态 ─── */
  var head = document.getElementById("siteHead");
  function onNav() {
    var y = window.scrollY || (lenis ? lenis.scroll : 0);
    if (y > 40) head.classList.add("scrolled"); else head.classList.remove("scrolled");
  }
  if (lenis) lenis.on("scroll", onNav); else window.addEventListener("scroll", onNav, { passive: true });

  /* 移动端菜单 */
  var toggle = document.getElementById("navToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = toggle.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      if (open && lenis) lenis.stop();
      else if (!open && lenis) lenis.start();
    });
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (toggle.classList.contains("open")) toggle.click();
      });
    });
  }

  /* ═══════════════ 开场 Preloader ═══════════════ */
  var preloader = document.getElementById("preloader");
  var preTitle = document.getElementById("preTitle");
  var preCount = document.getElementById("preCount");
  var preWords = document.getElementById("preWords");
  var preFill = document.getElementById("preFill");
  var preCurtainL = document.getElementById("preCurtainL");
  var preCurtainR = document.getElementById("preCurtainR");

  /* MAYBACH 拆字 */
  if (preTitle) {
    var wt = preTitle.textContent;
    preTitle.textContent = "";
    wt.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      preTitle.appendChild(s);
    });
  }

  function playIntro() {
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    /* Hero 标题拆字：仅拆第一行（保持金色渐变行完整） */
    var heroChars = null;
    var line1 = document.querySelector("#heroTitle .ht-line");
    var line2 = document.querySelectorAll("#heroTitle .ht-line")[1];
    if (typeof SplitText !== "undefined" && line1) {
      try { heroChars = SplitText.create(line1, { type: "chars" }).chars; } catch (e) { heroChars = null; }
    }
    if (!heroChars || !heroChars.length) heroChars = null;
    var titleTargets = heroChars ? heroChars.concat([line2]).filter(Boolean) : gsap.utils.toArray("#heroTitle .ht-line");

    var tl = gsap.timeline({ onComplete: function () {
      ScrollTrigger.refresh();
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    } });

    /* 立即设置初始隐藏态（避免 CSS 与 GSAP 冲突） */
    gsap.set(".pre-title .ch", { yPercent: 120, opacity: 0, filter: "blur(14px)" });
    gsap.set(".pre-words", { opacity: 0 });
    gsap.set(preFill, { scaleX: 0 });

    /* ── 开场时序（总长 ~4.8s < 6s）── */
    /* 数字滚动 0→100 */
    var counter = { v: 0 };
    tl.to(counter, {
      v: 100, duration: 1.4, ease: "power2.inOut", snap: { v: 1 },
      onUpdate: function () { preCount.textContent = Math.round(counter.v); }
    }, 0);

    /* 超大 MAYBACH 逐字浮现 */
    tl.to(".pre-title .ch", { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power4.out", stagger: 0.06 }, 0.25);

    /* 文案轮换 */
    var words = ["至臻豪华", "礼待天下", "V12 · 612 PS", "THE ULTIMATE IN LUXURY"];
    function swapWord(i, t) {
      tl.call(function () { preWords.textContent = words[i]; }, null, t - 0.02);
      tl.to(preWords, { opacity: 1, duration: 0.22, ease: "power2.out" }, t);
    }
    tl.to(preWords, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0.9);
    swapWord(1, 1.5); swapWord(2, 2.05); swapWord(3, 2.6);

    /* 金线从中心生长 */
    tl.to(preFill, { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 1.4);

    tl.to({}, { duration: 0.3 }, 3.0);

    /* 撕裂揭幕：左右遮罩向两侧撕开 + 内容放大淡出 */
    tl.to(preCurtainL, { xPercent: -100, duration: 0.95, ease: "power4.inOut" }, 3.3);
    tl.to(preCurtainR, { xPercent: 100, duration: 0.95, ease: "power4.inOut" }, 3.3);
    tl.to(".pre-inner", { opacity: 0, scale: 1.18, duration: 0.5, ease: "power2.in" }, 3.3);

    /* 整个页面在撕裂后从黑缓慢浮现 */
    tl.fromTo("main", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out" }, 3.4);

    /* Hero 入场（图 clip 揭幕 + 标题 blur 逐字） */
    tl.fromTo(".hero-slide[data-slide='0'] .hero-img-wrap", { clipPath: "inset(0 0 100% 0)", scale: 1.18 }, { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 1.4, ease: "power2.out" }, 3.5);
    if (heroChars) {
      tl.fromTo(heroChars, { yPercent: 110, opacity: 0, rotateX: -45, filter: "blur(8px)" }, { yPercent: 0, opacity: 1, rotateX: 0, filter: "blur(0px)", duration: 0.85, ease: "power4.out", stagger: 0.03 }, 3.7);
      tl.fromTo(line2, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, ease: "power4.out" }, 3.75);
    } else {
      tl.fromTo(titleTargets, { yPercent: 110, opacity: 0, filter: "blur(8px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.85, ease: "power4.out", stagger: 0.03 }, 3.7);
    }
    tl.fromTo(".hero-eyebrow", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 3.9);
    tl.fromTo(".hero-sub", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 4.1);
    tl.fromTo(".hero-actions .btn", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1 }, 4.2);
    tl.fromTo(".scroll-cue", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, 4.3);
    tl.fromTo(".carousel", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 4.2);
    tl.to(head, { opacity: 1, duration: 0.6, ease: "power2.out" }, 3.6);
    tl.fromTo(".hero-sweep", { xPercent: -150 }, { xPercent: 150, duration: 3, ease: "power2.inOut" }, 4.2);

    /* 遮罩撕裂后整层淡出，让界面缓慢显现 */
    tl.to(preloader, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 4.3);

    tl.add(function () {
      preloader.style.display = "none";
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      document.fonts && document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      ScrollTrigger.refresh();
    }, 5.0);
  }

  function waitAndPlay() {
    var t = setTimeout(function () { try { playIntro(); } catch (e) { safe.hidePreloader(); } }, 4500);
    var done = function () { clearTimeout(t); try { playIntro(); } catch (e) { safe.hidePreloader(); } };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
  }

  if (reduceMotion) { safe.hidePreloader(); }
  else waitAndPlay();

  /* ═══════════════ Hero ═══════════════ */
  var heroSlides = gsap.utils.toArray(".hero-slide");

  /* 每张图各自 Ken Burns 慢推 */
  gsap.utils.toArray(".hero-slide .hero-img").forEach(function (img) {
    gsap.to(img, { scale: 1.14, duration: 20, ease: "none", repeat: -1, yoyo: true });
  });

  /* 滚动：媒体层推镜 + 内容视差淡出 */
  if (!reduceMotion) {
    gsap.to(".hero-slides", {
      scale: 1.06, yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".hero-content", {
      yPercent: 42, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".scroll-cue", {
      opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=120px", scrub: true }
    });
  }

  /* Hero 车型轮播 */
  var CAR_DATA = [
    { name: "迈巴赫 S 680 4MATIC", spec: "6.0T V12 · 612 PS · ¥ 3,327,000 起" },
    { name: "迈巴赫 GLS 600 4MATIC", spec: "4.0T V8 · 557 PS · ¥ 2,488,000 起" },
    { name: "迈巴赫 EQS 680 礼逸版", spec: "双电机 · 658 PS · ¥ 1,486,000 起" }
  ];
  var carIndex = 0;
  var carTimer = null;
  var carName = document.getElementById("carName");
  var carSpec = document.getElementById("carSpec");
  var carIndexEl = document.getElementById("carIndex");
  var carDots = gsap.utils.toArray(".car-dot");

  function carGo(i) {
    if (i === carIndex) return;
    var prev = heroSlides[carIndex];
    var next = heroSlides[i];
    carIndex = i;
    gsap.to(prev, { opacity: 0, visibility: "hidden", duration: 1.1, ease: "power2.inOut" });
    gsap.fromTo(next, { opacity: 0, visibility: "hidden", scale: 1.06 }, {
      opacity: 1, visibility: "visible", scale: 1, duration: 1.4, ease: "power2.out"
    });
    next.classList.add("is-on");
    prev.classList.remove("is-on");
    if (carName) gsap.fromTo(carName, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" });
    if (carSpec) gsap.fromTo(carSpec, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });
    if (carName) carName.textContent = CAR_DATA[i].name;
    if (carSpec) carSpec.textContent = CAR_DATA[i].spec;
    if (carIndexEl) carIndexEl.textContent = "0" + (i + 1);
    carDots.forEach(function (d, di) { d.classList.toggle("is-on", di === i); });
  }
  function carAuto() { carGo((carIndex + 1) % CAR_DATA.length); }
  function carStart() { if (!reduceMotion) carTimer = setInterval(carAuto, 8000); }
  function carStop() { if (carTimer) { clearInterval(carTimer); carTimer = null; } }

  var carPrev = document.getElementById("carPrev");
  var carNext = document.getElementById("carNext");
  var carousel = document.getElementById("carousel");
  if (carPrev) carPrev.addEventListener("click", function () { carStop(); carGo((carIndex + CAR_DATA.length - 1) % CAR_DATA.length); carStart(); });
  if (carNext) carNext.addEventListener("click", function () { carStop(); carGo((carIndex + 1) % CAR_DATA.length); carStart(); });
  carDots.forEach(function (d) {
    d.addEventListener("click", function () { carStop(); carGo(parseInt(d.dataset.i, 10)); carStart(); });
  });
  if (carousel) {
    carousel.addEventListener("mouseenter", carStop);
    carousel.addEventListener("mouseleave", carStart);
  }
  carStart();

  /* Hero 照片鼠标视差 */
  var heroMedia = document.getElementById("heroMedia");
  if (heroMedia && finePointer && !reduceMotion) {
    var mx = 0, my = 0, cmx = 0, cmy = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    gsap.ticker.add(function () {
      cmx += (mx - cmx) * 0.045;
      cmy += (my - cmy) * 0.045;
      gsap.set(heroMedia, { x: cmx * -20, y: cmy * -14 });
    });
  }

  /* 光尘粒子 */
  var dustBox = document.querySelector(".hero-dust");
  if (dustBox && !reduceMotion) {
    for (var i = 0; i < 26; i++) {
      var d = document.createElement("span");
      var s = (Math.random() * 1.6 + 0.6).toFixed(1);
      d.style.cssText = "position:absolute;left:" + (Math.random() * 100).toFixed(1) + "%;top:" + (30 + Math.random() * 60).toFixed(1) + "%;width:" + s + "px;height:" + s + "px;border-radius:50%;background:rgba(232,217,176," + (0.12 + Math.random() * 0.25).toFixed(2) + ");pointer-events:none;";
      dustBox.appendChild(d);
      gsap.to(d, {
        y: -40 + Math.random() * -50, x: (Math.random() - 0.5) * 30,
        opacity: 0, duration: 5 + Math.random() * 6,
        repeat: -1, repeatDelay: Math.random() * 3, delay: Math.random() * 6,
        ease: "sine.inOut"
      });
    }
  }

  /* 速度感应巨型 MAYBACH 字（ScrollVelocity 简化版） */
  var wm = document.getElementById("heroWm");
  if (wm && !reduceMotion) {
    var wmX = gsap.quickTo(wm, "x", { duration: 1.1, ease: "power3.out" });
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        var v = Math.max(-220, Math.min(220, -self.getVelocity() * 0.14));
        wmX(v);
      }
    });
    gsap.to(wm, {
      yPercent: 55, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* ═══════════════ 跑马灯 ═══════════════ */
  var mqTrack = document.querySelector(".marquee-track");
  if (mqTrack) {
    var half = mqTrack.children.length / 2;
    for (var i = 0; i < half; i++) {
      mqTrack.appendChild(mqTrack.children[i].cloneNode(true));
    }
    var mqTween = gsap.to(mqTrack, { xPercent: -50, repeat: -1, duration: 34, ease: "none" });
    /* 滚动速度联动：滚得越快，跑马灯越快 */
    if (!reduceMotion) {
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: function (self) {
          var v = Math.abs(self.getVelocity());
          mqTween.timeScale(Math.min(4.5, 1 + v / 1600));
        }
      });
      mqTrack.addEventListener("mouseenter", function () { mqTween.timeScale(0); });
      mqTrack.addEventListener("mouseleave", function () { mqTween.timeScale(1); });
    }
  }

  /* ═══════════════ 金色粒子连线（开场炫酷氛围） ═══════════════ */
  function startParticleNet(canvas) {
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w = 0, h = 0, N = 60, pts = [];
    function resize() {
      w = canvas.width = Math.max(2, canvas.clientWidth);
      h = canvas.height = Math.max(2, canvas.clientHeight);
    }
    resize();
    window.addEventListener("resize", resize);
    for (var i = 0; i < N; i++) {
      pts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006 });
    }
    var mouse = { x: 0.5, y: 0.5 };
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX / w; mouse.y = e.clientY / h; }, { passive: true });
    (function frame() {
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, d;
      for (i = 0; i < N; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      for (i = 0; i < N; i++) {
        p = pts[i];
        for (j = i + 1; j < N; j++) {
          q = pts[j];
          dx = (p.x - q.x) * w; dy = (p.y - q.y) * h;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.strokeStyle = "rgba(214,181,105," + ((1 - d / 130) * 0.22).toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x * w, p.y * h); ctx.lineTo(q.x * w, q.y * h); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(232,217,176," + (0.35 + Math.random() * 0.4).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      window.requestAnimationFrame(frame);
    })();
  }
  startParticleNet(document.getElementById("preNet"));

  /* ═══════════════ 全站光尘 ═══════════════ */
  var gd = document.getElementById("globalDust");
  if (gd && !reduceMotion) {
    for (var i = 0; i < 30; i++) {
      var s = document.createElement("span");
      var size = (Math.random() * 1.5 + 0.5).toFixed(1);
      s.style.cssText = "position:absolute;left:" + (Math.random() * 100).toFixed(1) + "%;top:" + (Math.random() * 100).toFixed(1) + "%;width:" + size + "px;height:" + size + "px;border-radius:50%;background:rgba(232,217,176," + (0.05 + Math.random() * 0.1).toFixed(3) + ");";
      gd.appendChild(s);
      gsap.to(s, {
        y: -50 - Math.random() * 60, x: (Math.random() - 0.5) * 40,
        opacity: 0, duration: 8 + Math.random() * 8,
        repeat: -1, repeatDelay: Math.random() * 4, delay: Math.random() * 10,
        ease: "sine.inOut"
      });
    }
  }

  /* ═══════════════ 传承 · 逐块揭幕 ═══════════════ */
  gsap.utils.toArray(".story-block").forEach(function (blk, i) {
    gsap.to(blk, {
      opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
      delay: 0.06 * (i % 2),
      scrollTrigger: { trigger: blk, start: "top 82%", toggleActions: "play none none none" }
    });
  });

  /* 传承图片：clip 揭幕 + 内层 scale（双层出场）+ 悬停放大 */
  gsap.utils.toArray(".story-figure").forEach(function (fig, i) {
    var st = { trigger: fig, start: "top 88%", toggleActions: "play none none none" };
    gsap.fromTo(fig, { clipPath: "inset(12% 10% 12% 10%)", opacity: 0.2 }, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.3, ease: "power4.inOut", scrollTrigger: st });
    gsap.fromTo(fig.querySelector("img"), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: "power2.out", scrollTrigger: st });
    /* 悬停动态：放大 + 轻微上浮 */
    if (finePointer && !reduceMotion) {
      fig.addEventListener("mouseenter", function () {
        gsap.to(fig.querySelector("img"), { scale: 1.1, duration: 0.8, ease: "power3.out" });
      });
      fig.addEventListener("mouseleave", function () {
        gsap.to(fig.querySelector("img"), { scale: 1, duration: 0.8, ease: "power3.out" });
      });
    }
  });

  /* ═══════════════ 匠心 ═══════════════ */
  /* 双色车身 clip-path 揭幕 + 内层 scale（滚动 scrub） */
  gsap.fromTo(".craft-img", {
    clipPath: "inset(0 0 100% 0)"
  }, {
    clipPath: "inset(0 0 0% 0)",
    ease: "none",
    scrollTrigger: { trigger: ".craft-visual", start: "top 82%", end: "top 26%", scrub: true }
  });
  gsap.fromTo(".craft-img", { scale: 1.25 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".craft-visual", start: "top 82%", end: "top 26%", scrub: true }
  });

  /* 特性列表逐条浮现 */
  gsap.utils.toArray(".feature-list li").forEach(function (li, i) {
    gsap.to(li, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      delay: 0.08 * i,
      scrollTrigger: { trigger: li, start: "top 88%", toggleActions: "play none none none" }
    });
  });

  /* 水平画廊：滚轮横向滑动（Lenis 经 data-lenis-prevent 跳过此区） */
  var gallery = document.getElementById("gallery");
  var gtrack = document.getElementById("galleryTrack");
  if (gallery && gtrack && !reduceMotion) {
    var galX = 0;
    var gMax = function () { return Math.max(0, gtrack.scrollWidth - gallery.clientWidth); };
    gallery.addEventListener("wheel", function (e) {
      e.preventDefault();
      galX = Math.max(0, Math.min(gMax(), galX + e.deltaY));
      gsap.to(gtrack, { x: -galX, duration: 0.5, ease: "power2.out" });
    }, { passive: false });
  }

  /* ═══════════════ 座舱 · 双层 clip 揭幕 ═══════════════ */
  gsap.utils.toArray(".cabin-img").forEach(function (fig, i) {
    var st = { trigger: fig, start: "top 84%", toggleActions: "play none none none" };
    gsap.fromTo(fig, { clipPath: "inset(12% 9% 12% 9%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut", delay: (i % 2) * 0.12, scrollTrigger: st });
    gsap.fromTo(fig.querySelector("img"), { scale: 1.28 }, { scale: 1, duration: 1.5, ease: "power2.out", scrollTrigger: st });
  });

  /* ═══════════════ 车型 ═══════════════ */
  gsap.utils.toArray(".model-card").forEach(function (card, i) {
    gsap.fromTo(card, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: "power3.out",
      delay: (i % 2) * 0.14,
      scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none none" }
    });
  });

  /* tilt + 聚光灯 */
  if (finePointer && !reduceMotion) {
    gsap.utils.toArray(".tilt").forEach(function (card) {
      var rx = 0, ry = 0;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var ex = (e.clientX - r.left) / r.width;
        var ey = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (ex * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (ey * 100).toFixed(1) + "%");
        rx = (0.5 - ey) * 6;
        ry = (ex - 0.5) * 8;
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", function () {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1,0.5)" });
      });
    });
  }

  /* ═══════════════ 参数计数 ═══════════════ */
  gsap.utils.toArray(".spec-value").forEach(function (el) {
    var val = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals || "0", 10);
    var suffix = el.dataset.suffix || "";
    var obj = { v: 0 };
    gsap.to(obj, {
      v: val, duration: 2, ease: "power2.out",
      snap: dec > 0 ? { v: Math.pow(10, -dec) } : { v: 1 },
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onUpdate: function () {
        el.textContent = obj.v.toFixed(dec) + (obj.v >= val ? suffix : "");
      }
    });
  });

  /* ═══════════════ 定制区（静态展示，无着色交互） ═══════════════ */

  /* ═══════════════ 自定义光标 ═══════════════ */
  if (finePointer && !reduceMotion) {
    var cursor = document.getElementById("cursor");
    var glow = document.querySelector(".cursor-glow");
    if (cursor) {
      document.body.classList.add("has-cursor");
      var cx = gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3.out" });
      var cy = gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3.out" });
      var gx = gsap.quickTo(glow, "x", { duration: 0.7, ease: "power3.out" });
      var gy = gsap.quickTo(glow, "y", { duration: 0.7, ease: "power3.out" });
      window.addEventListener("mousemove", function (e) {
        cx(e.clientX); cy(e.clientY);
        gx(e.clientX); gy(e.clientY);
      });
      var cursorScale = gsap.quickTo(cursor, "scale", { duration: 0.35, ease: "power2.out" });
      document.addEventListener("mouseover", function (e) {
        var t = e.target.closest("a, button, .g-card, .model-card");
        cursor.classList.toggle("is-big", !!t);
        cursorScale(t ? 4.4 : 1);
      });    }
  }

  /* ═══════════════ 磁吸按钮 ═══════════════ */
  if (finePointer && !reduceMotion) {
    gsap.utils.toArray(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * 0.28, y: dy * 0.28, duration: 0.45, ease: "power3.out" });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.32)" });
      });
    });
  }

  /* 章节大标题视差 */
  gsap.utils.toArray("[data-parallax-title]").forEach(function (el) {
    gsap.fromTo(el, { xPercent: -3 }, {
      xPercent: 3, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ═══════════════ 3D 展厅 ═══════════════ */
  function initShowroom() {
    var holder = document.getElementById("viewer");
    var canvas = document.getElementById("viewerCanvas");
    if (!holder || !canvas || reduceMotion) return;
    var loading = document.getElementById("viewerLoading");
    var hint = document.getElementById("viewerHint");
    if (typeof THREE === "undefined") {
      if (loading) loading.textContent = "3D 预览不可用";
      return;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      if (loading) loading.textContent = "浏览器不支持 WebGL";
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);

    /* 程序化环境反射贴图：让金属漆有真实反射，消除死黑 */
    function buildEnvMap() {
      try {
        var c = document.createElement("canvas");
        c.width = 512; c.height = 256;
        var ctx = c.getContext("2d");
        var g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, "#9aa0ae");
        g.addColorStop(0.42, "#3a3d46");
        g.addColorStop(0.5, "#c9b98a");
        g.addColorStop(0.56, "#6a5a3a");
        g.addColorStop(1, "#16161a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 256);
        var spots = [[0.22, 0.16, 130, 0.9], [0.62, 0.22, 90, 0.65], [0.42, 0.72, 80, 0.45], [0.8, 0.6, 60, 0.5]];
        spots.forEach(function (s) {
          var rg = ctx.createRadialGradient(s[0] * 512, s[1] * 256, 0, s[0] * 512, s[1] * 256, s[2]);
          rg.addColorStop(0, "rgba(255,246,222," + s[3] + ")");
          rg.addColorStop(1, "rgba(255,246,222,0)");
          ctx.fillStyle = rg;
          ctx.fillRect(0, 0, 512, 256);
        });
        var tex = new THREE.CanvasTexture(c);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        var pmrem = new THREE.PMREMGenerator(renderer);
        return pmrem.fromEquirectangular(tex).texture;
      } catch (e) { return null; }
    }
    var envMap = null;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    var camDist = 7.2;
    var camY = 1.7;
    var carCenterY = 0.7;
    var carMinZoom = 3.2;
    camera.position.set(0, camY, camDist);

    envMap = buildEnvMap();
    if (envMap) scene.environment = envMap;

    /* 灯光：多层光照让黑车清晰可见 */
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x505050, 0.8));
    var key = new THREE.DirectionalLight(0xfff2d8, 1.9);
    key.position.set(5, 7, 6);
    var rim = new THREE.DirectionalLight(0xc6a664, 1.4);
    rim.position.set(-6, 4, -5);
    var fill = new THREE.DirectionalLight(0x93a5c8, 0.9);
    fill.position.set(0, 1.5, -6);
    var topLight = new THREE.DirectionalLight(0xe8d9b0, 0.8);
    topLight.position.set(0, 10, 0);
    var backLight = new THREE.DirectionalLight(0xffffff, 0.55);
    backLight.position.set(0, 3, -8);
    scene.add(key, rim, fill, topLight, backLight);
    /* 车底补光，照亮裙部 */
    var under = new THREE.PointLight(0xc6a664, 0.9, 14);
    under.position.set(0, -0.6, 0);
    scene.add(under);

    /* 地面：反光板（给黑车提供环境反射）+ 金色光环 */
    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(6, 72),
      new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.6, roughness: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    scene.add(ground);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(5.8, 6.0, 96),
      new THREE.MeshBasicMaterial({ color: 0xc6a664, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.01;
    scene.add(ring);

    /* ── 程序化建模：迈巴赫风格黑色轿车（升级版轮廓） ── */
    var MAT = {
      body: new THREE.MeshStandardMaterial({ color: 0x17171d, metalness: 0.78, roughness: 0.22 }),
      bodyLow: new THREE.MeshStandardMaterial({ color: 0x101014, metalness: 0.7, roughness: 0.3 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x0e1420, metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.92 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xc6a664, metalness: 0.9, roughness: 0.22 }),
      silver: new THREE.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.95, roughness: 0.15 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9, metalness: 0 }),
      tail: new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0x880000, emissiveIntensity: 0.8 }),
      head: new THREE.MeshStandardMaterial({ color: 0xf8ecd0, emissive: 0xfff0c0, emissiveIntensity: 1.1 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 1.0, roughness: 0.12 })
    };

    function buildCar() {
      var car = new THREE.Group();

      /* 车身：更贴近 S 级的轮廓（长车头、缓车顶、斜 C 柱） */
      var s = new THREE.Shape();
      s.moveTo(2.32, 0.22);
      s.lineTo(1.60, 0.22);
      s.quadraticCurveTo(1.27, 0.55, 0.94, 0.22);
      s.lineTo(0.56, 0.22);
      s.quadraticCurveTo(0.23, 0.55, -0.10, 0.22);
      s.lineTo(-2.40, 0.22);
      s.lineTo(-2.42, 0.42);
      s.lineTo(-2.30, 0.60);
      s.lineTo(-2.02, 0.80);
      s.lineTo(-1.05, 0.92);
      s.lineTo(-0.62, 1.02);
      s.lineTo(-0.16, 1.40);
      s.lineTo(0.90, 1.42);
      s.lineTo(1.52, 1.28);
      s.lineTo(1.80, 0.97);
      s.lineTo(2.18, 0.90);
      s.lineTo(2.34, 0.78);
      s.lineTo(2.34, 0.48);
      s.closePath();
      var bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.52, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
      var body = new THREE.Mesh(bodyGeo, MAT.body);
      body.position.z = -0.76;
      car.add(body);

      /* 玻璃座舱（更大更通透） */
      var g = new THREE.Shape();
      g.moveTo(-0.16, 1.40);
      g.lineTo(-0.62, 1.02);
      g.lineTo(-0.92, 0.95);
      g.lineTo(1.62, 0.98);
      g.lineTo(1.80, 0.97);
      g.lineTo(1.52, 1.28);
      g.lineTo(0.90, 1.42);
      g.closePath();
      var glassGeo = new THREE.ExtrudeGeometry(g, { depth: 1.44, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
      var glass = new THREE.Mesh(glassGeo, MAT.glass);
      glass.position.z = -0.72;
      car.add(glass);

      /* 车窗镀铬框 */
      var chromeBand = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 0.02), MAT.chrome);
      chromeBand.position.set(0.55, 1.02, 0.767);
      car.add(chromeBand);

      /* 直瀑式格栅：银色外框 + 金色竖条（更宽更高） */
      var grilleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 1.3), MAT.silver);
      grilleFrame.position.set(-2.38, 0.60, 0);
      car.add(grilleFrame);
      for (var i = -6; i <= 6; i++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.30, 0.035), MAT.gold);
        bar.position.set(-2.40, 0.60, i * 0.2);
        car.add(bar);
      }
      var lowBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 1.0), MAT.silver);
      lowBar.position.set(-2.40, 0.30, 0);
      car.add(lowBar);

      /* 三叉星立标 */
      var star = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.02), MAT.silver);
      star.position.set(-1.95, 0.98, 0);
      car.add(star);

      /* 大灯与尾灯 */
      [-0.56, 0.56].forEach(function (z) {
        var hl = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.34), MAT.head);
        hl.position.set(-2.30, 0.62, z);
        car.add(hl);
        var tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.3), MAT.tail);
        tl.position.set(2.36, 0.85, z);
        car.add(tl);
      });

      /* 后视镜 */
      [-0.79, 0.79].forEach(function (z) {
        var mir = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.08), MAT.body);
        mir.position.set(-0.72, 1.05, z);
        car.add(mir);
      });

      /* 侧面镀铬腰线 + 双色金线 + 隐藏门把手 */
      var belt = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.02, 0.015), MAT.chrome);
      belt.position.set(0, 0.62, 0.773);
      car.add(belt);
      var twotone = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.015, 0.016), MAT.gold);
      twotone.position.set(0, 0.42, 0.778);
      car.add(twotone);
      [[-0.95, 0.76], [0.05, 0.76], [1.05, 0.76]].forEach(function (p) {
        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.02), MAT.chrome);
        handle.position.set(p[0], p[1], 0.78);
        car.add(handle);
      });

      /* 车轮：轮胎 + 金色多辐轮毂 + 中心银标 */
      var tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 28);
      var hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.38, 20);
      var capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12);
      [[-0.66, 0.44, 0.66], [1.24, 0.44, 0.66], [-0.66, 0.44, -0.66], [1.24, 0.44, -0.66]].forEach(function (p) {
        var tire = new THREE.Mesh(tireGeo, MAT.tire);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(p[0], p[1], p[2]);
        car.add(tire);
        var hub = new THREE.Mesh(hubGeo, MAT.gold);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(p[0], p[1], p[2]);
        car.add(hub);
        var cap = new THREE.Mesh(capGeo, MAT.chrome);
        cap.rotation.z = Math.PI / 2;
        cap.position.set(p[0], p[1], p[2]);
        car.add(cap);
      });

      return car;
    }

    var group = new THREE.Group();
    scene.add(group);
    var rotY = 0;
    var autoRotate = true;

    /* 加载：HTTP 下加载真实迈巴赫模型，file:// 下降级为示意模型 */
    var isHttp = location.protocol === "http:" || location.protocol === "https:";

    function showCar(mesh) {
      group.add(mesh);
      if (loading) loading.style.display = "none";
      if (hint) hint.style.opacity = 1;
      autoRotate = true;
    }

    function fallbackProcedural(msg) {
      var car = buildCar();
      showCar(car);
      if (msg && loading) {
        loading.textContent = msg;
        setTimeout(function () { if (loading) loading.style.display = "none"; }, 4200);
      }
    }

    function loadRealModel() {
      if (typeof THREE.GLTFLoader === "undefined") { fallbackProcedural("3D 加载器不可用，显示示意模型"); return; }
      var parts = ["assets/models/maybach2022.p0.gz", "assets/models/maybach2022.p1.gz"];
      Promise.all(parts.map(function (p) {
        return fetch(p).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); });
      }))
        .then(function (arrs) {
          var total = 0;
          arrs.forEach(function (a) { total += a.byteLength; });
          var merged = new Uint8Array(total);
          var off = 0;
          arrs.forEach(function (a) { merged.set(new Uint8Array(a), off); off += a.byteLength; });
          if (typeof DecompressionStream === "undefined") throw new Error("no-gunzip");
          return new Response(new Response(merged).body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
        })
        .then(function (buf) {
          return new Promise(function (resolve, reject) {
            new THREE.GLTFLoader().parse(buf, "", resolve, reject);
          });
        })
        .then(function (gltf) {
          var m = gltf.scene;
          m.updateMatrixWorld(true);
          /* 增强材质反射：让车漆更有光泽与层次 */
          m.traverse(function (o) {
            if (o.isMesh) {
              var mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach(function (mat) {
                if (mat && mat.isMeshStandardMaterial) {
                  mat.envMapIntensity = 1.35;
                  if (mat.roughness > 0.65) mat.roughness = 0.55;
                }
              });
            }
          });
          /* 剔除地面平台/底座：只保留中心 y 高于阈值的车体部件 */
          var boxes = [];
          m.traverse(function (o) {
            if (!o.isMesh || !o.geometry) return;
            o.geometry.computeBoundingBox();
            if (!o.geometry.boundingBox) return;
            boxes.push(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
          });
          var kept = boxes.filter(function (b) { return b.min.y > -0.4; });
          if (!kept.length) kept = boxes;
          var realBox = kept[0].clone();
          kept.forEach(function (b) { realBox.union(b); });
          var fullBox = new THREE.Box3().setFromObject(m); /* 完整盒用于水平居中 */
          var size = realBox.getSize(new THREE.Vector3());
          var center = realBox.getCenter(new THREE.Vector3());
          var fullCenter = fullBox.getCenter(new THREE.Vector3());
          window.__carInfo = { minY: realBox.min.y, maxY: realBox.max.y, sizeX: size.x, sizeY: size.y, sizeZ: size.z, centerY: center.y, partsUsed: kept.length };
          /* 缩放到车长 ~4.7；水平用完整盒居中，垂直用过滤盒落地 */
          var scale = 4.7 / Math.max(size.x, 0.001);
          group.scale.setScalar(scale);
          m.position.x -= fullCenter.x * scale;
          m.position.z -= fullCenter.z * scale;
          group.position.y = -realBox.min.y * scale;
          showCar(m);
          /* 相机：确保整车完整可见 */
          var s2 = new THREE.Vector3().copy(size).multiplyScalar(scale);
          camDist = Math.max(s2.x * 1.6, 8);
          camY = Math.max(s2.y * 0.55, 1.2);
          carCenterY = center.y * scale;
          carMinZoom = Math.max(s2.x * 0.55, 2.8);
          window.__carInfo.scale = scale;
          window.__carInfo.camDist = camDist;
          window.__carInfo.camY = camY;
        })
        .catch(function (e) {
          console.warn("真实模型加载失败，回退示意模型:", e);
          fallbackProcedural("真车模加载失败，显示示意模型");
        });
    }

    if (isHttp) loadRealModel();
    else fallbackProcedural("提示：双击打开为示意模型，启动本地服务器可看真车模");

    /* 交互：拖拽旋转 + 滚轮缩放 */
    var dragging = false, px = 0;
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; px = e.clientX;
      if (hint) hint.style.opacity = 0;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      rotY += (e.clientX - px) * 0.006;
      px = e.clientX;
    });
    canvas.addEventListener("pointerup", function () { dragging = false; });
    canvas.addEventListener("pointercancel", function () { dragging = false; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      camDist = Math.max(carMinZoom, Math.min(24, camDist + e.deltaY * 0.006));
    }, { passive: false });

    function resize() {
      var r = holder.getBoundingClientRect();
      var w = Math.max(2, Math.round(r.width));
      var h = Math.max(2, Math.round(r.height));
      renderer.setSize(w, h, false);
      canvas.width = w; canvas.height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    (function frame() {
      window.requestAnimationFrame(frame);
      if (autoRotate && !dragging) rotY += 0.0022;
      group.rotation.y = rotY;
      camera.position.set(0, camY + Math.sin(performance.now() * 0.0003) * 0.06, camDist);
      camera.lookAt(0, carCenterY, 0);
      renderer.render(scene, camera);
    })();
  }
  initShowroom();

  /* 初始刷新（等布局稳定） */
  ScrollTrigger.refresh();
})();
