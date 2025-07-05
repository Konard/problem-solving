import { Orchestrator } from "./orchestrator.js";
import dotenv from "dotenv";

dotenv.config();

const mainTask = process.argv[2] || "Implement a user authentication system";
const orchestrator = new Orchestrator();

orchestrator.execute(mainTask)
  .then(() => console.log("Process completed"))
  .catch(err => console.error("Error:", err)); 