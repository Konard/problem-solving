# js-poc-4 – Universal Algorithm Proof of Concept

The **Universal Algorithm** is a TDD-based automated problem-solving system that leverages GitHub for task tracking and LLMs for decomposition and solution generation.

## 🚀 Overview

This system automates the complete software development lifecycle:

1. **Decomposition**: Break down complex tasks into manageable subtasks using LLM
2. **Test Generation**: Create failing tests that define "done" criteria for each subtask
3. **Issue Tracking**: Use GitHub issues to track main tasks and subtasks
4. **Solution Search**: Generate code solutions using LLM to pass failing tests
5. **Composition**: Combine partial solutions into a final complete solution

## 🛠️ Technology Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **LLM Integration**: LangChain for flexible model access
- **Version Control**: GitHub API for issues and pull requests
- **Testing**: TDD approach with automated test generation
- **CLI**: Commander.js for command-line interface

## 📁 Project Structure

```
js-poc-4/
├── src/
│   ├── core/
│   │   ├── llmClient.js        # LangChain LLM client
│   │   ├── githubClient.js     # GitHub API wrapper
│   │   ├── decomposer.js       # Task decomposition engine
│   │   ├── testGenerator.js    # Test generation engine
│   │   ├── solutionSearcher.js # Solution search engine
│   │   └── composer.js         # Solution composition engine
│   ├── orchestrator.js         # Main workflow orchestrator
│   ├── cli.js                  # Command-line interface
│   └── index.js                # Entry point
├── __tests__/                  # Unit tests
├── .env.example               # Environment configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## 🏗️ Installation

1. **Install Bun** (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Install dependencies**:
```bash
bun install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

## 🔧 Configuration

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `GITHUB_TOKEN`: GitHub personal access token with repo permissions
- `GITHUB_OWNER`: Your GitHub username
- `GITHUB_REPO`: Repository name for issue tracking

### Optional Configuration

- `OPENAI_API_BASE_URL`: Custom API endpoint (default: OpenAI)
- `OPENAI_API_MODEL`: Model name (default: llama3.1-8b)
- `UA_DRY_RUN`: Set to `true` to skip actual GitHub API calls
- `UA_MAX_SUBTASKS`: Maximum number of subtasks per decomposition
- `UA_MAX_SOLUTION_ATTEMPTS`: Maximum solution attempts per subtask

## 🎯 Usage

### CLI Commands

```bash
# Decompose a task into subtasks
bun run decompose "Build a URL shortener service"

# Solve a specific subtask
bun run solve --issue-number 123

# Compose solutions into final result
bun run compose --main-issue 120

# Run the complete workflow
bun start "Create a REST API for task management"
```

### Programmatic Usage

```javascript
import { UniversalAlgorithm } from './src/orchestrator.js';

const ua = new UniversalAlgorithm();
await ua.solve("Build a chat application with real-time messaging");
```

## 🔄 Workflow

### 1. Task Decomposition
- Input: High-level task description
- Process: LLM analyzes and breaks down into subtasks
- Output: Structured subtask list with dependencies

### 2. GitHub Issue Creation
- Creates main issue for the primary task
- Creates sub-issues for each subtask
- Links subtasks to main issue with dependencies

### 3. Test Generation
- Generates failing tests for each subtask
- Creates pull requests with test files
- Tests define the "definition of done"

### 4. Solution Search
- Analyzes failing tests to understand requirements
- Generates code solutions using LLM
- Creates pull requests with solution attempts

### 5. Solution Validation
- Runs tests against generated solutions
- Iterates until tests pass or max attempts reached
- Merges successful solutions

### 6. Composition
- Combines all partial solutions
- Generates final integrated solution
- Validates against main task requirements

## 🧪 Testing

Run the test suite:
```bash
bun test
```

Run tests in watch mode:
```bash
bun test:watch
```

## 🎨 Features

- **Intelligent Decomposition**: Uses LLM to break down complex tasks
- **GitHub Integration**: Seamless issue and PR management
- **Test-Driven**: Every subtask has clear acceptance criteria
- **Iterative Solving**: Multiple solution attempts with learning
- **Composition Engine**: Combines partial solutions intelligently
- **CLI Interface**: Easy-to-use command-line tools
- **Dry Run Mode**: Test without making actual GitHub changes

## 🔍 Example Workflow

```bash
# Start with a complex task
bun start "Build a microservice for user authentication with JWT tokens"

# The system will:
# 1. Decompose into subtasks (e.g., "Create JWT middleware", "Implement user login", etc.)
# 2. Create GitHub issues for tracking
# 3. Generate failing tests for each subtask
# 4. Search for solutions using LLM
# 5. Create PRs with solution attempts
# 6. Compose final solution when all tests pass
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙋 Support

For questions or issues:
- Open a GitHub issue
- Check the documentation
- Review the test files for usage examples 