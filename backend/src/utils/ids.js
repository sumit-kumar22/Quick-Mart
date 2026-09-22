import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghjkmnpqrstuvwxyz';

export const id = (prefix = '') => (prefix ? `${prefix}-${customAlphabet(alphabet, 16)()}` : customAlphabet(alphabet, 16)());

export const orderId = () => `ord-${Date.now()}${customAlphabet('0123456789', 3)()}`;
export const otpCode = () => String(Math.floor(100000 + Math.random() * 900000));
export const paymentRef = (prefix = 'pay') => `${prefix}-${customAlphabet(alphabet, 20)()}`;

export function randomHex(len = 24) {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}