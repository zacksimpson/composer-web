export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{3}(.*?)\*{3}/g, "$1")
    .replace(/(\*{2}|_{2})(.*?)\1/g, "$2")
    .replace(/([*_])(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

const LEADING_HEADING_RE = /^#{1,6}\s*/;
const INLINE_MARKER_RE = /\*{1,3}|_{1,3}/g;

/** the note's title, else its first non-empty line, else Untitled */
export function getDisplayTitle(title: string | null, body: string): string {
  if (title) {
    return title;
  }
  for (const line of body.split("\n")) {
    const cleaned = line
      .replace(/<[^>]+>/g, "")
      .replace(LEADING_HEADING_RE, "")
      .replace(INLINE_MARKER_RE, "")
      .trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return "Untitled";
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const HEADING_ONLY_RE = /^#{1,3}$/;

/** true for a note that was never written in */
export function isEmptyBody(body: string): boolean {
  const trimmed = body.trim();
  return trimmed === "" || HEADING_ONLY_RE.test(trimmed);
}
