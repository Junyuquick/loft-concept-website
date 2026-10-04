import { describe, expect, it } from 'vitest';
import { validateEnquiry } from './enquiry';

const ok = { name: 'Alex Tan', phone: '+65 8533 7311', email: 'alex@example.sg' };

describe('validateEnquiry', () => {
  it('accepts a valid enquiry', () => {
    expect(validateEnquiry(ok)).toEqual({});
    expect(validateEnquiry({ ...ok, phone: '8533 7311' })).toEqual({});
  });
  it('requires every field', () => {
    expect(validateEnquiry({ name: '', phone: '', email: '' })).toEqual({
      name: 'Please enter your name.',
      phone: 'Please enter a phone number we can reach you on.',
      email: 'Please enter your email address.',
    });
  });
  it('treats whitespace-only as empty', () => {
    expect(validateEnquiry({ ...ok, name: '   ' }).name).toBe('Please enter your name.');
  });
  it('rejects malformed phone numbers', () => {
    expect(validateEnquiry({ ...ok, phone: '1234567' }).phone).toBe("That phone number doesn't look right.");
    expect(validateEnquiry({ ...ok, phone: 'abcdefgh' }).phone).toBe("That phone number doesn't look right.");
  });
  it('rejects malformed email', () => {
    expect(validateEnquiry({ ...ok, email: 'alex@example' }).email).toBe("That email address doesn't look right.");
    expect(validateEnquiry({ ...ok, email: 'alex example@x.sg' }).email).toBe("That email address doesn't look right.");
  });
});
