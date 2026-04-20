(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var slug = script.getAttribute("data-product");
  var accent = script.getAttribute("data-accent") || "#1a4a2e";

  if (!slug) return;

  var STORAGE_KEY = "policypen_dismissed_" + slug;
  if (localStorage.getItem(STORAGE_KEY) === "1") return;

  var BASE_URL = script.src.replace(/\/widget\.js.*$/, "");

  function render(data) {
    if (!data || !data.policies || data.policies.length === 0) return;

    var bar = document.createElement("div");
    bar.id = "policypen-widget";
    bar.style.cssText = [
      "position:fixed",
      "bottom:0",
      "left:0",
      "right:0",
      "z-index:2147483647",
      "background:#fefcf8",
      "border-top:1px solid #e4dfd3",
      "padding:8px 16px",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "font-size:12px",
      "color:#7a7060",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "gap:8px",
      "flex-wrap:wrap",
    ].join(";");

    var links = data.policies.map(function (p) {
      var a = document.createElement("a");
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = p.label;
      a.style.cssText = "color:" + accent + ";text-decoration:none;";
      a.addEventListener("mouseover", function () { a.style.textDecoration = "underline"; });
      a.addEventListener("mouseout", function () { a.style.textDecoration = "none"; });
      return a;
    });

    var inner = document.createElement("span");
    inner.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;";

    links.forEach(function (link, i) {
      inner.appendChild(link);
      if (i < links.length - 1) {
        var sep = document.createElement("span");
        sep.textContent = "·";
        sep.style.color = "#d4cfc2";
        inner.appendChild(sep);
      }
    });

    var pipe = document.createElement("span");
    pipe.textContent = "|";
    pipe.style.cssText = "color:#d4cfc2;margin:0 2px;";
    inner.appendChild(pipe);

    var brand = document.createElement("a");
    brand.href = "https://policypen.io";
    brand.target = "_blank";
    brand.rel = "noopener noreferrer";
    brand.textContent = "Powered by PolicyPen";
    brand.style.cssText = "color:#7a7060;text-decoration:none;";
    brand.addEventListener("mouseover", function () { brand.style.textDecoration = "underline"; });
    brand.addEventListener("mouseout", function () { brand.style.textDecoration = "none"; });
    inner.appendChild(brand);

    var dismiss = document.createElement("button");
    dismiss.textContent = "×";
    dismiss.setAttribute("aria-label", "Dismiss");
    dismiss.style.cssText = [
      "background:none",
      "border:none",
      "cursor:pointer",
      "font-size:16px",
      "line-height:1",
      "color:#7a7060",
      "padding:0 0 0 8px",
      "margin-left:4px",
      "flex-shrink:0",
    ].join(";");
    dismiss.addEventListener("click", function () {
      localStorage.setItem(STORAGE_KEY, "1");
      bar.remove();
    });

    bar.appendChild(inner);
    bar.appendChild(dismiss);
    document.body.appendChild(bar);
  }

  fetch(BASE_URL + "/api/widget/" + encodeURIComponent(slug))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data) render(data); })
    .catch(function () {});
})();
