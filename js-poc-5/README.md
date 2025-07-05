# js-poc-5 – Universal Algorithm Implementation

The **Universal Algorithm** is a TDD-based automated problem-solving system that leverages GitHub for task tracking and LLMs for decomposition and solution generation.

## 🚀 Overview

This system implements the Universal Algorithm concept - a systematic approach to automated software development that follows these key phases:

1. **Decomposition**: Break down complex tasks into manageable subtasks using LLM
2. **Test Generation**: Create failing tests that define "done" criteria for each subtask
3. **Solution Search**: Generate code solutions using LLM to pass failing tests
4. **Composition**: Combine partial solutions into a final complete solution

All phases are tracked through GitHub issues and pull requests, creating a transparent, reviewable workflow.

## 🧠 Universal Algorithm Concept

The Universal Algorithm is based on the systematic problem-solving approach:

- **Problem Formulation**: Understanding and defining problems clearly
- **Task Decomposition**: Breaking complex problems into smaller, manageable parts
- **Test-Driven Development**: Creating failing tests that define success criteria
- **Solution Implementation**: Writing code to pass the tests
- **Iterative Refinement**: Improving solutions through feedback and testing

This implementation automates the entire process using LLMs and GitHub APIs.

## 🛠️ Technology Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **LLM Integration**: LangChain for flexible model access
- **Version Control**: GitHub API for issues and pull requests
- **Testing**: Jest for comprehensive test coverage
- **CLI**: Commander.js for command-line interface
- **UI**: Chalk and Ora for beautiful console output

## 📁 Project Structure

```
js-poc-5/
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
├── __tests__/                  # Comprehensive test suite
├── .env.example               # Environment configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## 🏗️ Installation

1. **Install Bun** (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Clone and setup**:
```bash
git clone <repository-url>
cd js-poc-5
bun install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

## 🔧 Configuration

### Required Environment Variables

```env
# OpenAI API Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE_URL=https://api.deep-foundation.tech/v1/
OPENAI_API_MODEL=llama3.1-8b
OPENAI_API_TEMPERATURE=0

# GitHub API Configuration
GITHUB_TOKEN=your-github-token-here
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name

# Universal Algorithm Configuration
UA_DRY_RUN=false
UA_MAX_SUBTASKS=10
UA_MAX_SOLUTION_ATTEMPTS=3
UA_ENABLE_COMPOSITION=true
UA_LOG_LEVEL=info
```

### API Keys Setup

