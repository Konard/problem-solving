import { expect, test } from "bun:test";
import { decomposeTask } from "../src/decomposer.js";

test("decomposeTask returns array with at least one element", async () => {
  const subtasks = await decomposeTask("Say hello world");
  expect(Array.isArray(subtasks)).toBe(true);
  expect(subtasks.length).toBeGreaterThan(0);
}); 