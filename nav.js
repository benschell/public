window.BSOS_NAV = [{"t":"projects","d":true,"c":[{"t":"draw-prompts","d":true,"c":[{"t":"What should I draw?","p":"projects/draw-prompts/index.html"}]},{"t":"pumpkin-chunkin-competition","d":true,"c":[{"t":"Pumpkin Chunkin Competition Rules","p":"projects/pumpkin-chunkin-competition/rules.html"}]}]}];
window.BSOS_NAV_RECENT = [{"t":"What should I draw?","p":"projects/draw-prompts/index.html","w":"2026-06-28"},{"t":"Pumpkin Chunkin Competition Rules","p":"projects/pumpkin-chunkin-competition/rules.html","w":"2026-06-28"}];
window.BSOS_NAV_TITLE = "Schell Family";
// bsos site nav drawer, on every tier. Expects window.BSOS_NAV (tree), BSOS_NAV_RECENT (recent pages),
// BSOS_NAV_TITLE and BSOS_NAV_BASE (relative prefix). The build prepends the data to this file as nav.js.
(function () {
  if (!window.BSOS_NAV) return;
  var BASE = window.BSOS_NAV_BASE || "";
  var LS_OPEN = "bsosnav.open", LS_EXP = "bsosnav.expanded";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // --- current page: the build stamps each page with its own site-relative path ---
  var here = window.BSOS_NAV_HERE || "";
  function isCurrent(p) { return !!p && p === here; }

  // --- expanded set ---
  var expanded = new Set();
  try { (JSON.parse(lsGet(LS_EXP) || "[]")).forEach(function (k) { expanded.add(k); }); } catch (e) {}
  function saveExpanded() { lsSet(LS_EXP, JSON.stringify(Array.from(expanded))); }

  // --- build DOM ---
  var root = document.createElement("div");
  root.className = "bsosnav-root";
  root.innerHTML =
    '<button class="bsosnav-btn" aria-label="Open navigation" title="Navigation (Esc closes)">☰</button>' +
    '<div class="bsosnav-backdrop"></div>' +
    '<nav class="bsosnav-drawer" aria-label="Site navigation">' +
      '<div class="bsosnav-head"><a href="' + BASE + 'index.html"></a>' +
      '<input class="bsosnav-filter" type="search" placeholder="Filter pages…" autocomplete="off">' +
      '<button class="bsosnav-close" aria-label="Close">×</button></div>' +
      '<div class="bsosnav-tree"><div class="bsosnav-recent"></div></div>' +
    '</nav>';
  document.body.appendChild(root);

  var btn = root.querySelector(".bsosnav-btn");
  var backdrop = root.querySelector(".bsosnav-backdrop");
  var filter = root.querySelector(".bsosnav-filter");
  var treeEl = root.querySelector(".bsosnav-tree");
  var recentEl = root.querySelector(".bsosnav-recent");
  root.querySelector(".bsosnav-head a").textContent = window.BSOS_NAV_TITLE || "bsos";
  var currentLi = null;

  function nodeKey(node, path) { return node.p || path; }

  function renderList(nodes, path) {
    var ul = document.createElement("ul");
    nodes.forEach(function (n) {
      var li = document.createElement("li");
      var key = nodeKey(n, path + n.t);
      li.dataset.key = key;
      li.dataset.search = (n.t + " " + (n.p || "")).toLowerCase();
      var row = document.createElement("div");
      row.className = "bsosnav-row";
      var caret = document.createElement("button");
      caret.className = "bsosnav-caret";
      caret.setAttribute("aria-label", "Toggle");
      row.appendChild(caret);
      var label;
      if (n.p) {
        label = document.createElement("a");
        label.href = BASE + n.p;
        if (isCurrent(n.p)) { label.className = "bsosnav-current"; currentLi = li; }
      } else {
        label = document.createElement("span");
        label.className = "bsosnav-label";
        label.addEventListener("click", function () { toggle(li); });
      }
      label.textContent = n.t;
      row.appendChild(label);
      li.appendChild(row);
      if (n.d && n.c) {
        li.className = "bsosnav-dir " + (expanded.has(key) ? "bsosnav-expanded" : "bsosnav-collapsed");
        caret.addEventListener("click", function () { toggle(li); });
        li.appendChild(renderList(n.c, path + n.t + "/"));
      } else {
        li.className = "bsosnav-leaf";
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function toggle(li) {
    var open = li.classList.toggle("bsosnav-expanded");
    li.classList.toggle("bsosnav-collapsed", !open);
    if (open) expanded.add(li.dataset.key); else expanded.delete(li.dataset.key);
    saveExpanded();
  }

  // --- recently changed pages, above the tree; hidden while filtering ---
  var recent = window.BSOS_NAV_RECENT || [];
  if (recent.length) {
    var h = document.createElement("div");
    h.className = "bsosnav-section";
    h.textContent = "Recent";
    var rul = document.createElement("ul");
    recent.forEach(function (r) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = BASE + r.p;
      a.textContent = r.t;
      a.title = r.p;
      if (isCurrent(r.p)) a.className = "bsosnav-current";
      var w = document.createElement("span");
      w.className = "bsosnav-when";
      w.textContent = r.w;
      li.appendChild(a); li.appendChild(w);
      rul.appendChild(li);
    });
    recentEl.appendChild(h); recentEl.appendChild(rul);
    var all = document.createElement("div");
    all.className = "bsosnav-section";
    all.textContent = "All pages";
    treeEl.appendChild(all);
  } else {
    recentEl.remove();
  }

  treeEl.appendChild(renderList(window.BSOS_NAV, ""));

  // Expand ancestors of the current page and persist that.
  if (currentLi) {
    var el = currentLi.parentElement;
    while (el && el !== treeEl) {
      if (el.tagName === "LI" && el.classList.contains("bsosnav-dir")) {
        el.classList.add("bsosnav-expanded"); el.classList.remove("bsosnav-collapsed");
        expanded.add(el.dataset.key);
      }
      el = el.parentElement;
    }
    saveExpanded();
  }

  // --- open/close ---
  function setOpen(open) {
    document.body.classList.toggle("bsosnav-open", open);
    lsSet(LS_OPEN, open ? "1" : "0");
    if (open) {
      filter.focus();
      if (currentLi) currentLi.scrollIntoView({ block: "center" });
    }
  }
  btn.addEventListener("click", function () { setOpen(!document.body.classList.contains("bsosnav-open")); });
  backdrop.addEventListener("click", function () { setOpen(false); });
  root.querySelector(".bsosnav-close").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("bsosnav-open")) setOpen(false);
  });
  if (lsGet(LS_OPEN) === "1") setOpen(true);

  // --- filter: show matches + their ancestors, force-expand while filtering ---
  filter.addEventListener("input", function () {
    var q = filter.value.trim().toLowerCase();
    treeEl.classList.toggle("bsosnav-filtering", !!q);
    var lis = treeEl.querySelectorAll("li[data-key]");
    if (!q) {
      lis.forEach(function (li) {
        li.classList.remove("bsosnav-hidden");
        if (li.classList.contains("bsosnav-dir")) {
          var open = expanded.has(li.dataset.key);
          li.classList.toggle("bsosnav-expanded", open);
          li.classList.toggle("bsosnav-collapsed", !open);
        }
      });
      return;
    }
    lis.forEach(function (li) { li.classList.add("bsosnav-hidden"); });
    lis.forEach(function (li) {
      if (li.dataset.search.indexOf(q) === -1) return;
      var el = li;
      while (el && el !== treeEl) {
        if (el.tagName === "LI") {
          el.classList.remove("bsosnav-hidden");
          if (el.classList.contains("bsosnav-dir")) {
            el.classList.add("bsosnav-expanded"); el.classList.remove("bsosnav-collapsed");
          }
        }
        el = el.parentElement;
      }
    });
  });
})();
