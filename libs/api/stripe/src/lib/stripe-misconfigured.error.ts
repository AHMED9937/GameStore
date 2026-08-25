export class StripeMisconfiguredError extends Error {
  constructor(message = 'Stripe is not configured') {
    super(message);
    this.name = 'StripeMisconfiguredError';
  }
}
