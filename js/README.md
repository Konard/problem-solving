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
└── cli.js       # CLI entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
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

# Test Repository Configuration
TEST_REPO_OWNER=konard
TEST_REPO_PREFIX=problem-solving-test-
TEST_REPO_DELETE_ON_SUCCESS=true  # Delete test repository after successful tests
```

### Getting GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `issues` permissions
3. Add the token to your `.env` file

## Usage

### Basic Usage

```bash
# Solve a problem using the full pipeline
bun start "Implement a user authentication system"

# Or use the CLI
bun run src/cli.js solve "Create a REST API for user management"
```

### CLI Commands

```bash
# Solve a problem (full pipeline)
bun run solve "Your problem description"

# Decompose a task into subtasks
bun run decompose "Your task description"

# Generate tests for a task
bun run test "Your task description"

# Run in dry-run mode (no actual GitHub changes)
bun start -- --dry-run "Your problem description"

# Enable debug logging
bun start -- --debug "Your problem description"
```

### Programmatic Usage

```javascript
import { Orchestrator } from './src/orchestrator.js';

const orchestrator = new Orchestrator();
await orchestrator.execute("Implement user authentication");
```

## Workflow

1. **Test Repository Creation**: Creates a dedicated test repository with unique naming
2. **Task Decomposition**: The system breaks down the main task into 3-5 specific subtasks
3. **Issue Creation**: Creates GitHub issues for the main task and each subtask
4. **Test Generation**: For each subtask, generates comprehensive test code
5. **Solution Generation**: Creates production-ready code that passes the tests
6. **Approval Process**: Waits for test and solution approvals (simulated)
7. **Composition**: Combines all approved solutions into a final implementation
8. **Final PR**: Creates a pull request with the complete solution
9. **Repository Cleanup**: Deletes test repository on success, keeps for investigation on failure

## Development

### Running Tests

```bash
# Run all tests
bun test

# Run specific test suites
bun run test:unit          # Unit tests only
bun run test:integration   # Integration tests (requires GITHUB_TOKEN)
bun run test:workflow      # Full GitHub workflow test
bun run test:all           # Comprehensive test suite

# Watch mode
bun run test:watch
```

### Linting

```bash
bun run lint
bun run lint:fix
```

### Development Mode

```bash
bun run dev
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
| `TEST_REPO_OWNER` | Owner of test repositories | `konard` |
| `TEST_REPO_PREFIX` | Prefix for test repository names | `problem-solving-test-` |
| `TEST_REPO_DELETE_ON_SUCCESS` | Delete test repo after success | `true` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

Unlicense - see LICENSE file for details.

## Testing

The project includes comprehensive test coverage for all GitHub functionality:

### Test Coverage

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test GitHub API interactions (requires GITHUB_TOKEN)
- **Workflow Tests**: Test complete GitHub workflows
- **CLI Tests**: Test command-line interface functionality

### Running Tests

```bash
# Run all tests
bun test

# Run specific test suites
bun run test:unit          # Unit tests only
bun run test:integration   # Integration tests (requires GITHUB_TOKEN)
bun run test:workflow      # Full GitHub workflow test
bun run test:all           # Comprehensive test suite
```

### Test Requirements

- **Unit Tests**: No external dependencies
- **Integration Tests**: Requires `GITHUB_TOKEN` environment variable
- **Workflow Tests**: Requires `GITHUB_TOKEN` and GitHub API access

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**: Ensure your token has sufficient permissions
2. **LLM API Errors**: Check your API key and model configuration
3. **Network Issues**: Verify your internet connection and API endpoints
4. **Test Failures**: Check that all required environment variables are set

### Debug Mode

Enable debug mode to see detailed logs:

```bash
UNIVERSAL_ALGORITHM_DEBUG=true bun start "Your task"
```

### Dry Run Mode

Test the system without making changes:

```bash
UNIVERSAL_ALGORITHM_DRY_RUN=true bun start "Your task"
```

### Testing GitHub Functionality

To test GitHub functionality independently:

```bash
# Run workflow test
bun run test:workflow

# Run integration tests
bun run test:integration
``` 