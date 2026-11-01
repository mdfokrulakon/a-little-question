(() => {
  const config = window.LOVE_NOTE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const scenes = $$(".scene");
  const progress = $("#progress");
  let current = 0;
  let selectedDate = "";
  let typingTimer;

  // Her journey so far (used only to enrich the notification emails)
  const journey = { askedMore: false, noClicks: 0 };

  $$("[data-her-name]").forEach(el => el.textContent = config.herName || "You");
  $$("[data-my-name]").forEach(el => el.textContent = config.myName || "Your secret admirer");
  $("#finalMessage").textContent = config.finalMessage || "I'm looking forward to getting to know you even better.";

  const { notify } = window.Notifier(config); // js/notify.js

  const plan = { day: "", time: "", place: "" };
  const sendPlan = () => notify(`plan:${plan.day}|${plan.time}|${plan.place}`, `📅 Date Confirmed: ${plan.place}`, {
    "Her response": "❤️ ACCEPTED and planned the date",
    "Date preference": selectedDate,
    "Day": plan.dayText,
    "Time": plan.time,
    "Place (Dhaka)": plan.place,
    "Her note": ($("#noteInput").value || "").trim() || "(none)",
    "Hesitation": hesitation()
  });

  const hesitation = () => [
    journey.askedMore ? "She tapped 'Tell me more' first" : "",
    journey.noClicks ? `She tapped 'No' ${journey.noClicks}x before changing her mind` : ""
  ].filter(Boolean).join("; ") || "None, straight to her answer";

  const sendAccepted = () => notify("accepted", "❤️ She Said YES!", {
    "Her response": "❤️ ACCEPTED: YES! Absolutely",
    "Date preference": "Not chosen yet (you'll get a second email when she picks)",
    "Hesitation": hesitation()
  });
  const sendDate = () => notify(`date:${selectedDate}`, `❤️ She Said YES, and Chose: ${selectedDate}`, {
    "Her response": "❤️ ACCEPTED: YES! Absolutely",
    "Date preference": selectedDate,
    "Hesitation": hesitation()
  });
  const sendDeclined = () => notify("declined", "💌 She Responded to Your Question", {
    "Her response": "💌 Politely declined, with kindness",
    "Date preference": "N/A",
    "Hesitation": hesitation()
  });

  /* ---------- Scenes ---------- */
  function showScene(id) {
    const target = document.getElementById(id);
    if (!target) return;
    scenes.forEach(scene => scene.classList.toggle("active", scene === target));
    current = Math.max(0, scenes.indexOf(target));
    progress.style.width = `${((current + 1) / scenes.length) * 100}%`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const heading = $("h1, h2", target); // move keyboard / screen-reader focus to the new scene
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    if (id === "confession") startTyping();
    if (id === "sad") startSad();
  }

  function startTyping() {
    clearInterval(typingTimer);
    const output = $("#typeText");
    const text = config.confession || "I don't know exactly when it happened, but somewhere between our conversations, your smile, and those little moments... you became someone I genuinely look forward to.";
    output.textContent = "";
    $("#confessionExtra").classList.add("hidden");
    $("#confessionJoke").classList.add("hidden");
    $("#confessionNext").classList.add("hidden");
    let i = 0;
    typingTimer = setInterval(() => {
      output.textContent += text.charAt(i++);
      if (i >= text.length) {
        clearInterval(typingTimer);
        $("#confessionExtra").classList.remove("hidden");
        setTimeout(() => $("#confessionJoke").classList.remove("hidden"), 500);
        setTimeout(() => $("#confessionNext").classList.remove("hidden"), 900);
      }
    }, 28);
  }

  $$("[data-next]").forEach(button => button.addEventListener("click", () => showScene(button.dataset.next)));
  $("#confessionNext").addEventListener("click", () => showScene("reasons"));

  $$(".reason-card").forEach(card => card.addEventListener("click", () => {
    card.classList.toggle("revealed");
    const small = $("small", card);
    small.textContent = card.classList.contains("revealed")
      ? "Confirmed: this is not a bug. It's just you. ♡"
      : "Tap to reveal a very scientific observation";
  }));

  // Wish scene: light all three stars to continue
  $$(".star-btn").forEach(star => star.addEventListener("click", () => {
    star.classList.add("lit");
    const left = $$(".star-btn:not(.lit)").length;
    $("#wishNote").textContent = left ? `${left} more to go...` : "Beautiful. Hold that thought.";
    $("#wishNext").disabled = left > 0;
  }));

  /* ---------- The question ---------- */
  $("#moreBtn").addEventListener("click", () => {
    journey.askedMore = true; // no email yet, only her final decision counts
    $("#morePanel").classList.toggle("hidden");
    $("#moreBtn").setAttribute("aria-expanded", String(!$("#morePanel").classList.contains("hidden")));
  });
  $("#yesBtn").addEventListener("click", () => { confetti(); sendAccepted(); showScene("celebration"); });
  $("#declineBtn").addEventListener("click", () => { sendDeclined(); showScene("kindEnding"); });

  // "No" -> sad, crying scene. She can still change her mind; only "I'm sure" notifies you.
  const sadLines = [
    "I'm trying very hard not to cry right now.",
    "Okay... I'm definitely crying now. 😢",
    "My heart just did a tiny crumble. Are you really sure?",
    "Please? I'll even pay for the snacks... 🥺",
    "I'm a puddle now. A very sad, very hopeful puddle. 💧"
  ];
  function startSad() {
    const n = Math.min(Math.max(journey.noClicks, 1), sadLines.length);
    $("#sadText").textContent = sadLines[n - 1];
    $("#sad").dataset.level = String(Math.min(n, 4));
    const rain = $("#cryRain");
    if (!rain.children.length) {
      for (let i = 0; i < 40; i++) {
        const drop = document.createElement("span");
        drop.className = "raindrop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${.9 + Math.random() * .9}s`;
        drop.style.animationDelay = `${-Math.random() * 2}s`;
        rain.appendChild(drop);
      }
    }
  }
  $("#noBtn").addEventListener("click", () => { journey.noClicks++; showScene("sad"); });
  $("#changeMindBtn").addEventListener("click", () => showScene("question"));
  $("#sureBtn").addEventListener("click", () => { sendDeclined(); showScene("kindEnding"); });

  /* ---------- Celebration ---------- */
  $$(".date-option").forEach(option => option.addEventListener("click", () => {
    $$(".date-option").forEach(item => item.classList.remove("selected"));
    option.classList.add("selected");
    selectedDate = option.dataset.date;
    $("#selectionNote").textContent = `${selectedDate} it is? Excellent taste. You can still suggest something else.`;
    $("#planBtn").disabled = false;
  }));
  $("#planBtn").addEventListener("click", () => { sendDate(); showScene("when"); });

  /* ---------- Pick a day, time and place in Dhaka ---------- */
  const pad = n => String(n).padStart(2, "0");
  const now = new Date();
  $("#dateInput").min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const pick = (selector, onPick) => $$(selector).forEach(chip => chip.addEventListener("click", () => {
    $$(selector).forEach(c => c.classList.remove("selected"));
    chip.classList.add("selected");
    onPick(chip);
  }));
  const refreshWhen = () => {
    $("#whenNext").disabled = !(plan.day && plan.time);
    $("#whenNote").textContent = plan.day && plan.time ? "Lovely. That works for me too." : "Choose a day and a time that feel right.";
  };
  const refreshWhere = () => { $("#whereNext").disabled = !(plan.place || $("#placeCustom").value.trim()); };
  $("#dateInput").addEventListener("change", e => {
    plan.day = e.target.value;
    plan.dayText = plan.day ? new Date(`${plan.day}T00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
    refreshWhen();
  });
  pick("#timeChips .chip", chip => { plan.time = chip.dataset.time; refreshWhen(); });
  pick("#placeChips .chip", chip => { plan.place = chip.dataset.place; $("#placeCustom").value = ""; refreshWhere(); });
  $("#placeCustom").addEventListener("input", () => {
    if ($("#placeCustom").value.trim()) { plan.place = ""; $$("#placeChips .chip").forEach(c => c.classList.remove("selected")); }
    refreshWhere();
  });
  $("#whenNext").addEventListener("click", () => showScene("where"));
  $("#whereNext").addEventListener("click", () => {
    plan.place = $("#placeCustom").value.trim() || plan.place;
    $("#planType").textContent = selectedDate;
    $("#planDay").textContent = plan.dayText;
    $("#planTime").textContent = plan.time;
    $("#planPlace").textContent = plan.place;
    showScene("plan");
  });
  $("#editPlan").addEventListener("click", () => showScene("when"));
  $("#confirmPlan").addEventListener("click", () => {
    sendPlan();
    confetti();
    $("#finalMessage").textContent = `Our ${selectedDate.toLowerCase()} is set: ${plan.dayText}, ${plan.time.toLowerCase()}, at ${plan.place}. I can't wait.`;
    showScene("thanks");
  });
  $("#replayBtn").addEventListener("click", replay);
  $("#replayBtn2").addEventListener("click", replay);
  function replay() {
    selectedDate = "";
    $$(".date-option").forEach(item => item.classList.remove("selected"));
    $$(".star-btn").forEach(star => star.classList.remove("lit"));
    $("#wishNext").disabled = true;
    $("#wishNote").textContent = "Light all three stars.";
    plan.day = plan.dayText = plan.time = plan.place = "";
    $("#dateInput").value = $("#placeCustom").value = $("#noteInput").value = "";
    $$(".chip").forEach(c => c.classList.remove("selected"));
    $("#whenNext").disabled = $("#whereNext").disabled = true;
    $("#planBtn").disabled = true;
    $("#selectionNote").textContent = "Pick whichever sounds lovely. Or suggest your own.";
    showScene("welcome");
  }

  function confetti() {
    const symbols = ["♥", "♡", "✦", "✿"];
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.animationDuration = `${2.4 + Math.random() * 2.5}s`;
      piece.style.opacity = `${.5 + Math.random() * .5}`;
      piece.style.color = ["#c66e78", "#e7aaa4", "#d6a6a0", "#b88a78"][i % 4];
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 5200);
    }
  }

  // Drifting petals in the background
  const ambient = $(".ambient");
  if (ambient && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 14; i++) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.textContent = ["♡", "✿", "❀"][i % 3];
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.fontSize = `${12 + Math.random() * 16}px`;
      petal.style.animationDuration = `${14 + Math.random() * 14}s`;
      petal.style.animationDelay = `${-Math.random() * 20}s`;
      ambient.appendChild(petal);
    }
  }

  // Optional local audio. It remains off until the visitor taps the toggle.
  let audio;
  const musicToggle = $("#musicToggle");
  musicToggle.addEventListener("click", async () => {
    if (!config.musicFile) {
      musicToggle.querySelector("span").textContent = "Add music in config.js";
      return;
    }
    if (!audio) audio = new Audio(config.musicFile);
    try {
      if (audio.paused) {
        await audio.play();
        musicToggle.setAttribute("aria-pressed", "true");
        musicToggle.querySelector("span").textContent = "Sound on";
      } else {
        audio.pause();
        musicToggle.setAttribute("aria-pressed", "false");
        musicToggle.querySelector("span").textContent = "Sound off";
      }
    } catch (error) {
      musicToggle.querySelector("span").textContent = "Audio unavailable";
    }
  });

  showScene("welcome");
})();
