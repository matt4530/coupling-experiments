import { Stage, FIFOQueue, Event, metronome, normal, exponential, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION } from ".";

export class Database extends Stage {
  public load: number = 0;

  public concurrent: number = 0;
  public latencyA = 0.06;
  public latencyB = 1.06;

  public availability = 0.9995;
  public deadlockThreshold = 70;
  public deadlockAvailability = 0.7;

  constructor() {
    super();
    this.inQueue = new FIFOQueue(1, 300);

    metronome.setInterval(() => {
      stats.record("loadFromY", this.load);
      stats.record("zCapacity", this.inQueue.getNumWorkers() || 0);
      this.load = 0;
    }, SAMPLE_DURATION)

  }

  protected async add(event: Event): Promise<void> {
    this.load++;
    return super.add(event);
  }

  async workOn(event: Event): Promise<void> {
    this.concurrent++;
    const mean =
      30 + exponential(this.latencyA, this.latencyB, this.concurrent);
    const std = 5 + mean / 500;
    const latency = normal(mean, std);

    await metronome.wait(latency);

    if (this.concurrent >= this.deadlockThreshold) {
      if (Math.random() > this.deadlockAvailability) {
        this.concurrent--;
        throw "fail";
      }
    } else {
      if (Math.random() > this.availability) {
        this.concurrent--;
        throw "fail";
      }
    }
    this.concurrent--;
  }
}