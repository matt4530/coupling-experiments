import { Event, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { Model, ModelCreationFunction } from "../models";
import { PerRequestTimeout, X, Y, Z } from "../stages";
import { Scenario, ScenarioFunction } from "./scenario";

/**
 * Z's latency changes to a fixed value.
 * 
 * @param model 
 * @returns 
 */
export const steadyLatency: ScenarioFunction = (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  const z = new Z();
  const model = modelCreator(z);
  const y = new Y(model.entry);
  const timeout = new PerRequestTimeout(y);
  const x = new X(timeout);

  // enforces timeout between X and Y
  timeout.timeout = 60 * TICK_DILATION + 10


  //  add extra properties for models that can take advantage of it
  x.beforeHook = (event: Event) => {
    const e = event as Event & { readAtTime: number; readAtTimeName: string; timeout: number }
    const key = parseInt(event.key.slice(2));
    e.readAtTime = [55, 60, 65][key % 3] * TICK_DILATION;
    e.readAtTimeName = ["fast", "medium", "slow"][key % 3];
    e.timeout = e.readAtTime + 10
  }

  return {
    name: "SteadyLatency",
    model,
    entry: x
  }
}