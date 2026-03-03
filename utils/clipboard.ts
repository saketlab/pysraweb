/**
 * Copy text to the clipboard.
 *
 * Uses the synchronous textarea + execCommand approach rather than the
 * async Clipboard API because the latter loses user-gesture context in
 * certain UI patterns (e.g. Radix DropdownMenu onSelect fires after
 * the menu close animation, outside the original trusted event).
 */
export function copyToClipboard(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}
