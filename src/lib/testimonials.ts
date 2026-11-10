// How a review is laid out on /testimonials. Reviews are typed in /admin: paragraphs are separated by blank lines,
// and the highlighted sentence is usually the review's opening line.
const COLLAPSE_OVER = 600;

export interface ReviewParts {
  /** A highlight that is not the opening line, shown as a pull quote above the full review. */
  pull?: string;
  /** The highlight when it opens the review: shown once, in large type, instead of repeating it in the body. */
  lead?: string;
  /** Body paragraphs shown straight away. */
  visible: string[];
  /** Further paragraphs behind "Read the full review", only for long reviews. */
  hidden: string[];
}

export function reviewParts(quote: string, highlight?: string): ReviewParts {
  const opens = !!highlight && quote.startsWith(highlight);
  const rest = opens ? quote.slice(highlight.length) : quote;
  const paragraphs = rest.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const texts = opens ? [highlight, ...paragraphs] : paragraphs;
  // Opening mark on the first block and closing mark on the last, wherever they fall.
  const marked = texts.map((t, i) => (i === 0 ? '“' : '') + t + (i === texts.length - 1 ? '”' : ''));
  const lead = opens ? marked.shift() : undefined;
  const collapse = marked.length > 1 && paragraphs.join('').length > COLLAPSE_OVER;
  return {
    pull: highlight && !opens ? highlight : undefined,
    lead,
    visible: collapse ? marked.slice(0, 1) : marked,
    hidden: collapse ? marked.slice(1) : [],
  };
}
