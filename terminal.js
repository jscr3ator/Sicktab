const $ = (id) => document.getElementById(id);
const form = $("terminal-form"), input = $("command"), hint = $("hint");
const layout = $("terminal-layout"), autoPanel = $("auto-panel");
const panel = $("settings-panel"), btn = $("settings-toggle"), engine = $("search-engine");
const newTab = $("open-new-tab"), clock24 = $("clock-24h"), secs = $("show-seconds");
const bang = $("custom-bang"), bangUrl = $("custom-url"), addBang = $("add-bang"), autoList = $("auto-panel-list");
const clearBtn = $("clear-suggestions");
const KEY = "sicktab:settings", DEF = { searchEngine: "duckduckgo", openInNewTab: false, use24Hour: false, showSeconds: true, customBangs: {}, history: [], hiddenSuggestions: [] };
const SEARCH = { duckduckgo: "https://duckduckgo.com/?q=", google: "https://www.google.com/search?q=", brave: "https://search.brave.com/search?q=", bing: "https://www.bing.com/search?q=" };
const BANGS = ["!g", "!yt", "!w", "!gh", "!r", "!so", "!maps"];

const load = () => { try { return { ...DEF, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }; } catch { return { ...DEF }; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
const state = load();
const maxSuggestions = () => (window.matchMedia("(max-width: 640px)").matches ? 2 : 3);

const updateAuto = () => {
  const query = input.value.trim().toLowerCase();
  if (!query) {
    autoPanel.hidden = true;
    layout.classList.remove("with-suggestions");
    autoList.innerHTML = "";
    return;
  }
  autoPanel.hidden = false;
  layout.classList.add("with-suggestions");
  const custom = Object.keys(state.customBangs || {}).map((k) => `!${k}`);
  const hidden = new Set(state.hiddenSuggestions || []);
  const allItems = [...new Set([...(state.history || []), ...BANGS, ...custom])];
  const items = allItems.filter((v) => !hidden.has(v) && (!query || v.toLowerCase().includes(query))).slice(0, maxSuggestions());
  autoList.innerHTML = items.length
    ? items.map((v) => `<li data-value="${v.replace(/"/g, "&quot;")}"><span>${v}</span><button class="remove-suggestion" type="button" data-remove="${v.replace(/"/g, "&quot;")}">×</button></li>`).join("")
    : '<li class="empty">no matches</li>';
};

const updateUI = () => {
  engine.value = state.searchEngine; newTab.checked = state.openInNewTab; clock24.checked = state.use24Hour; secs.checked = state.showSeconds;
  hint.textContent = `Try: !g linux, !yt terminal, github.com, or any query (${engine.options[engine.selectedIndex].text})`;
  updateAuto();
};

const toTarget = (raw) => {
  const v = raw.trim(); if (!v) return "";
  const m = v.match(/^!(\w+)\s*(.*)$/);
  if (m) {
    const k = m[1].toLowerCase(), q = m[2] || "";
    const tpl = state.customBangs?.[k];
    if (tpl) return tpl.includes("%s") ? tpl.replace("%s", encodeURIComponent(q)) : `${tpl}${encodeURIComponent(q)}`;
    return `https://duckduckgo.com/?q=${encodeURIComponent(`!${k} ${q}`.trim())}`;
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(v)) return v;
  if (!/\s/.test(v) && /^(localhost(:\d+)?|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/.test(v)) return `https://${v}`;
  return `${SEARCH[state.searchEngine] || SEARCH.duckduckgo}${encodeURIComponent(v)}`;
};

form.addEventListener("submit", (e) => {
  e.preventDefault(); const url = toTarget(input.value); if (!url) return;
  const q = input.value.trim(); if (q) { state.history = [q, ...(state.history || []).filter((x) => x !== q)].slice(0, 30); save(state); updateAuto(); }
  state.openInNewTab ? window.open(url, "_blank", "noopener,noreferrer") : window.location.assign(url);
});

btn.addEventListener("click", (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) engine.focus(); });
document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); input.select(); }
  if (e.key === "Escape") { if (!panel.hidden) panel.hidden = true; else if (document.activeElement === input) { input.value = ""; input.blur(); } }
});

[engine, newTab, clock24, secs].forEach((el) => el.addEventListener("change", () => {
  state.searchEngine = engine.value; state.openInNewTab = newTab.checked; state.use24Hour = clock24.checked; state.showSeconds = secs.checked;
  save(state); updateUI();
}));

input.addEventListener("input", updateAuto);
autoList.addEventListener("click", (e) => {
  const remove = e.target.closest("button[data-remove]");
  if (remove) {
    const val = remove.dataset.remove;
    state.hiddenSuggestions = [...new Set([...(state.hiddenSuggestions || []), val])];
    state.history = (state.history || []).filter((x) => x !== val);
    save(state); updateAuto();
    return;
  }
  const li = e.target.closest("li[data-value]");
  if (!li) return;
  input.value = li.dataset.value;
  input.focus();
  updateAuto();
});

clearBtn.addEventListener("click", () => {
  const custom = Object.keys(state.customBangs || {}).map((k) => `!${k}`);
  const allItems = [...new Set([...(state.history || []), ...BANGS, ...custom])];
  state.hiddenSuggestions = [...new Set([...(state.hiddenSuggestions || []), ...allItems])];
  state.history = [];
  save(state);
  updateAuto();
});

addBang.addEventListener("click", () => {
  const k = bang.value.trim().toLowerCase().replace(/^!/, ""), u = bangUrl.value.trim();
  if (!k || !u) return;
  state.customBangs[k] = /^https?:\/\//.test(u) ? u : `https://${u}`;
  bang.value = ""; bangUrl.value = ""; save(state); updateUI();
});

updateUI();
input.focus();
window.addEventListener("resize", updateAuto);
