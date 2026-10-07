import { describe, expect, it } from "vitest";
import { fallbackIntent } from "../lib/fallbackIntent";
import { applyReject, reduceState, viewFor } from "../lib/pipeline";

describe("rejection keeps the search going", () => {
  it("drops the shown photo and asks again", () => {
    const query = "medicine images that I took last year";
    let state = reduceState(null, undefined, fallbackIntent(query), query);
    let view = viewFor(state, "assist");
    for (let step = 0; step < 4 && view.question && view.results.length > 1; step += 1) {
      const option = view.question.options[0];
      state = reduceState(state, { type: "answer", facet: view.question.facet, value: option.value });
      view = viewFor(state, "assist");
    }
    expect(view.results.length).toBe(1);
    expect(view.question?.facet).toBe("confirm");
    const shown = view.results.map((row) => row.id);
    const next = applyReject(state, shown);
    const after = viewFor(next, "assist");
    expect(after.results.map((row) => row.id)).not.toEqual(expect.arrayContaining(shown));
    expect(after.results.length).toBeGreaterThan(0);
    expect(after.question).not.toBeNull();
  });
});
