/* Static demo: recreates the live app's behaviors without a server.
   localStorage acts as the demo database: every save/link/unlink/delete
   writes a page snapshot that is restored on revisit and cleared on refresh. */
(() => {
  const BOOKS = [
    { pk: 2701, title: "Moby Dick", authors: "Melville, Herman", downloads: 51220 },
    { pk: 17452, title: "Romeo and Juliet", authors: "Shakespeare, William", downloads: 40120 },
    { pk: 58890, title: "Alice's Adventures in Wonderland", authors: "Carroll, Lewis", downloads: 84932 },
  ];
  const AUTHOR_NAMES = { 19: "Melville, Herman", 30: "Carroll, Lewis", 57: "Shakespeare, William", 88: "Anonymous" };
  const BOOK_TITLES = { 2701: "Moby Dick", 17452: "Romeo and Juliet", 58890: "Alice's Adventures in Wonderland" };
  const PFX = "../".repeat(+document.body.dataset.depth || 0);
  const main = document.querySelector("main .container");
  const STATE_KEY = "catalog-demo:page:" + location.pathname;
  const formData = (f) => JSON.stringify([...new FormData(f)].sort());

  function flash(text, kind = "success") {
    const div = document.createElement("div");
    div.className = "msg " + kind;
    div.textContent = text;
    div.addEventListener("click", () => div.remove());
    main.prepend(div);
    while (main.querySelectorAll(".msg.demo").length > 3) main.querySelector(".msg.demo").remove();
    setTimeout(() => div.remove(), 2800);
  }

  function banner() {
    const div = document.createElement("div");
    div.className = "msg info demo";
    div.textContent = "Demo snapshot with fake data. Your changes are kept in this browser until you refresh.";
    div.addEventListener("click", () => div.remove());
    main.prepend(div);
    setTimeout(() => div.remove(), 9000);
  }

  /* ---- the demo database: snapshot of every saved table + the record form ---- */
  function saveForm() {
    const sf = document.querySelector("button.save") ? document.querySelector("button.save").closest("form") : null;
    if (!sf) return {};
    const form = {};
    for (const [k, v] of new FormData(sf)) form[k] = v;
    for (const cb of sf.querySelectorAll("input[type=checkbox]")) form["cb:" + cb.name] = cb.checked ? "1" : "0";
    return form;
  }

  function saveState() {
    const state = { form: saveForm(), tables: {} };
    for (const t of document.querySelectorAll("table[id]")) {
      if (/hits$/.test(t.id) || t.id === "books-body") continue;
      state.tables[t.id] = t.outerHTML;
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function applyState(state) {
    if (!state) return false;
    let touched = false;
    if (state.form && Object.keys(state.form).length) {
      const sf = document.querySelector("button.save") ? document.querySelector("button.save").closest("form") : null;
      if (sf) {
        for (const [k, v] of Object.entries(state.form)) {
          if (k.startsWith("cb:")) {
            const cb = sf.querySelector('[name="' + k.slice(3) + '"]');
            if (cb) { cb.checked = v === "1"; touched = true; }
            continue;
          }
          const el = sf.querySelector('[name="' + k + '"]');
          if (el && el.type !== "hidden") { el.value = v; touched = true; }
        }
      }
    }
    for (const [id, html] of Object.entries(state.tables || {})) {
      const t = document.getElementById(id);
      if (t) { t.outerHTML = html; touched = true; }
    }
    return touched;
  }

  const val = (f, name) => (f.querySelector(`[name=${name}]`) || {}).value || "";

  function buildRow(tr, tableId, data) {
    const unlink = (op, extra) =>
      `<form method="post" action="#" class="inline"><input type="hidden" name="op" value="${op}"><input type="hidden" name="action" value="unlink">${extra}<button class="danger" data-confirm="Unlink in the demo?">Unlink</button></form>`;
    const del = (op) =>
      `<form method="post" action="#" class="inline"><input type="hidden" name="op" value="${op}"><input type="hidden" name="action" value="delete"><button class="danger" data-confirm="Delete in the demo?">Delete</button></form>`;
    const map = {
      "authors-table": `<td>${data.name} <span class="meta">#${data.pk}</span></td><td><div class="row-edit tight"><span class="meta">${data.role || "Creator (cr)"}</span></div></td>`,
      "subjects-table": `<td>${data.name}</td><td class="act">${unlink("book_subject", `<input type="hidden" name="fk_subjects" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "categories-table": `<td>${data.name}</td><td class="act">${unlink("book_category", `<input type="hidden" name="fk_categories" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "languages-table": `<td>${data.name}</td><td class="act">${unlink("book_lang", `<input type="hidden" name="fk_langs" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "loccs-table": `<td>${data.name}</td><td class="act">${unlink("book_locc", `<input type="hidden" name="fk_loccs" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "books-table": `<td>${data.name} <span class="meta">#${data.pk}</span></td><td><div class="row-edit tight"><span class="meta">${data.role || "Creator (cr)"}</span></div></td>`,
      "aliases-table": `<td colspan="2">${data.name} <span class="meta">${data.heading}</span></td><td class="act">${del("alias")}</td>`,
      "urls-table": `<td colspan="2">${data.name} <span class="meta">${data.url}</span></td><td class="act">${del("author_url")}</td>`,
      "attributes-table": `<td>${data.name} <span class="meta">${data.tag}</span></td><td>${data.ind || "  "}</td><td>${data.nonfiling || 0}</td><td>${data.text}</td><td class="act">${del("attribute")}</td>`,
    };
    tr.innerHTML = map[tableId] || `<td>${data.name}</td>`;
  }

  function addRow(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table) return flash("Linked (demo).");
    const tbody = table.tBodies[0];
    if (tbody.rows[0] && tbody.rows[0].querySelector("td.empty")) tbody.rows[0].remove();
    const tr = document.createElement("tr");
    if (tbody.rows.length) {
      tr.innerHTML = tbody.rows[0].innerHTML;
      if (tableId === "authors-table" || tableId === "books-table") {
        const a = tr.querySelector("a");
        if (a) { a.textContent = data.name; a.removeAttribute("href"); }
        const meta = tr.querySelector(".meta");
        if (meta) meta.textContent = "#" + data.pk;
      } else {
        tr.querySelector("td").textContent = data.name;
      }
    } else {
      buildRow(tr, tableId, data);
    }
    tbody.appendChild(tr);
    flash("Linked (demo).");
  }

  function removeRow(form) {
    const tr = form.closest("tr");
    const action = (form.querySelector("[name=action]") || {}).value;
    const verb = action === "unlink" ? "Unlinked (demo)." : "Deleted (demo).";
    if (!tr) return flash(verb);
    tr.remove();
    flash(verb);
  }

  document.addEventListener("DOMContentLoaded", () => {
    banner();

    /* demo database: refresh clears it, revisits restore it */
    const last = sessionStorage.getItem("catalog-demo:last");
    sessionStorage.setItem("catalog-demo:last", location.pathname);
    let restored = false;
    if (last === location.pathname) {
      Object.keys(localStorage).filter((k) => k.indexOf("catalog-demo:") === 0).forEach((k) => localStorage.removeItem(k));
      flash("Demo changes cleared on refresh.", "info");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
        if (saved) restored = applyState(saved);
      } catch (err) { /* ignore */ }
    }

    /* save-on-modify, unsaved warnings, Enter blocking (same as the live app) */
    const base = new Map();
    const snap = (f) => formData(f);
    const dirty = () => [...document.querySelectorAll('form[method="post"]')].some((f) => !f.dataset.sent && base.has(f) && base.get(f) !== snap(f));
    const sync = (f) => {
      const sv = f.querySelector("button.save");
      if (!sv) return;
      const dirtyForm = base.get(f) !== snap(f);
      sv.style.display = "";
      sv.style.opacity = dirtyForm ? "" : "0.45";
      sv.title = dirtyForm ? "" : "Modify a field to enable Save";
    };
    for (const f of document.querySelectorAll('form[method="post"]')) {
      base.set(f, snap(f));
      f.addEventListener("submit", () => (f.dataset.sent = "1"));
      if (f.querySelector("button.save")) { sync(f); f.addEventListener("input", () => sync(f)); f.addEventListener("change", () => sync(f)); }
    }
    addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.getAttribute("href").charAt(0) === "#") return;
      if (a.closest("header") && /password/.test(a.href)) { e.preventDefault(); return flash("Change password is not part of this demo.", "info"); }
      if (a.closest("header") && /logout/.test(a.href)) { e.preventDefault(); return flash("This demo keeps you signed in.", "info"); }
      if (!dirty()) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
    }, true);
    document.addEventListener("keydown", (e) => {
      const f = e.target.closest("form");
      if (e.key === "Enter" && f && f.querySelector("button.save") && e.target.tagName === "INPUT") e.preventDefault();
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-confirm]");
      if (b && !window.confirm(b.getAttribute("data-confirm"))) { e.preventDefault(); e.stopPropagation(); }
    });
    if (restored) flash("Restored the changes you saved earlier (demo).", "info");

    /* POST forms: simulate every catalog action, then write the demo database */
    document.addEventListener("submit", (e) => {
      const f = e.target;
      if (f.getAttribute("method") !== "post") return;
      e.preventDefault();
      if ((f.getAttribute("action") || "").match(/logout/)) return flash("This demo keeps you signed in.", "info");
      const op = val(f, "op");
      const action = val(f, "action") || "link";

      if (action === "update") {
        if (op === "author_transfer") { flash("Transferred (demo)."); return saveState(); }
        if (f.querySelector("button.save")) {
          base.set(f, snap(f));
          sync(f);
          const sv = f.querySelector("button.save");
          if (sv) {
            const old = sv.textContent;
            sv.textContent = "Saved \u2713";
            sv.style.display = "";
            setTimeout(() => { sv.textContent = old; sync(f); }, 1200);
          }
          flash("Saved (demo). Kept in your browser until you refresh.");
          return saveState();
        }
        flash("Saved (demo).");
        return saveState();
      }
      if (action === "unlink" || (action === "delete" && ["alias", "author_url", "attribute"].includes(op))) {
        removeRow(f);
        return saveState();
      }
      if (action === "delete") {
        flash("Deleted (demo).");
        const back = document.querySelector(".links-nav a");
        setTimeout(() => { if (back) location.href = back.href; }, 900);
        return saveState();
      }
      /* links and creates */
      if (op === "book_author") {
        const pk = +val(f, "fk_authors") || 0;
        const a = f.closest("tr") && f.closest("tr").querySelector("a");
        const name = AUTHOR_NAMES[pk] || (a ? a.textContent : "") || "Author #" + pk;
        const roleSel = f.querySelector("[name=fk_roles]");
        addRow("authors-table", { name, pk, role: roleSel ? roleSel.options[roleSel.selectedIndex].text : "" });
        return saveState();
      }
      if (op === "book_subject") {
        const pk = val(f, "fk_subjects");
        const a = f.closest("tr") && f.closest("tr").querySelector("a");
        const name = (a ? a.textContent : "") || "Subject #" + pk;
        addRow("subjects-table", { name, pk });
        return saveState();
      }
      if (op === "book_category") { const sel = f.querySelector("select"); addRow("categories-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); return saveState(); }
      if (op === "book_lang") { const sel = f.querySelector("select"); addRow("languages-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); return saveState(); }
      if (op === "book_locc") { const sel = f.querySelector("select"); addRow("loccs-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); return saveState(); }
      if (op === "attribute") {
        const sel = f.querySelector("[name=fk_attriblist]");
        addRow("attributes-table", {
          name: sel.options[sel.selectedIndex].text, tag: val(f, "fk_attriblist"),
          text: val(f, "text"), ind: val(f, "indicators") || "  ", nonfiling: val(f, "nonfiling") || 0,
        });
        return saveState();
      }
      if (op === "alias") { addRow("aliases-table", { name: val(f, "alias"), heading: val(f, "heading") === "1" ? "Yes" : "No" }); return saveState(); }
      if (op === "author_url") { addRow("urls-table", { name: val(f, "description") || val(f, "url"), url: val(f, "url") }); return saveState(); }
      if (op === "author") { addRow("authors-list", { name: val(f, "author"), pk: "new" }); return saveState(); }
      if (["subject", "category", "lang", "locc"].includes(op)) {
        const body = document.getElementById("rows-table");
        if (body) {
          const name = val(f, op === "subject" ? "subject" : op === "category" ? "category" : op === "lang" ? "lang" : "locc");
          const tr = document.createElement("tr");
          tr.innerHTML = `<td class="num">${val(f, "pk") || "new"}</td><td>${name}</td>`;
          body.tBodies[0].appendChild(tr);
        }
        flash("Added (demo).");
        return saveState();
      }
      /* author page: link ebooks by number */
      if (f.querySelector("[name=book_pks]")) {
        const ids = (val(f, "book_pks").match(/\d+/g) || []).slice(0, 8);
        if (!ids.length) return flash("Enter at least one ebook number.", "error");
        ids.forEach((pk) => addRow("books-table", { name: BOOK_TITLES[+pk] || "Ebook #" + pk, pk, role: "" }));
        return saveState();
      }
      flash("Linked (demo).");
      saveState();
    });

    /* GET search forms: client-side filtering over the demo snapshot */
    const snapshots = new Map();
    const tableOf = (el) => (el ? (el.tBodies ? el : el.querySelector("table")) : null);
    const rowsOf = (el) => { const t = tableOf(el); return t && t.tBodies[0] ? Array.from(t.tBodies[0].rows).map((r) => ({ row: r.cloneNode(true), text: r.textContent.toLowerCase() })) : []; };
    const remember = (el) => { if (el) snapshots.set(el, rowsOf(el)); };
    ["author-hits", "subject-hits", "book-hits", "transfer-hits", "rows-table"].forEach((id) => remember(document.getElementById(id)));

    function filterTable(el, query, emptyText) {
      const t = tableOf(el);
      if (!t) return;
      const rows = snapshots.get(el) || rowsOf(el);
      const q = query.trim().toLowerCase();
      el.hidden = false;
      const tbody = t.tBodies[0];
      tbody.innerHTML = "";
      let shown = 0;
      rows.forEach(({ row, text }) => {
        if (!q || text.includes(q) || ("#" + row.textContent).includes(q)) { tbody.appendChild(row); shown++; }
      });
      if (!shown) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4" class="empty">${emptyText}</td>`;
        tbody.appendChild(tr);
      }
    }

    document.addEventListener("submit", (e) => {
      const f = e.target;
      if (f.getAttribute("method") !== "get" || !f.querySelector("input[type=search], input[name=q]")) return;
      e.preventDefault();
      const qOf = (n) => { const el = f.querySelector('input[name="' + n + '"][type="search"]'); return el ? el.value : null; };
      const q = qOf("q") || qOf("aq") || qOf("sq") || qOf("bq") || qOf("tq") || "";

      const booksBody = document.getElementById("books-body");
      if (booksBody) {
        const pks = q.match(/\d+/);
        const matches = BOOKS.filter((b) => !q || b.title.toLowerCase().includes(q.toLowerCase()) || b.authors.toLowerCase().includes(q.toLowerCase()) || (pks && +pks[0] === b.pk));
        booksBody.innerHTML = matches.length
          ? matches.map((b) => `<tr><td class="num">${b.pk}</td><td><a href="${PFX}book/${b.pk}/">${b.title}</a> <span class="meta">${b.authors}</span></td><td class="num">${b.downloads}</td></tr>`).join("")
          : `<tr><td colspan="3" class="empty">No ebooks matched \u201C${q}\u201D.</td></tr>`;
        return;
      }
      const ah = document.getElementById("author-hits");
      if (ah && qOf("aq") !== null) { ah.hidden = false; return filterTable(ah, q, "No authors matched."); }
      const sh = document.getElementById("subject-hits");
      if (sh && qOf("sq") !== null) { sh.hidden = false; return filterTable(sh, q, "No subjects matched."); }
      const bh = document.getElementById("book-hits");
      if (bh && qOf("bq") !== null) { bh.hidden = false; return filterTable(bh, q, "No ebooks matched."); }
      const th = document.getElementById("transfer-hits");
      if (th && qOf("tq") !== null) { th.hidden = false; return filterTable(th, q, "No authors matched."); }
      const rt = document.getElementById("rows-table");
      if (rt && qOf("q") !== null) return filterTable(rt, q, "No matches.");
    });

    /* reports page: switch between the three demo reports */
    document.addEventListener("change", (e) => {
      if (e.target.matches("select[data-autosubmit]")) {
        e.preventDefault();
        if (e.target.name === "days") return;
        document.querySelectorAll('[id^="report-"]').forEach((d) => (d.hidden = d.id !== "report-" + e.target.value));
      }
    });
  });
})();
