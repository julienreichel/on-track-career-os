const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s().-]{7,20}$/;

export function isValidEmail(value: string): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  if (!value) return false;
  return PHONE_REGEX.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return !!url.protocol && !!url.hostname;
  } catch {
    return false;
  }
}
