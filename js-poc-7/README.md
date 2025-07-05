# js-poc-7: The Universal Algorithm

This project is the 7th proof-of-concept for implementing a "universal algorithm" for automated problem-solving.

## Concept

The core idea is to automate the software development process by following these steps:

1.  **Decomposition**: A large task is broken down into smaller, manageable subtasks using an LLM. These are tracked as GitHub issues.
2.  **Test Generation**: For each task, an LLM generates a failing test that defines the criteria for completion. This is submitted as a pull request.
3.  **Solution Search**: Once the test is approved, an LLM attempts to write code that passes the test. Each attempt is a pull request.
4.  **Composition**: When solutions for all subtasks are found and approved, they are composed into a single solution for the original task.

## Tech Stack

-   **Runtime**: [Bun](https://bun.sh/)
-   **LLM Interaction**: [LangChain.js](https://js.langchain.com/)
-   **VCS**: [GitHub API](https://docs.github.com/en/rest) via [Octokit.js](https://github.com/octokit/octokit.js)

## Setup

1.  Clone the repository.
2.  Navigate to the `js-poc-7` directory.
3.  Install dependencies:
    ```sh
    bun install
    ```
4.  Create a `.env` file from the example:
    ```sh
    cp .env.example .env
    ```
5.  Fill in your API keys and configuration in the `.env` file.

## Usage

To start the process, run the CLI with a GitHub issue URL:

```sh
bun src/cli.js --issue <your-github-issue-url>
```
