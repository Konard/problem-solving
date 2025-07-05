# Problem Solving Automation

An intelligent system that automates the problem-solving process using LLM (Large Language Model) and GitHub integration. This tool decomposes complex tasks into manageable subtasks, generates tests, creates solutions, and composes everything into a final implementation.

## Features

- 🤖 **Intelligent Task Decomposition**: Uses LLM to break down complex problems into actionable subtasks
- 🧪 **Automated Test Generation**: Creates comprehensive test suites for each subtask
- 💡 **Solution Generation**: Generates production-ready code that passes the tests
- 🔗 **GitHub Integration**: Creates issues, pull requests, and manages the entire workflow
- 🎯 **Composition**: Combines individual solutions into a coherent final implementation
- 🛡️ **Dry-Run Mode**: Test the system without making actual GitHub changes
- 📊 **Progress Tracking**: Real-time progress updates and error handling

## Architecture

```
src/
├── core/           # Core business logic
│   ├── decomposer.js
│   ├── testGenerator.js
│   ├── solutionSearcher.js
│   └── composer.js
├── github/         # GitHub API integration
│   └── githubClient.js
├── llm/           # LLM integration
│   └── llmClient.js
├── orchestrator.js # Main orchestration logic
└── index.js       # CLI entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Fill in your configuration in `.env`

## Configuration

### Required Environment Variables

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE_URL=https://api.deep-foundation.tech/v1/  # Optional
OPENAI_API_MODEL=llama3.1-8b  # or your preferred model
OPENAI_API_TEMPERATURE=0.1

# GitHub API Configuration
GITHUB_TOKEN=your-github-token-here
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
GITHUB_API_BASE_URL=https://api.github.com  # Optional

# Universal Algorithm Configuration
UNIVERSAL_ALGORITHM_DEBUG=false
UNIVERSAL_ALGORITHM_DRY_RUN=false  # Set to true for testing
UNIVERSAL_ALGORITHM_MAX_SUBTASKS=10
UNIVERSAL_ALGORITHM_MAX_SOLUTION_ATTEMPTS=3
UNIVERSAL_ALGORITHM_ENABLE_COMPOSITION=true
UNIVERSAL_ALGORITHM_LOG_LEVEL=info
```

### Getting GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `issues` permissions
3. Add the token to your `.env` file

## Usage

### Basic Usage

```bash
# Solve a problem using the full pipeline
npm start "Implement a user authentication system"

# Or use the CLI
node src/index.js solve "Create a REST API for user management"
```

### CLI Commands

```bash
# Solve a problem (full pipeline)
npm run solve "Your problem description"

# Decompose a task into subtasks
npm run decompose "Your task description"

# Generate tests for a task
npm run test "Your task description"

# Run in dry-run mode (no actual GitHub changes)
npm start -- --dry-run "Your problem description"

# Enable debug logging
npm start -- --debug "Your problem description"
```

### Programmatic Usage

```javascript
import { Orchestrator } from './src/orchestrator.js';

const orchestrator = new Orchestrator();
await orchestrator.execute("Implement user authentication");
```

## Workflow

1. **Task Decomposition**: The system breaks down the main task into 3-5 specific subtasks
2. **Issue Creation**: Creates GitHub issues for the main task and each subtask
3. **Test Generation**: For each subtask, generates comprehensive test code
4. **Solution Generation**: Creates production-ready code that passes the tests
5. **Approval Process**: Waits for test and solution approvals (simulated)
6. **Composition**: Combines all approved solutions into a final implementation
7. **Final PR**: Creates a pull request with the complete solution

## Development

### Running Tests

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Development Mode

```bash
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_API_BASE_URL` | Custom API endpoint | `https://api.openai.com/v1` |
| `OPENAI_API_MODEL` | Model to use | `gpt-4` |
| `OPENAI_API_TEMPERATURE` | Model temperature | `0.1` |
| `GITHUB_TOKEN` | GitHub personal access token | Required |
| `GITHUB_OWNER` | Repository owner | Required |
| `GITHUB_REPO` | Repository name | Required |
| `UNIVERSAL_ALGORITHM_DRY_RUN` | Skip actual GitHub changes | `false` |
| `UNIVERSAL_ALGORITHM_DEBUG` | Enable debug logging | `false` |
| `UNIVERSAL_ALGORITHM_MAX_SUBTASKS` | Maximum subtasks to create | `10` |
| `UNIVERSAL_ALGORITHM_MAX_SOLUTION_ATTEMPTS` | Max solution attempts | `3` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**: Ensure your token has sufficient permissions
2. **LLM API Errors**: Check your API key and model configuration
3. **Network Issues**: Verify your internet connection and API endpoints

### Debug Mode

Enable debug mode to see detailed logs:

```bash
UNIVERSAL_ALGORITHM_DEBUG=true npm start "Your task"
```

### Dry Run Mode

Test the system without making changes:

```bash
UNIVERSAL_ALGORITHM_DRY_RUN=true npm start "Your task"
``` 