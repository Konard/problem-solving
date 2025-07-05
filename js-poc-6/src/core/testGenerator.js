import llmClient from './llmClient.js';
import githubClient from './githubClient.js';

class TestGenerator {
    async generate(subtask) {
        const issueNumber = subtask.data.number;
        const taskTitle = subtask.data.title;
        console.log(`[TestGenerator] Generating test for subtask #${issueNumber}: "${taskTitle}"`);
        
        const prompt = `Based on the following task, create a single failing test file in JavaScript using 'bun:test'. The test should define the 'definition of done' for the task. Return only the code for the test file. Task: "${taskTitle}"`;
        
        const llmResponse = await llmClient.call(prompt);

        if (!llmResponse.success) {
            console.error(`[TestGenerator] Failed to generate test for subtask #${issueNumber}.`);
            return null;
        }

        const testContent = llmResponse.data;
        console.log(`[TestGenerator] Generated test content for #${issueNumber}:\n${testContent}`);
        
        // In a real implementation, you would:
        // 1. Create a new branch
        // 2. Add the new test file to the '__tests__' directory
        // 3. Commit the file
        // 4. Create a pull request

        const branchName = `test/subtask-${issueNumber}`;
        const title = `feat(test): Add failing test for subtask #${issueNumber}`;
        const body = `This PR introduces a failing test for the subtask: "${taskTitle}". It will be used to validate the solution. Closes #${issueNumber}.`;
        
        // This is a placeholder for the git operations
        console.log(`[TestGenerator] VCS: Pretending to create branch ${branchName} and add file with content.`);

        const pullRequest = await githubClient.createPullRequest({
            title,
            body,
            head: branchName,
            base: 'main',
        });

        console.log(`[TestGenerator] Created PR with failing test: ${pullRequest.data.html_url}`);
        return pullRequest;
    }
}

export default new TestGenerator(); 