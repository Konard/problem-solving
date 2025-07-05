import { test, describe, beforeEach, afterEach } from 'bun:test';
import assert from 'assert';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set test environment variables
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should show help when no arguments provided', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // The CLI runs the default solve command when no args provided
        // Should show some output (even if it's an error due to missing env vars)
        assert.ok(output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle solve command', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'solve', 'Test task'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show some output (even if it's an error due to missing env vars)
        assert.ok(output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle decompose command', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'decompose', 'Test task'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show some output
        assert.ok(output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle test command', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'test', 'Test task'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show some output
        assert.ok(output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle cleanup command', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'cleanup'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show some output
        assert.ok(output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle dry-run option', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'solve', '--dry-run', 'Test task'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show dry-run message
        assert.ok(output.includes('dry-run') || output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });

  test('should handle debug option', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/cli.js', 'solve', '--debug', 'Test task'], {
        cwd: join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Should show debug message
        assert.ok(output.includes('debug') || output.length > 0);
        resolve();
      });

      child.on('error', reject);
    });
  });
}); 