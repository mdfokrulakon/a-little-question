# A Little Question for You ♡

A romantic, static mini-website (HTML, CSS, vanilla JS) that emails you her answer through FormSubmit. No backend, database, build step or paid API. Deploys as-is to Vercel or GitHub Pages.

## Structure
```
index.html        all scenes (welcome → ... → question → yes / no flows)
css/style.css     design system and scene styles
js/config.js      names, messages, FormSubmit endpoint (the only file you normally edit)
js/notify.js      email module: AJAX send, retry, duplicate guard, spam trap
js/script.js      scene flow, interactions, animations
tests/            automated flow tests (npm test)
vercel.json       security headers, noindex, caching
assets/           put romantic-piano.mp3 here (optional)
```

## Run, test, deploy
- `npm run dev` serves locally. `npm install && npm test` runs 11 flow tests.
- **Vercel:** import the repo (or run `vercel`). Framework preset: *Other*, no build command, output directory: root.
- **GitHub Pages:** also works unchanged.

## Activate FormSubmit (once)
1. Deploy, open the live URL, click YES once. FormSubmit emails an "Activate Form" message to the owner address (check Spam).
2. Click Activate. Then put the random alias URL it gives you in `formEndpoint` in `js/config.js`, so your address isn't in the page source.
3. Redeploy, test once yourself, then open the link in a private window before sharing it.

## Emails sent
YES → "❤️ She Said YES!" · date type → "❤️ She Said YES, and Chose: …" · plan confirmed → "📅 Date Confirmed: <place>" (day, time, place, her note) · declined (No → "I'm sure", or the decline link) → "💌 She Responded to Your Question". "Tell me more" and changing her mind send nothing.

## Professional notes
- Privacy: the site is `noindex`, has a strict CSP, and never renders your email. Consider telling her afterwards that her answer was sent to you; honesty keeps this sweet.
- Free-tier limits: FormSubmit is best-effort. If it ever matters more, add a second channel (Formspree, or a Vercel serverless function with Resend).