1. **OpenAI API Key**: Get from [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. **GitHub Token**: Generate from [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Required scopes: `repo`, `issues`, `pull_requests`

## 🎯 Usage

### CLI Commands

```bash
# Check configuration
bun run src/cli.js check-config

# Solve a complete task
bun run src/cli.js solve "Build a URL shortener service"

# Decompose a task only
bun run src/cli.js decompose "Create a REST API for task management"

# Solve a specific subtask
bun run src/cli.js solve-subtask 123

# Compose solutions for a main task
bun run src/cli.js compose 120

# Check task status
bun run src/cli.js status 120

# Interactive mode
bun run src/cli.js interactive
```

### Package.json Scripts

```bash
# Start main algorithm
bun start "Build a chat application"

# Development mode with hot reload
bun dev

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Individual commands
bun run decompose "Task description"
bun run solve 123
bun run compose 120
```

### Programmatic Usage

```javascript
import { UniversalAlgorithm } from './src/orchestrator.js';

const ua = new UniversalAlgorithm({
  verbose: true,
  dryRun: false
});

// Solve a complete task
const result = await ua.solve("Build a microservice for user authentication");

// Decompose only
const decomposition = await ua.decomposeOnly("Create a blog platform");

// Solve individual subtask
const subtaskResult = await ua.solveSubtask(123);

// Compose solutions
const composition = await ua.composeOnly(120);
```

## 🔄 Workflow

### Phase 1: Task Decomposition
1. LLM analyzes the main task description
2. Generates structured subtask breakdown
3. Creates GitHub issues for main task and subtasks
4. Links subtasks to main issue

### Phase 2: Test Generation
1. For each subtask, generates failing tests
2. Creates feature branches for tests
3. Commits test files to branches
4. Creates pull requests with failing tests
5. Updates subtask issues with test PR links

### Phase 3: Solution Search
1. Analyzes failing tests to understand requirements
2. Generates solution code using LLM
3. Supports multiple solution attempts with retry logic
4. Creates pull requests with solution implementations
5. Updates subtask issues with solution PR links

### Phase 4: Composition
1. Collects all successful subtask solutions
2. Uses LLM to compose integrated final solution
3. Generates comprehensive documentation
4. Creates pull request with composed solution
5. Updates main issue with composition results

## 🎨 Features

- **Intelligent Decomposition**: Uses LLM to break down complex tasks systematically
- **GitHub Integration**: Seamless issue and PR management for full transparency
- **Test-Driven Approach**: Every subtask has clear, executable acceptance criteria
- **Iterative Solution Search**: Multiple attempts with learning from failures
- **Composition Engine**: Combines partial solutions intelligently
- **CLI Interface**: User-friendly command-line tools
- **Interactive Mode**: Guided workflow for easy usage
- **Dry Run Mode**: Test the system without making actual GitHub changes
- **Comprehensive Logging**: Detailed progress tracking and error reporting
- **Flexible Configuration**: Customizable limits and behavior

## 🔍 Example Workflow

```bash
# Start with a complex task
bun run src/cli.js solve "Build a microservice for user authentication with JWT tokens"

# The system will:
# 1. 🔍 Decompose into subtasks:
#    - Create user registration endpoint
#    - Implement JWT token generation
#    - Create login authentication
#    - Add middleware for token validation
#    - Implement password hashing
#    - Create user profile management
#
# 2. 🧪 Generate failing tests for each subtask
#    - Creates test PRs with Jest test files
#    - Defines clear acceptance criteria
#
# 3. 🔍 Search for solutions:
#    - Analyzes test requirements
#    - Generates implementation code
#    - Creates solution PRs
#    - Retries failed attempts
#
# 4. 🔧 Compose final solution:
#    - Integrates all partial solutions
#    - Resolves conflicts and dependencies
#    - Creates comprehensive documentation
#    - Generates final PR with complete microservice
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run specific test file
bun test __tests__/orchestrator.test.js

# Run with coverage
bun test --coverage
```

## 📊 Monitoring and Debugging

### Verbose Mode
```bash
bun run src/cli.js solve "Task description" --verbose
```

### Dry Run Mode
```bash
bun run src/cli.js solve "Task description" --dry-run
```

### Configuration Check
```bash
bun run src/cli.js check-config
```

## 🎭 Error Handling

The system includes comprehensive error handling:

- **LLM API Errors**: Automatic retry with exponential backoff
- **GitHub API Errors**: Graceful failure with detailed error messages
- **Validation Errors**: Clear feedback on configuration issues
- **Network Errors**: Timeout handling and retry logic
- **Parsing Errors**: Robust JSON parsing with fallback strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run the test suite: `bun test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📝 Development

### Core Components

- **LLMClient**: Handles all LLM interactions using LangChain
- **GitHubClient**: Manages GitHub API calls with dry-run support
- **Decomposer**: Orchestrates task decomposition and issue creation
- **TestGenerator**: Generates failing tests and test PRs
- **SolutionSearcher**: Finds solutions with retry logic
- **Composer**: Combines solutions into final implementation
- **UniversalAlgorithm**: Main orchestrator coordinating all phases

### Architecture Principles

- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Components are loosely coupled
- **Error Boundaries**: Graceful error handling at each level
- **Testability**: Comprehensive mocking and unit tests
- **Configurability**: Environment-based configuration

## 🔮 Future Enhancements

- **Multi-language Support**: Support for Python, Java, C#, etc.
- **Advanced Composition**: Dependency resolution and conflict handling
- **CI/CD Integration**: Automatic testing and deployment
- **Web Interface**: Browser-based dashboard
- **Team Collaboration**: Multi-user workflows
- **Solution Caching**: Reuse of similar solutions
- **Performance Optimization**: Parallel processing of subtasks

## 📄 License

MIT License - see LICENSE file for details.

## 🙋 Support

For questions, issues, or contributions:

1. Check the [Issues](https://github.com/your-username/js-poc-5/issues) page
2. Review the test files for usage examples
3. Run the interactive mode for guided usage
4. Check configuration with `bun run src/cli.js check-config`

## 🌟 Acknowledgments

This implementation is based on the Universal Algorithm concept from the [problem-solving repository](https://github.com/Konard/problem-solving), which provides a systematic approach to automated problem-solving using Test-Driven Development principles.

---

*Built with ❤️ using Bun, LangChain, and GitHub APIs* 