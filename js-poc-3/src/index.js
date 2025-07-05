import { run } from "./orchestrator.js";

export { run };

// Allow `bun run src/index.js "task"` convenience
if (import.meta.main) {
  const task = Bun.argv.slice(2).join(" ");
  if (!task) {
    console.error("Usage: bun run src/index.js \"Your task description\"");
    process.exit(1);
  }
  await run(task);
} 