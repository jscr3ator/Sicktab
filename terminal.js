const $ = (id) => document.getElementById(id);
const form = $("terminal-form"), input = $("command"), hint = $("hint");
const layout = $("terminal-layout"), autoPanel = $("auto-panel");
const panel = $("settings-panel"), btn = $("settings-toggle"), engine = $("search-engine"), themeSel = $("theme-select");
const newTab = $("open-new-tab"), clock24 = $("clock-24h"), secs = $("show-seconds");
const bang = $("custom-bang"), bangUrl = $("custom-url"), addBang = $("add-bang"), autoList = $("auto-panel-list");
const bangsPopup = $("bangs-popup"), openBangsPopup = $("open-bangs-popup"), closeBangsPopup = $("close-bangs-popup"), bangsList = $("bangs-list");
const clearBtn = $("clear-suggestions");
const KEY = "sicktab:settings", DEF = { searchEngine: "google", theme: "dark", openInNewTab: false, use24Hour: false, showSeconds: true, bangPrefix: "!", customBangs: {}, history: [], hiddenSuggestions: [] };
const SEARCH = { google: "https://www.google.com/search?q=", brave: "https://search.brave.com/search?q=", bing: "https://www.bing.com/search?q=" };
const BANGS = [];
const THEMES = ["dark", "matrix", "dracula", "amber"];
const bangPrefix = () => state.bangPrefix || "!";
const focusInput = () => {
  if (!input) return;
  input.focus({ preventScroll: true });
};
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
  const custom = Object.keys(state.customBangs || {}).map((k) => `${bangPrefix()}${k}`);
  const hidden = new Set(state.hiddenSuggestions || []);
  const allItems = [...new Set([...(state.history || []), ...BANGS.map((k) => `${bangPrefix()}${k}`), ...custom])];
  const items = allItems.filter((v) => !hidden.has(v) && (!query || v.toLowerCase().includes(query))).slice(0, maxSuggestions());
  autoList.innerHTML = items.length
    ? items.map((v) => `<li data-value="${v.replace(/"/g, "&quot;")}"><span>${v}</span><button class="remove-suggestion" type="button" data-remove="${v.replace(/"/g, "&quot;")}">×</button></li>`).join("")
    : '<li class="empty">no matches</li>';
};

const renderCustomBangs = () => {
  const entries = Object.entries(state.customBangs || {}).sort(([a], [b]) => a.localeCompare(b));
  if (!bangsList) return;
  bangsList.innerHTML = entries.length
    ? entries.map(([k, u]) => `<li><span class="bang-key">${bangPrefix()}${k}</span><span class="bang-url">${u.replace(/</g, "&lt;")}</span><button class="remove-bang" type="button" data-bang="${k}">×</button></li>`).join("")
    : '<li class="empty">no custom bangs yet</li>';
};

const openBangs = () => {
  if (!bangsPopup) return;
  bangsPopup.hidden = false;
  renderCustomBangs();
  bang?.focus();
};

const closeBangs = () => {
  if (!bangsPopup) return;
  bangsPopup.hidden = true;
};

const updateUI = () => {
  engine.value = state.searchEngine; newTab.checked = state.openInNewTab; clock24.checked = state.use24Hour; secs.checked = state.showSeconds;
  const theme = THEMES.includes(state.theme) ? state.theme : "dark";
  if (themeSel) themeSel.value = theme;
  document.body.dataset.theme = theme;
  if (hint) hint.textContent = `Try: ${bangPrefix()}mybang query, github.com, or any query (${engine.options[engine.selectedIndex].text})`;
  updateAuto();
  renderCustomBangs();
};

//ai
const toTarget = (raw) => {
  const v = raw.trim(); if (!v) return "";
  const m = v.match(new RegExp(`^${(bangPrefix()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\w+)\\s*(.*)$`));
  if (m) {
    const k = m[1].toLowerCase(), q = m[2] || "";
    const tpl = state.customBangs?.[k];
    if (tpl) return tpl.includes("%s") ? tpl.replace("%s", encodeURIComponent(q)) : `${tpl}${encodeURIComponent(q)}`;
    return "";
  } 
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(v)) return v;
  if (!/\s/.test(v) && /^(localhost(:\d+)?|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/.test(v)) return `https://${v}`;
  return `${SEARCH[state.searchEngine] || SEARCH.google}${encodeURIComponent(v)}`;
};

form.addEventListener("submit", (e) => {
  e.preventDefault(); const url = toTarget(input.value); if (!url) return;
  const q = input.value.trim(); if (q) { state.history = [q, ...(state.history || []).filter((x) => x !== q)].slice(0, 30); save(state); updateAuto(); }
  state.openInNewTab ? window.open(url, "_blank", "noopener,noreferrer") : window.location.assign(url);
});
//ai end
btn.addEventListener("click", (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) engine.focus(); });
document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); input.select(); }
  if (e.key === "Escape") {
    if (bangsPopup && !bangsPopup.hidden) closeBangs();
    else if (!panel.hidden) panel.hidden = true;
    else if (document.activeElement === input) { input.value = ""; input.blur(); }
  }
});

[engine, newTab, clock24, secs].forEach((el) => el.addEventListener("change", () => {
  state.searchEngine = engine.value; state.openInNewTab = newTab.checked; state.use24Hour = clock24.checked; state.showSeconds = secs.checked;
  save(state); updateUI();
}));

themeSel?.addEventListener("change", () => {
  state.theme = THEMES.includes(themeSel.value) ? themeSel.value : "dark";
  save(state); updateUI();
});

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
  const custom = Object.keys(state.customBangs || {}).map((k) => `${bangPrefix()}${k}`);
  const allItems = [...new Set([...(state.history || []), ...BANGS.map((k) => `${bangPrefix()}${k}`), ...custom])];
  state.hiddenSuggestions = [...new Set([...(state.hiddenSuggestions || []), ...allItems])];
  state.history = [];
  save(state);
  updateAuto();
});

openBangsPopup?.addEventListener("click", (e) => {
  e.stopPropagation();
  openBangs();
});

closeBangsPopup?.addEventListener("click", closeBangs);

bangsPopup?.addEventListener("click", (e) => {
  if (e.target === bangsPopup) closeBangs();
});

addBang.addEventListener("click", () => {
  const raw = bang.value.trim().toLowerCase(), p = raw && !/[a-z0-9_]/.test(raw[0]) ? raw[0] : bangPrefix(), k = raw.replace(/^\W/, ""), u = bangUrl.value.trim();
  if (!k || !u) return;
  state.bangPrefix = p;
  state.customBangs[k] = /^https?:\/\//.test(u) ? u : `https://${u}`;
  bang.value = ""; bangUrl.value = ""; save(state); updateUI();
  bang.focus();
});

bangsList?.addEventListener("click", (e) => {
  const remove = e.target.closest("button[data-bang]");
  if (!remove) return;
  const key = remove.dataset.bang;
  if (!key || !state.customBangs?.[key]) return;
  delete state.customBangs[key];
  save(state);
  updateUI();
});

updateUI();
focusInput();
requestAnimationFrame(focusInput);
setTimeout(focusInput, 50);
window.addEventListener("focus", focusInput);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) focusInput();
});
window.addEventListener("resize", updateAuto);
