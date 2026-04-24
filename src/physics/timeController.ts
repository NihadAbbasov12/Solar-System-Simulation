export class TimeController {
  private elapsedSeconds = 0;
  private speedMultiplier = 1;
  private paused = false;

  constructor(private readonly epoch: Date) {}

  update(deltaRealSeconds: number): void {
    if (this.paused) {
      return;
    }

    this.elapsedSeconds += deltaRealSeconds * this.speedMultiplier;
  }

  reset(): void {
    this.elapsedSeconds = 0;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  togglePaused(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  setSpeedMultiplier(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new RangeError("Simulation speed must be a positive finite number.");
    }

    this.speedMultiplier = multiplier;
  }

  setRealTime(): void {
    this.speedMultiplier = 1;
    this.paused = false;
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isRealTime(): boolean {
    return this.speedMultiplier === 1 && !this.paused;
  }

  getEpoch(): Date {
    return new Date(this.epoch);
  }

  getSimulatedDate(): Date {
    return new Date(this.epoch.getTime() + this.elapsedSeconds * 1000);
  }
}
