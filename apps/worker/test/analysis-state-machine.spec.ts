import { nextStates } from "../src/processors/analysis.processor";

describe("analysis state machine", () => {
  it("moves job from PENDING to QUICK_DONE then RUNNING_DEEP", () => {
    const history = nextStates("PENDING");
    expect(history).toEqual(["RUNNING_QUICK", "QUICK_DONE", "RUNNING_DEEP"]);
  });

  it("marks deep phase to succeeded", () => {
    const history = nextStates("RUNNING_DEEP");
    expect(history).toEqual(["SUCCEEDED"]);
  });
});
