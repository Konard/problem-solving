# js-poc-3 – Universal Algorithm Proof-of-Concept

This project demonstrates an automated workflow that uses **GitHub**, **LangChain/LLMs**, **Bun**, and **TDD** to iteratively solve programming tasks.

## High-Level Flow

1. **Task Decomposition** – A high-level task is decomposed into implementation-level subtasks using an LLM.
2. **Issue Creation** – The main task and each subtask are tracked as GitHub issues/sub-issues.
3. **Test Generation (Red)** – For every (sub)task, an LLM generates a failing unit test. The test is opened as a Pull Request.
4. **Solution Search (Green)** – When a test fails on CI, the solution searcher asks the LLM for a minimal patch and opens a PR with the suggested fix.
5. **Refactor & Compose (Blue)** – After all subtasks are green, partial solutions are composed into the final solution that satisfies the main task test.

## Repository Layout

```
js-poc-3/
├── .env.example        Example environment variables
├── package.json        Dependencies & scripts
├── src/                Source modules
│   ├── composer.js
│   ├── decomposer.js
│   ├── githubClient.js
│   ├── llmClient.js
│   ├── orchestrator.js
│   ├── solutionSearcher.js
│   └── testGenerator.js
└── __tests__/          Bun unit tests
    └── decomposer.test.js
```

## Setup

1. Install [Bun](https://bun.sh).
2. Copy `.env.example` to `.env` and fill in your GitHub and OpenAI credentials.
3. Install dependencies:

```bash
bun install
```

## Usage

Create issues, subtasks and failing tests for a new high-level task:

```bash
bun src/orchestrator.js "Build a URL shortener service"
```

Run unit tests locally:

```bash
bun test
```

## Notes

* All network-dependent calls are thin wrappers; logic is stubbed to keep the prototype simple and offline-friendly.
* Real execution will require proper branch creation, commits, and CI integration, which can be implemented incrementally. 