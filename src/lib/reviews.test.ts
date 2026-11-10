import { describe, expect, it } from 'vitest';
import { reviewParts } from './testimonials';

describe('reviewParts', () => {
  it('shows an opening highlight once, as the lead, and the rest below it', () => {
    const parts = reviewParts('Great team. They listened.\n\nVery tidy.', 'Great team.');
    expect(parts).toEqual({ lead: '“Great team.', pull: undefined, visible: ['They listened.', 'Very tidy.”'], hidden: [] });
  });

  it('closes the quote on the lead when the highlight is the whole review', () => {
    expect(reviewParts('Great team.', 'Great team.')).toMatchObject({ lead: '“Great team.”', visible: [] });
  });

  it('keeps the full review and pulls the highlight out when it is not the opening line', () => {
    const parts = reviewParts('First sentence. Second sentence.', 'Second sentence.');
    expect(parts).toEqual({ pull: 'Second sentence.', lead: undefined, visible: ['“First sentence. Second sentence.”'], hidden: [] });
  });

  it('works without a highlight', () => {
    expect(reviewParts('One.\n\nTwo.')).toEqual({ pull: undefined, lead: undefined, visible: ['“One.', 'Two.”'], hidden: [] });
  });

  it('puts all but the first paragraph of a long review behind a disclosure', () => {
    const long = ['a'.repeat(300), 'b'.repeat(300), 'c'.repeat(300)].join('\n\n');
    const parts = reviewParts(long);
    expect(parts.visible).toHaveLength(1);
    expect(parts.hidden).toHaveLength(2);
    expect(parts.hidden.at(-1)?.endsWith('”')).toBe(true);
  });

  it('never hides a short review, however many paragraphs', () => {
    expect(reviewParts('One.\n\nTwo.\n\nThree.\n\nFour.').hidden).toEqual([]);
  });
});
