/* Guide pages: menu, cover parallax, gallery ratios, theme toggle, reading progress.
   Rewritten from attila-mod src/js/script.js (jQuery) in plain JavaScript; search, modal and comments are gone. */
(function () {
  "use strict";
  var html = document.documentElement;

  /* Menu (small screens) */
  function toggleMenu() { html.classList.toggle("menu-active"); }
  document.querySelectorAll(".nav-menu, .nav-close").forEach(function (el) {
    el.addEventListener("click", toggleMenu);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(); } });
  });
  window.addEventListener("resize", function () { html.classList.remove("menu-active"); });
  window.addEventListener("orientationchange", function () { html.classList.remove("menu-active"); });

  /* Parallax cover and the white navigation over it */
  var covers = document.querySelectorAll(".cover");
  function parallax() {
    if (!covers.length) { return; }
    var y = window.scrollY || window.pageYOffset;
    var offset = y > 0 ? Math.floor(y * 0.25) : 0;
    covers.forEach(function (c) { c.style.transform = "translate3d(0, " + offset + "px, 0)"; });
    if (y < covers[0].offsetHeight) { html.classList.add("cover-active"); } else { html.classList.remove("cover-active"); }
  }
  parallax();
  ["scroll", "resize", "orientationchange"].forEach(function (ev) { window.addEventListener(ev, parallax, { passive: true }); });

  /* Gallery cards keep their aspect ratios */
  document.querySelectorAll(".kg-gallery-image img").forEach(function (image) {
    var container = image.closest(".kg-gallery-image");
    var w = image.getAttribute("width"), h = image.getAttribute("height");
    if (container && w && h) { container.style.flex = (w / h) + " 1 0%"; }
  });

  /* Dark/Light toggle: data-theme on <html>, remembered in localStorage */
  var toggle = document.querySelector(".js-theme");
  if (toggle) {
    var text = toggle.querySelector(".theme-text");
    var apply = function (theme) {
      html.setAttribute("data-theme", theme);
      try { localStorage.setItem("tf_theme", theme); } catch (e) {}
      if (text) { text.textContent = toggle.getAttribute(theme === "light" ? "data-light" : "data-dark"); }
    };
    var stored = null;
    try { stored = localStorage.getItem("tf_theme"); } catch (e) {}
    if (stored === "light" || stored === "dark") { apply(stored); } else if (text) { text.textContent = toggle.getAttribute("data-dark"); }
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      apply(html.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* Reading progress bar on posts */
  var post = document.querySelector(".post-template .post-content");
  var bar = document.querySelector(".progress-bar");
  var barBox = document.querySelector(".progress-container");
  function progress() {
    if (!post || !bar) { return; }
    var rect = post.getBoundingClientRect();
    var top = rect.top + (window.scrollY || window.pageYOffset);
    var bottom = top + rect.height;
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset;
    var p = 100 - (((bottom - (y + vh) + vh / 3) / (bottom - vh + vh / 3)) * 100);
    bar.style.width = Math.max(0, Math.min(100, p)) + "%";
    if (barBox) { if (p > 100) { barBox.classList.add("complete"); } else { barBox.classList.remove("complete"); } }
  }
  progress();
  ["scroll", "resize", "orientationchange"].forEach(function (ev) { window.addEventListener(ev, progress, { passive: true }); });
})();
