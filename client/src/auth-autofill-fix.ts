// Chrome/Google Password Manager can visually autofill login inputs
// without firing the input/change events that React normally receives.
// Keep the existing login UI intact and continuously synchronize the
// browser-populated values into the DOM event flow used by the form.

let lastValues = new WeakMap<HTMLInputElement, string>();

function syncAutofilledLoginFields() {
  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[autocomplete="username email"], input[autocomplete="current-password"]'
  );

  inputs.forEach((input) => {
    if (!input.value) return;

    const previous = lastValues.get(input);
    if (previous === input.value) return;

    lastValues.set(input, input.value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

// Autofill can happen after the modal renders, after focus, or when the
// password manager commits credentials. Keep checking while the app is open
// rather than stopping after a fixed timeout.
const observer = new MutationObserver(syncAutofilledLoginFields);
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setInterval(syncAutofilledLoginFields, 250);

window.addEventListener("focusin", syncAutofilledLoginFields, true);
window.addEventListener("pointerdown", syncAutofilledLoginFields, true);
window.addEventListener("submit", syncAutofilledLoginFields, true);
window.addEventListener("pageshow", syncAutofilledLoginFields);

syncAutofilledLoginFields();
