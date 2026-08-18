// Chrome/Google Password Manager can visually autofill controlled React inputs
// without firing the input/change events that update React state. Keep the
// existing login UI intact, but synchronize autofilled values into React.

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

// Autofill may happen after React has rendered the modal, so check briefly
// while the login form is present. This is intentionally lightweight.
const observer = new MutationObserver(syncAutofilledLoginFields);
observer.observe(document.documentElement, { childList: true, subtree: true });

const interval = window.setInterval(syncAutofilledLoginFields, 250);
window.setTimeout(() => window.clearInterval(interval), 15000);

syncAutofilledLoginFields();
