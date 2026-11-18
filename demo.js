/* Static demo: recreates the live app's behaviors without a server. */
(() => {
  const BOOKS = [
    { pk: 2701, title: "Moby Dick", authors: "Melville, Herman", downloads: 51220 },
    { pk: 17452, title: "Romeo and Juliet", authors: "Shakespeare, William", downloads: 40120 },
    { pk: 58890, title: "Alice's Adventures in Wonderland", authors: "Carroll, Lewis", downloads: 84932 },
  ];
  const AUTHOR_NAMES = { 30: "Carroll, Lewis", 57: "Shakespeare, William", 19: "Melville, Herman" };
  const BOOK_TITLES = { 2701: "Moby Dick", 17452: "Romeo and Juliet", 58890: "Alice's Adventures in Wonderland" };
  const PFX = "../".repeat(+document.body.dataset.depth || 0);
  const main = document.querySelector("main .container");
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
    div.textContent = "Demo snapshot with fake data. Nothing you change is saved.";
    div.addEventListener("click", () => div.remove());
    main.prepend(div);
    setTimeout(() => div.remove(), 9000);
  }

  const val = (f, name) => (f.querySelector(`[name=${name}]`) || {}).value || "";

  function cloneRow(tableId, patch) {
    const table = document.getElementById(tableId);
    if (!table) return null;
    const rows = table.tBodies[0];
    const first = rows.querySelector("tr:not(.demo-empty)");
    const tr = document.createElement("tr");
    if (first && !first.classList.contains("empty-row")) {
      tr.innerHTML = first.innerHTML;
      patch(tr);
    } else {
      const empty = rows.querySelector("tr");
      if (empty) empty.remove();
      buildRow(tr, tableId, patch);
    }
    rows.appendChild(tr);
    return tr;
  }

  function buildRow(tr, tableId, data) {
    const unlink = (op, extra) =>
      `<form method="post" action="#" class="inline"><input type="hidden" name="op" value="${op}"><input type="hidden" name="action" value="unlink">${extra}<button class="danger" data-confirm="Unlink in the demo?">${"Unlink"}</button></form>`;
    const map = {
      "authors-table": `<td>${data.name} <span class="meta">#${data.pk}</span></td><td><div class="row-edit tight"><span class="meta">${data.role || "Creator (cr)"}</span></div></td>`,
      "subjects-table": `<td>${data.name}</td><td class="act">${unlink("book_subject", `<input type="hidden" name="fk_subjects" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "categories-table": `<td>${data.name}</td><td class="act">${unlink("book_category", `<input type="hidden" name="fk_categories" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "languages-table": `<td>${data.name}</td><td class="act">${unlink("book_lang", `<input type="hidden" name="fk_langs" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "loccs-table": `<td>${data.name}</td><td class="act">${unlink("book_locc", `<input type="hidden" name="fk_loccs" value="${data.pk}"><input type="hidden" name="fk_books" value="0">`)}</td>`,
      "books-table": `<td>${data.name} <span class="meta">#${data.pk}</span></td><td><div class="row-edit tight"><span class="meta">${data.role || "Creator (cr)"}</span></div></td>`,
      "aliases-table": `<td colspan="2">${data.name} <span class="meta">${data.heading}</span></td><td class="act"><form method="post" action="#"><input type="hidden" name="op" value="alias"><input type="hidden" name="action" value="delete"><button class="danger" data-confirm="Delete in the demo?">Delete</button></form></td>`,
      "urls-table": `<td colspan="2">${data.name} <span class="meta">${data.url}</span></td><td class="act"><form method="post" action="#"><input type="hidden" name="op" value="author_url"><input type="hidden" name="action" value="delete"><button class="danger" data-confirm="Delete in the demo?">Delete</button></form></td>`,
      "attributes-table": `<td>${data.name} <span class="meta">${data.tag}</span></td><td>${data.ind || "  "}</td><td>${data.nonfiling || 0}</td><td>${data.text}</td><td class="act"><form method="post" action="#"><input type="hidden" name="op" value="attribute"><input type="hidden" name="action" value="delete"><button class="danger" data-confirm="Delete in the demo?">Delete</button></form></td>`,
    };
    tr.innerHTML = map[tableId] || `<td>${data.name}</td>`;
  }

  const TABLE_EMPTY = {
    "authors-table": "No authors.",
    "subjects-table": "No subjects linked.",
    "categories-table": "None linked.",
    "languages-table": "None linked.",
    "loccs-table": "None linked.",
    "books-table": "No books linked.",
    "aliases-table": "No aliases.",
    "urls-table": "No URLs.",
    "attributes-table": "No attributes.",
  };

  function addRow(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table) return flash("Linked (demo).");
    const tbody = table.tBodies[0];
    tbody.querySelectorAll("tr .empty, tr td.empty").forEach((td) => td.closest("tr").remove());
    const first = tbody.querySelector("tr td.empty") ? null : tbody.rows[0];
    const tr = document.createElement("tr");
    if (tbody.rows.length && !tbody.rows[0].querySelector("td.empty")) {
      tr.innerHTML = tbody.rows[0].innerHTML;
      if (tableId === "authors-table" || tableId === "books-table") {
        const a = tr.querySelector("a");
        if (a) { a.textContent = data.name; a.removeAttribute("href"); }
        const meta = tr.querySelector(".meta");
        if (meta) meta.textContent = "#" + data.pk;
      } else {
        tr.querySelector("td").innerHTML = `${data.name}` + (tableId === "subjects-table" || tableId === "categories-table" || tableId === "languages-table" || tableId === "loccs-table" ? "" : "");
      }
    } else {
      if (tbody.rows[0] && tbody.rows[0].querySelector("td.empty")) tbody.rows[0].remove();
      buildRow(tr, tableId, data);
    }
    tbody.appendChild(tr);
    flash("Linked (demo).");
  }

  function removeRow(form) {
    const tr = form.closest("tr");
    if (tr) {
      const table = tr.closest("table");
      const emptyText = TABLE_EMPTY[table && table.id] || "None.";
      if (table && table.tBodies[0].rows.length <= 1) {
        tr.innerHTML = `<td colspan="5" class="empty">${emptyText}</td>`;
        flash(table.id === "aliases-table" || table.id === "urls-table" || table.id === "attributes-table" ? "Deleted (demo)." : "Unlinked (demo).");
        return;
      }
      tr.remove();
    }
    flash(form.querySelector('[name=action]').value === "unlink" ? "Unlinked (demo)." : "Deleted (demo).");
  }

  document.addEventListener("DOMContentLoaded", () => {
    banner();

    /* save-on-modify, unsaved warnings, Enter blocking (same as the live app) */
    const base = new Map();
    const snap = (f) => formData(f);
    const dirty = () => [...document.querySelectorAll('form[method="post"]')].some((f) => !f.dataset.sent && base.has(f) && base.get(f) !== snap(f));
    const sync = (f) => { const sv = f.querySelector("button.save"); if (!sv) return; sv.style.display = base.get(f) !== snap(f) ? "" : "none"; };
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

    /* POST forms: simulate every catalog action */
    document.addEventListener("submit", (e) => {
      const f = e.target;
      if (f.getAttribute("method") !== "post") return;
      e.preventDefault();
      if ((f.getAttribute("action") || "").match(/logout/)) return flash("This demo keeps you signed in.", "info");
      const op = val(f, "op");
      const action = val(f, "action") || "link";

      if (action === "update") {
        if (op === "book" || op === "author") {
          base.set(f, snap(f)); sync(f);
          return flash("Saved (demo).");
        }
        if (op === "author_transfer") return flash("Transferred (demo).");
        return flash("Saved (demo).");
      }
      if (action === "unlink" || (action === "delete" && ["alias", "author_url", "attribute"].includes(op))) return removeRow(f);
      if (action === "delete") {
        flash("Deleted (demo).");
        const back = document.querySelector(".links-nav a");
        if (back) setTimeout(() => (location.href = back.href), 900);
        return;
      }
      /* links and creates */
      if (op === "book_author") {
        const pk = +val(f, "fk_authors") || 0;
        const a = f.closest("tr") && f.closest("tr").querySelector("a");
        const name = AUTHOR_NAMES[pk] || (a ? a.textContent : "") || "Author #" + pk;
        const roleSel = f.querySelector('[name=fk_roles]');
        return addRow("authors-table", { name, pk, role: roleSel ? roleSel.options[roleSel.selectedIndex].text : "" });
      }
      if (op === "book_subject") {
        const pk = val(f, "fk_subjects");
        const name = (f.closest("tr") && f.closest("tr").querySelector("a") || {}).textContent || "Subject #" + pk;
        return addRow("subjects-table", { name: name || "Subject #" + pk, pk });
      }
      if (op === "book_category") { const sel = f.querySelector("select"); return addRow("categories-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); }
      if (op === "book_lang") { const sel = f.querySelector("select"); return addRow("languages-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); }
      if (op === "book_locc") { const sel = f.querySelector("select"); return addRow("loccs-table", { name: sel.options[sel.selectedIndex].text, pk: sel.value }); }
      if (op === "attribute") {
        const sel = f.querySelector('[name=fk_attriblist]');
        return addRow("attributes-table", {
          name: sel.options[sel.selectedIndex].text, tag: val(f, "fk_attriblist"),
          text: val(f, "text"), ind: val(f, "indicators") || "  ", nonfiling: val(f, "nonfiling") || 0,
        });
      }
      if (op === "alias") return addRow("aliases-table", { name: val(f, "alias"), heading: val(f, "heading") === "1" ? "Yes" : "No" });
      if (op === "author_url") return addRow("urls-table", { name: val(f, "description") || val(f, "url"), url: val(f, "url") });
      if (op === "author") return addRow("authors-list", { name: val(f, "author"), pk: "new", role: "", heading: "" });
      if (op === "subject" || op === "category" || op === "lang" || op === "locc") {
        const body = document.getElementById("rows-table");
        if (body) {
          const name = val(f, op === "subject" ? "subject" : op === "category" ? "category" : op === "lang" ? "lang" : "locc");
          const tr = document.createElement("tr");
          tr.innerHTML = `<td class="num">${val(f, "pk") || "new"}</td><td>${name}</td>`;
          body.tBodies[0].appendChild(tr);
        }
        return flash("Added (demo).");
      }
      /* author page: link ebooks by number */
      if (f.querySelector('[name=book_pks]')) {
        const ids = (val(f, "book_pks").match(/\d+/g) || []).slice(0, 8);
        if (!ids.length) return flash("Enter at least one ebook number.", "error");
        ids.forEach((pk) => addRow("books-table", { name: BOOK_TITLES[+pk] || "Ebook #" + pk, pk, role: "" }));
        return;
      }
      flash("Linked (demo).");
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
      const qOf0 = (n) => { const el = f.querySelector('input[name="' + n + '"][type="search"]'); return el ? el.value : null; };
      const q = qOf0("q") || qOf0("aq") || qOf0("sq") || qOf0("bq") || qOf0("tq") || "";

      const booksBody = document.getElementById("books-body");
      if (booksBody) {
        const pks = q.match(/\d+/);
        const matches = BOOKS.filter((b) => !q || b.title.toLowerCase().includes(q.toLowerCase()) || b.authors.toLowerCase().includes(q.toLowerCase()) || (pks && +pks[0] === b.pk));
        booksBody.innerHTML = matches.length
          ? matches.map((b) => `<tr><td class="num">${b.pk}</td><td><a href="${PFX}book/${b.pk}/">${b.title}</a> <span class="meta">${b.authors}</span></td><td class="num">${b.downloads}</td></tr>`).join("")
          : `<tr><td colspan="3" class="empty">No ebooks matched \u201C${q}\u201D.</td></tr>`;
        return;
      }
      const qOf = (n) => { const el = f.querySelector('input[name="' + n + '"][type="search"]'); return el ? el.value : null; };
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

    /* reports page: only the default report is in the demo */
    document.addEventListener("change", (e) => {
      if (e.target.matches("select[data-autosubmit]")) {
        e.preventDefault();
        if (e.target.name === "days") return;
        flash("The demo includes only the Books lacking report.", "info");
      }
    });
  });
})();
