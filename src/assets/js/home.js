// Company home: marks the section link in view. Progressive enhancement; the page works without it.
// The short last sections never reach the top of the screen, so at the foot of the page the last one counts,
// and a clicked link stays marked until the reader scrolls again.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".home-nav a"));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var pinned = false;

  function mark(i) {
    links.forEach(function (a, j) {
      if (j === i) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  function update() {
    if (pinned) return;
    var atFoot = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var current = -1;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i;
    });
    mark(atFoot ? sections.length - 1 : current);
  }

  links.forEach(function (a, i) {
    a.addEventListener("click", function () { pinned = true; mark(i); });
  });
  ["wheel", "touchmove", "keydown"].forEach(function (type) {
    window.addEventListener(type, function () { pinned = false; }, { passive: true });
  });
  window.addEventListener("scroll", update, { passive: true });

  // The section links only help when the page scrolls; hide them when everything fits on screen.
  // Measured with the links shown, so hiding them cannot tip the page back into fitting.
  function fit() {
    var root = document.documentElement;
    root.classList.remove("home-fits");
    if (root.scrollHeight <= window.innerHeight) root.classList.add("home-fits");
  }
  window.addEventListener("resize", fit);
  fit();
  update();
})();
