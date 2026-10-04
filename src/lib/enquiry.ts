export const propertyTypes = ['HDB 2-Room', 'HDB 3-Room', 'HDB 4-Room', 'HDB 5-Room', 'HDB Maisonette', 'Condominium', 'Landed Property', 'Commercial'] as const;
export const propertyStatuses = ['New BTO', 'Resale', 'New Launch Condo', 'Existing Home (Renovation)', 'Existing Home (Construction)'] as const;
export const keyCollections = ['Within 3 months', '3 – 6 months', '6 – 12 months', 'More than 12 months', 'Already Collected'] as const;
export const budgets = ['Under $30,000', '$30,000 – $50,000', '$50,000 – $80,000', '$80,000 – $120,000', '$120,000 – $200,000', 'Above $200,000'] as const;

export interface EnquiryValues { name: string; phone: string; email: string }
export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (!values.name.trim()) errors.name = 'Please enter your name.';

  const phone = values.phone.trim();
  if (!phone) errors.phone = 'Please enter a phone number we can reach you on.';
  else if (!/^[0-9+()\s-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8) errors.phone = "That phone number doesn't look right.";

  const email = values.email.trim();
  if (!email) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address doesn't look right.";

  return errors;
}
