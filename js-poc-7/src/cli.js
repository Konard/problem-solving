import { run } from './orchestrator.js';

// A simple CLI to start the process.
// It would parse arguments to get the initial issue URL.
const main = async () => {
  const args = process.argv.slice(2);
  const issueArg = args.find(arg => arg.startsWith('--issue='));

  let issueUrl;
  if (issueArg) {
    issueUrl = issueArg.split('=')[1];
  } else {
    console.log('Usage: bun src/cli.js --issue=<your-github-issue-url>');
    // For prototype purposes, we'll use a mock issue if no URL is provided.
    console.log('Running with mock issue...');
    const MOCK_MAIN_ISSUE = {
        number: 1,
        title: 'Implement a calculator',
        body: 'Create a simple calculator that can perform addition, subtraction, multiplication, and division.',
        owner: 'test-owner',
        repo: 'test-repo',
    };
    await run(MOCK_MAIN_ISSUE);
    return;
  }
  
  // In a real implementation, we would parse the URL and fetch issue details.
  console.log(`Starting process for issue: ${issueUrl}`);
  const [owner, repo, , issue_number] = new URL(issueUrl).pathname.split('/').slice(1);
  const mainIssue = {
    owner,
    repo,
    number: parseInt(issue_number),
    // We would fetch the title and body from GitHub API
    title: 'Fetched from GitHub',
    body: 'Fetched from GitHub',
  };

  await run(mainIssue);
};

main().catch(console.error); 