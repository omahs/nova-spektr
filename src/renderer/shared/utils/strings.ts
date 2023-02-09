import { Identity } from '@renderer/domain/identity';

/**
 * Get short address representation
 * `5DXYNRXmNmFLFxxUjMXSzKh3vqHRDfDGGbY3BnSdQcta1SkX --> 5DXYNR...ta1SkX`
 * @param address value to make short
 * @param size how many letters should be visible from start/end
 * @return {String}
 */
export const getShortAddress = (address = '', size = 6): string => {
  return address.length < 13 ? address : `${address.slice(0, size)}...${address.slice(-1 * size)}`;
};

/**
 * Validate WebSocket address
 * @param address address to validate
 * @return {Boolean}
 */
export const validateWsAddress = (address: string): boolean => {
  return /^ws(s)?:\/\/.+(\.[a-z]{2,}|:\d{4,5})(\/[a-z\d_-]+)*\W{0}\/?/i.test(address);
};

/**
 * Validate Parity Signer QR format
 * @param value qr code to validate
 * @return {Boolean}
 */
export const validateSignerFormat = (value: string): boolean => {
  return /^substrate:[a-zA-Z0-9]+:0x[a-zA-Z0-9]+$/.test(value);
};

/**
 * Copies string value to clipboard
 * @param text value to copy
 * @return {Promise}
 */
export const copyToClipboard = async (text = ''): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.warn('Clipboard is not supported');
  }
};

/**
 * Check does arguments contain query string
 * @param query string value
 * @param args values to be checked
 * @return {Boolean}
 */
export const isStringsMatchQuery = (query: string, args: string[]): boolean => {
  return args.reduce((acc, word) => acc.concat(word.toLowerCase()), '').includes(query.toLowerCase());
};

/**
 * Get full identity or just part of it
 * @param identity validator's identity
 * @return {String}
 */
export const getComposedIdentity = (identity?: Identity): string => {
  if (!identity) return '';

  return identity.subName ? `${identity.parent.name}/${identity.subName}` : identity.parent.name;
};