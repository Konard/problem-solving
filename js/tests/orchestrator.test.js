import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Orchestrator } from '../src/orchestrator.js';

describe('Orchestrator', () => {
  test('should be instantiable', () => {
    const orchestrator = new Orchestrator();
    assert.ok(orchestrator);
    assert.ok(orchestrator.decomposer);
    assert.ok(orchestrator.testGenerator);
    assert.ok(orchestrator.solutionSearcher);
    assert.ok(orchestrator.composer);
  });

  test('should have execute method', () => {
    const orchestrator = new Orchestrator();
    assert.strictEqual(typeof orchestrator.execute, 'function');
  });

  test('should have decomposeTask method', () => {
    const orchestrator = new Orchestrator();
    assert.strictEqual(typeof orchestrator.decomposeTask, 'function');
  });

  test('should have generateTest method', () => {
    const orchestrator = new Orchestrator();
    assert.strictEqual(typeof orchestrator.generateTest, 'function');
  });
}); 