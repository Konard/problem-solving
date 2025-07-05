import { Command } from 'commander';
import { UniversalAlgorithm } from './orchestrator.js';

const program = new Command();
const ua = new UniversalAlgorithm();

program
    .name('universal-algorithm')
    .description('A TDD-based automated problem-solving system.');

program
    .command('start <task>')
    .description('Run the complete workflow for a given task.')
    .action((task) => {
        ua.solve(task);
    });

program
    .command('decompose <task>')
    .description('Decompose a task into subtasks and create GitHub issues.')
    .action((task) => {
        ua.decompose(task);
    });

program
    .command('solve')
    .description('Solve a specific subtask by its issue number.')
    .option('-i, --issue-number <number>', 'The GitHub issue number for the subtask')
    .action((options) => {
        ua.solveSubtask(options.issueNumber);
    });

program
    .command('compose')
    .description('Compose solutions into a final result.')
    .option('-m, --main-issue <number>', 'The main GitHub issue number for the task')
    .action((options) => {
        ua.composeSolutions(options.mainIssue);
    });

export function run() {
    program.parse(process.argv);
} 