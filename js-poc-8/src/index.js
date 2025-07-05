import dotenv from "dotenv";
import { Orchestrator } from "./orchestrator.js";

dotenv.config();

const mainTask = process.argv[2] || "Implement a REST API for user management";
const orchestrator = new Orchestrator();

orchestrator.execute(mainTask)
  .then(finalSolution => {
    console.log("Final Solution Code:\n", finalSolution);
  })
  .catch(error => {
    console.error("Process failed:", error);
    process.exit(1);
  }); 