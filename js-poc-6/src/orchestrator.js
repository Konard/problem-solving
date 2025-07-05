import decomposer from './core/decomposer.js';
import testGenerator from './core/testGenerator.js';
import solutionSearcher from './core/solutionSearcher.js';
import composer from './core/composer.js';

export class UniversalAlgorithm {
    constructor() {
        console.log("Universal Algorithm initialized.");
    }

    async solve(mainTask) {
        console.log(`Starting to solve: "${mainTask}"`);

        // 1. Decompose the task
        const { mainIssue, subtasks } = await decomposer.decompose(mainTask);
        if (!subtasks || subtasks.length === 0) {
            console.error("No subtasks were created. Stopping.");
            return;
        }

        const solvedSubtasks = [];

        // This loop would be more complex in reality, waiting for PR reviews.
        // For this prototype, we'll run through it sequentially.
        for (const subtask of subtasks) {
            console.log(`Processing subtask #${subtask.data.number}`);

            // 2. Generate a failing test for the subtask
            const testPR = await testGenerator.generate(subtask);
            if (!testPR) {
                console.error(`Could not generate test for subtask #${subtask.data.number}. Skipping.`);
                continue;
            }
            console.log(`Waiting for test PR to be approved for #${subtask.data.number}... (simulated)`);
            
            // 3. Search for a solution
            const solutionPR = await solutionSearcher.search(subtask, testPR);
            if (!solutionPR) {
                console.error(`Could not find solution for subtask #${subtask.data.number}. Skipping.`);
                continue;
            }
            console.log(`Waiting for solution PR to be approved for #${subtask.data.number}... (simulated)`);

            // Assuming the PRs are approved and merged...
            solvedSubtasks.push(subtask);
            console.log(`Subtask #${subtask.data.number} is considered SOLVED.`);
        }

        if (solvedSubtasks.length !== subtasks.length) {
            console.error("Not all subtasks were solved. Composition will be incomplete.");
        }

        // 4. Compose the final solution
        await composer.compose(mainIssue, solvedSubtasks);

        console.log("Universal Algorithm has completed the task.");
    }

    // Individual methods for CLI
    async decompose(task) {
        await decomposer.decompose(task);
    }
    async solveSubtask(issueNumber) {
        // This would require more logic to fetch the issue and related PRs
        console.log(`(Not Implemented) Solving for issue number: ${issueNumber}`);
    }
    async composeSolutions(mainIssueNumber) {
        // This would require more logic to fetch the main issue and solved sub-issues
        console.log(`(Not Implemented) Composing for main issue: ${mainIssueNumber}`);
    }
} 