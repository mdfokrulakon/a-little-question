(() => {
  const config = window.LOVE_NOTE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const scenes = $$(".scene");
  const progress = $("#progress");
  let current = 0;
  let selectedDate = "";
  let typingTimer;

  $$("[data-her-name]").forEach(el => el.textContent = config.herName || "You");
  $$("[data-my-name]").forEach(el => el.textContent = config.myName || "Your secret admirer");
  $("#finalMessage").textContent = config.finalMessage || "I'm looking forward to getting to know you even better.";

  function showScene(id) {
    const target = document.getElementById(id);
    if (!target) return;
    scenes.forEach(scene => scene.classList.toggle("active", scene === target));
    current = Math.max(0, scenes.indexOf(target));
    progress.style.width = `${((current + 1) / scenes.length) * 100}%`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "confession") startTyping();
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

  $("#moreBtn").addEventListener("click", () => {
    $("#morePanel").classList.toggle("hidden");
    $("#moreBtn").setAttribute("aria-expanded", String(!$("#morePanel").classList.contains("hidden")));
  });
  $("#yesBtn").addEventListener("click", () => { confetti(); showScene("celebration"); });
  $("#declineBtn").addEventListener("click", () => showScene("kindEnding"));

  $$(".date-option").forEach(option => option.addEventListener("click", () => {
    $$(".date-option").forEach(item => item.classList.remove("selected"));
    option.classList.add("selected");
    selectedDate = option.dataset.date;
    $("#selectionNote").textContent = `${selectedDate} it is? Excellent taste. You can still suggest something else.`;
    $("#planBtn").disabled = false;
  }));
  $("#planBtn").addEventListener("click", () => {
    $("#finalMessage").textContent = `A ${selectedDate.toLowerCase()} sounds lovely. Let's figure out a time and place together.`;
    showScene("thanks");
  });
  $("#replayBtn").addEventListener("click", replay);
  $("#replayBtn2").addEventListener("click", replay);
  function replay() {
    selectedDate = "";
    $$(".date-option").forEach(item => item.classList.remove("selected"));
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
