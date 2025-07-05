import llmClient from './llmClient.js';
import githubClient from './githubClient.js';

class Decomposer {
    async decompose(mainTask) {
        console.log(`[Decomposer] Decomposing main task: "${mainTask}"`);

        const mainIssue = await githubClient.createIssue({
            title: mainTask,
            body: 'This is the main tracking issue for the task.',
            labels: ['main-task'],
        });
        console.log(`[Decomposer] Created main issue: ${mainIssue.data.html_url}`);

        const prompt = `Decompose the following task into a list of smaller, actionable subtasks. Return the subtasks as a JSON array of strings. Task: "${mainTask}"`;
        
        const llmResponse = await llmClient.call(prompt);

        if (!llmResponse.success) {
            console.error('[Decomposer] Failed to get subtasks from LLM.');
            return { mainIssue, subtasks: [] };
        }
        
        // In a real implementation, you would parse the LLM response carefully.
        // For now, we'll use a mock response.
        const subtaskTitles = JSON.parse(llmResponse.data || '["Subtask 1: Mocked", "Subtask 2: Mocked"]');
        
        const subtaskPromises = subtaskTitles.map(title => 
            githubClient.createIssue({
                title,
                body: `This subtask is part of the main task: #${mainIssue.data.number}`,
                labels: ['sub-task'],
            })
        );

        const subtaskIssues = await Promise.all(subtaskPromises);
        console.log('[Decomposer] Created subtask issues:');
        subtaskIssues.forEach(subtask => console.log(`  - ${subtask.data.html_url}`));

        return { mainIssue, subtasks: subtaskIssues };
    }
}

export default new Decomposer(); 