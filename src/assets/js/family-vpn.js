// Phone picker for the unlisted family VPN page: shows the iPhone or the Android steps, never both.
// Without JavaScript both sections show and the picker links jump to them.
// First choice: the #iphone or #android in the address, then the last choice on this device, then a guess from the browser.
(function () {
  var pick = document.querySelector(".fv-pick");
  if (!pick) return;
  var tabs = Array.prototype.slice.call(pick.querySelectorAll("a"));
  var ids = tabs.map(function (a) { return a.getAttribute("href").slice(1); });
  var KEY = "tf_family_phone";

  function show(id) {
    tabs.forEach(function (a, i) {
      var on = ids[i] === id;
      a.setAttribute("aria-selected", on ? "true" : "false");
      a.tabIndex = on ? 0 : -1;
      document.getElementById(ids[i]).hidden = !on;
    });
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  function choose(id) {
    show(id);
    history.replaceState(null, "", "#" + id);
    // Switching from further down the page: go to the top of the new steps, not the same depth in them.
    var panel = document.getElementById(id);
    if (panel.getBoundingClientRect().top < 0) panel.scrollIntoView();
  }

  pick.setAttribute("role", "tablist");
  tabs.forEach(function (a, i) {
    a.setAttribute("role", "tab");
    a.setAttribute("aria-controls", ids[i]);
    document.getElementById(ids[i]).setAttribute("role", "tabpanel");
    a.addEventListener("click", function (e) { e.preventDefault(); choose(ids[i]); });
    a.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var next = (i + 1) % ids.length;
      choose(ids[next]);
      tabs[next].focus();
    });
  });

  // Narrow screens: the switch shows its own mark only while it is stuck to the top, so the mark above the title is never doubled.
  var bar = pick.parentNode;
  if (bar.classList.contains("fv-bar") && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.setAttribute("data-stuck", entries[0].intersectionRatio < 1 && entries[0].boundingClientRect.top < 1 ? "true" : "false");
    }, { rootMargin: "-1px 0px 0px 0px", threshold: 1 }).observe(bar);
  }

  var start = location.hash.slice(1);
  if (ids.indexOf(start) < 0) { try { start = localStorage.getItem(KEY); } catch (e) { start = null; } }
  if (ids.indexOf(start) < 0) start = /android/i.test(navigator.userAgent) ? "android" : "iphone";
  show(start);
  window.addEventListener("hashchange", function () {
    var id = location.hash.slice(1);
    if (ids.indexOf(id) >= 0) show(id);
  });
})();
