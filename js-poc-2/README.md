# js-poc-2 – Universal Algorithm Proof-of-Concept

This project is **proof-of-concept #2** of the universal algorithm described in the repository.  It demonstrates an automated flow that:

1. **Decomposes** a high-level task into subtasks using an LLM (via LangChain).
2. **Tracks** tasks and subtasks as GitHub issues (and nested issues).
3. Creates **pull requests** that contain failing tests representing the *definition of done* for each task.
4. Iteratively searches for **candidate solutions** with the LLM until the tests pass, pushing each attempt as a PR.
5. **Composes** verified partial solutions into a final solution that satisfies the top-level acceptance test.

Technologies used:

* **Bun** – runtime & test runner.
* **LangChain** – access to GPT-style models via your custom API.
* **GitHub REST API** – issues & pull-requests automation.
* **TDD** – every task is driven by a failing test first.

---

## Quick start

```bash
# Install dependencies (Bun v1.1+)
bun install

# Provide secrets
cp .env.example .env  # then fill in values

# Run the demo task decomposition
bun run src/index.js "Build a CLI that says hello world"
```

> **Note**: The script does **not** push to GitHub until you provide valid credentials in `.env` and point it at a repository you control.

## Project structure

```
js-poc-2/
  ├─ src/
  │   ├─ index.js            # entry point
  │   ├─ orchestrator.js     # top-level flow
  │   ├─ decomposer.js       # task decomposition via LLM
  │   ├─ githubClient.js     # thin GitHub REST wrapper
  │   ├─ llmClient.js        # LangChain model wrapper
  │   ├─ testGenerator.js    # generates failing tests PRs
  │   ├─ solutionSearcher.js # finds candidate fixes
  │   └─ composer.js         # final composition stage
  └─ tests/
      └─ decomposer.test.js  # example Bun test
```

The implementation purposefully focuses on *architecture & interfaces* so you can iterate quickly. 