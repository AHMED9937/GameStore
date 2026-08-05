export class PaddleMisconfiguredError extends Error {
  constructor(message = 'Paddle is not configured') {
    super(message);
    this.name = 'PaddleMisconfiguredError';
  }
}
