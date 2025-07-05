import { test, expect, mock } from 'bun:test';
import githubClient from '../../src/core/githubClient.js';

mock.module('octokit', () => ({
  Octokit: class {
    constructor(options) {
      this.options = options;
    }
  }
}));

test('githubClient should be configured correctly', () => {
  expect(githubClient.options.auth).toBe(process.env.GITHUB_TOKEN);
}); 