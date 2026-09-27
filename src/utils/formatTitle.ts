/**
 * Strips emojis and applies sentence case to a property title.
 *
 * Rules:
 *  - Remove all emoji characters
 *  - First character of the whole string → uppercase
 *  - Everything else → lowercase
 *  - Applied on blur so the user can still type freely
 */
export function formatPropertyTitle(raw: string): string {
  // Remove emoji (covers standard emoji ranges + variation selectors + ZWJ sequences)
  const noEmoji = raw.replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}\u{1FAA0}-\u{1FAD6}‍︎️]/gu,
    "",
  ).replace(/\s{2,}/g, " ").trim();

  if (!noEmoji) return noEmoji;

  // Sentence case: uppercase first char, lowercase everything else
  return noEmoji.charAt(0).toUpperCase() + noEmoji.slice(1).toLowerCase();
}

/**
 * Strips emojis from a string in real time (for onChange).
 */
export function stripEmojis(raw: string): string {
  return raw.replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}\u{1FAA0}-\u{1FAD6}‍︎️]/gu,
    "",
  );
}
