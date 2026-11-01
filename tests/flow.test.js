const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const html = read("index.html").replace(/<script src[^>]*><\/script>/g, "").replace(/<link[^>]*>/g, "");

async function visit(steps, { fail = false } = {}) {
  const w = new JSDOM(html, { runScripts: "outside-only", url: "https://example.vercel.app/" }).window;
  const calls = [];
  w.fetch = async (url, opt) => {
    calls.push(JSON.parse(opt.body));
    if (fail) throw new Error("offline");
    return { ok: true, json: async () => ({ success: "true" }) };
  };
  w.matchMedia = () => ({ matches: true });
  w.scrollTo = () => {};
  ["js/config.js", "js/notify.js", "js/script.js"].forEach(f => w.eval(read(f)));
  const $ = s => w.document.querySelector(s);
  const click = s => $(s).click();
  await steps({ $, click, w });
  await new Promise(r => setTimeout(r, fail ? 3000 : 50));
  return { calls, active: $(".scene.active").id, $ };
}
const accept = date => ({ click }) => { click("#yesBtn"); click("#yesBtn"); click(`[data-date="${date}"]`); click("#planBtn"); click("#planBtn"); };

for (const d of ["Coffee date", "Dinner date", "Surprise date"]) {
  test(`accepts and chooses ${d}`, async () => {
    const { calls, active } = await visit(accept(d));
    assert.strictEqual(calls.length, 2); // YES, then date type (no duplicates)
    assert.match(calls[0]._subject, /She Said YES/);
    assert.strictEqual(calls[1]["Date preference"], d);
    assert.strictEqual(active, "when");
  });
}

test("full plan: day, time and place in Dhaka", async () => {
  const { calls, active, $ } = await visit(({ click, $, w }) => {
    click("#yesBtn"); click('[data-date="Dinner date"]'); click("#planBtn");
    $("#dateInput").value = "2026-11-14"; $("#dateInput").dispatchEvent(new w.Event("change"));
    click("#timeChips .chip:nth-child(2)"); click("#whenNext");
    click("#placeChips .chip:nth-child(1)"); $("#noteInput").value = "Fuchka after?"; click("#whereNext");
    click("#confirmPlan"); click("#confirmPlan");
  });
  const plan = calls.find(c => /Date Confirmed/.test(c._subject));
  assert.ok(plan);
  assert.strictEqual(calls.length, 3);
  assert.strictEqual(plan["Place (Dhaka)"], "Hatirjheel, Dhaka");
  assert.strictEqual(plan["Her note"], "Fuchka after?");
  assert.strictEqual(plan._honey, "");
  assert.strictEqual(active, "thanks");
});

test("polite decline via link and via No -> I'm sure sends exactly one email", async () => {
  const a = await visit(({ click }) => { click("#declineBtn"); click("#declineBtn"); });
  const b = await visit(({ click }) => { click("#noBtn"); click("#sureBtn"); click("#sureBtn"); });
  for (const r of [a, b]) { assert.strictEqual(r.calls.length, 1); assert.match(r.calls[0]["Her response"], /declined/); assert.strictEqual(r.active, "kindEnding"); }
});

test("No then changing her mind sends no decline", async () => {
  const { calls, active } = await visit(({ click }) => { click("#noBtn"); click("#changeMindBtn"); });
  assert.strictEqual(calls.length, 0);
  assert.strictEqual(active, "question");
});

test("sad scene escalates with repeated No", async () => {
  const { $ } = await visit(({ click }) => { for (let i = 0; i < 4; i++) { click("#noBtn"); click("#changeMindBtn"); } click("#noBtn"); });
  assert.strictEqual($("#sad").dataset.level, "4");
});

test("'Tell me more' alone sends nothing, then records hesitation on decision", async () => {
  const one = await visit(({ click }) => click("#moreBtn"));
  assert.strictEqual(one.calls.length, 0);
  const two = await visit(({ click }) => { click("#moreBtn"); click("#declineBtn"); });
  assert.match(two.calls[0].Hesitation, /Tell me more/);
});

test("email failure never blocks the romantic flow", async () => {
  const { active, $ } = await visit(({ click }) => { click("#yesBtn"); click('[data-date="Coffee date"]'); click("#planBtn"); }, { fail: true });
  assert.strictEqual(active, "when");
  assert.ok(!/error|fail/i.test($(".scene.active").textContent));
});

test("repeated clicks create one email", async () => {
  const { calls } = await visit(({ click }) => { for (let i = 0; i < 10; i++) click("#yesBtn"); });
  assert.strictEqual(calls.length, 1);
});

test("owner email is not rendered on the page", () => {
  assert.ok(!/@gmail\.com/.test(read("index.html")));
});
