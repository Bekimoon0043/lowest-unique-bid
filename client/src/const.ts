export const CURRENCY = {
  code: 'ETB',
  symbol: 'ብር',
  name: 'Ethiopian Birr'
} as const;

export const PAYMENT_INSTRUCTIONS = `Send ${CURRENCY.symbol} payment via Telebirr or Bank Transfer.
Include your Bid ID in the reference.`;