# Test Structure

This directory contains all tests for the Universal Algorithm project, organized by type:

## 📁 Test Categories

### 🧪 Unit Tests (`unit/`)
Tests for individual components in isolation with mocked dependencies.

**Files:**
- `cli.test.js` - Command line interface tests
- `githubClient.test.js` - GitHub API client tests  
- `repositoryManager.test.js` - Repository management tests

**Run with:**
```bash
bun test tests/unit/
```

### 🔗 Integration Tests (`integration/`)
Tests that verify multiple components work together with real external services.

**Files:**
- `orchestrator.test.js` - Full orchestrator workflow tests
- `githubIntegration.test.js` - GitHub API integration tests

**Run with:**
```bash
bun test tests/integration/
```

### 🚀 End-to-End Tests (`e2e/`)
Full system tests that simulate real user workflows with mocked LLM responses.

**Files:**
- `sqrt-universal-algorithm.test.js` - Complete Universal Algorithm pipeline for square root
- `universalAlgorithm.test.js` - General Universal Algorithm workflow tests

**Run with:**
```bash
bun test tests/e2e/
```

## 🏃‍♂️ Running Tests

### Run All Tests
```bash
bun test
```

### Run Specific Categories
```bash
# Unit tests only
bun test tests/unit/

# Integration tests only  
bun test tests/integration/

# E2E tests only
bun test tests/e2e/
```

### Run Individual Test Files
```bash
bun test tests/e2e/sqrt-universal-algorithm.test.js
```

## 📋 Test Types Explained

### Unit Tests
- **Purpose**: Test individual functions/methods in isolation
- **Dependencies**: All external dependencies are mocked
- **Speed**: Fast execution
- **Scope**: Single component or function

### Integration Tests  
- **Purpose**: Test how components work together
- **Dependencies**: Some real services (GitHub API), others mocked
- **Speed**: Medium execution time
- **Scope**: Multiple components working together

### End-to-End Tests
- **Purpose**: Test complete user workflows
- **Dependencies**: Real GitHub API, mocked LLM responses
- **Speed**: Slower execution (real API calls)
- **Scope**: Full system workflow

## 🔧 Test Configuration

### Environment Variables
Tests use these environment variables (see `.env.example`):
- `GITHUB_TOKEN` - GitHub API token
- `TEST_REPO_DELETE_ON_SUCCESS` - Whether to delete test repositories
- `UNIVERSAL_ALGORITHM_TEST_MODE` - Enable test mode for faster approvals

### Test Repositories
- E2E tests create real GitHub repositories
- Repositories are cleaned up based on `TEST_REPO_DELETE_ON_SUCCESS` setting
- Each test file creates one repository for all its tests

## 📊 Test Coverage

- **Unit Tests**: 100% coverage of individual components
- **Integration Tests**: Component interaction coverage
- **E2E Tests**: Full workflow coverage with real GitHub integration

## 🚨 Important Notes

1. **GitHub Rate Limits**: Integration and E2E tests use real GitHub API calls
2. **Test Repositories**: E2E tests create real repositories that may need manual cleanup
3. **LLM Mocks**: E2E tests use mocked LLM responses for predictable behavior
4. **Environment Setup**: Ensure `.env` file is configured before running tests 