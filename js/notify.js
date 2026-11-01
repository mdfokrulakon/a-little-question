/* Email notifications via FormSubmit (AJAX). Silent by design: never throws, never touches the UI. */
(() => {
  window.Notifier = config => {
  /* ---------- Email notifications (FormSubmit, AJAX, silent) ---------- */
    const SENT_KEY = "loveNoteSent";
    const sent = new Set();
    const inflight = new Set();
    const failed = new Map(); // key -> payload, retried on the next event

    try { JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]").forEach(k => sent.add(k)); } catch (e) {}
    const remember = key => {
      sent.add(key);
      try { sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent])); } catch (e) {}
    };

    function timestamp() {
      let zone = "";
      try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
      const when = new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "medium" });
      return zone ? `${when} (${zone})` : when;
    }

    async function post(key, payload) {
      if (!config.formEndpoint || sent.has(key) || inflight.has(key)) return;
      inflight.add(key); // blocks duplicate clicks while the request is running
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        try {
          const res = await fetch(config.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          ok = res.ok && data.success !== "false" && data.success !== false;
        } catch (e) { /* offline or blocked: handled below */ }
        if (!ok && attempt === 0) await new Promise(r => setTimeout(r, 2500));
      }
      inflight.delete(key);
      if (ok) { failed.delete(key); remember(key); }
      else { failed.set(key, payload); console.warn("Notification could not be sent; will retry on next action."); }
    }

    // Never throws and never touches the UI, so the romantic flow can't be interrupted.
    function notify(key, subject, fields) {
      failed.forEach((payload, k) => { if (k !== key) post(k, payload); });
      post(key, {
        _subject: subject,
        _template: "table",
        _captcha: "false",
        _honey: "", // spam trap: real visitors never fill this
        "Website": document.title,
        ...fields,
        "Submitted at": timestamp(),
        "Website URL": location.href.split("#")[0]
      });
    }

    return { notify };
  };
})();
