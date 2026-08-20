/**
 * Copying a suggested colour.
 *
 * Delegated one level rather than written inline because it has a real
 * fallback: a plugin iframe is sandboxed, and `navigator.clipboard` is not
 * always reachable in one. When it is not, the hex is selected instead, so the
 * designer's own copy shortcut works — which is a worse experience than a
 * button and a much better one than a button that does nothing.
 */

export function wireCopy(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("button[data-copy]");
    if (!button) return;

    const hex = button.dataset.copy;
    if (!hex) return;

    void copy(hex, button).then((done) => {
      if (!done) return;
      button.dataset.state = "copied";
      window.setTimeout(() => delete button.dataset.state, 1600);
    });
  });
}

async function copy(hex: string, button: HTMLElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(hex);
    return true;
  } catch {
    return selectInstead(button);
  }
}

function selectInstead(button: HTMLElement): boolean {
  const code = button.querySelector("code");
  if (!code) return false;
  const range = document.createRange();
  range.selectNodeContents(code);
  const selection = window.getSelection();
  if (!selection) return false;
  selection.removeAllRanges();
  selection.addRange(range);
  return false;
}
