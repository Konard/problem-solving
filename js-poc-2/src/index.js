#!/usr/bin/env bun
import { decomposeAndTrack } from "./orchestrator.js";

const mainTask = process.argv.slice(2).join(" ") || "Implement universal algorithm prototype";

await decomposeAndTrack(mainTask); 