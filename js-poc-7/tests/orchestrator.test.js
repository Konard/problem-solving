import { test, expect, spyOn } from 'bun:test';
import { run } from '../../src/orchestrator.js';
import * as decomposer from '../../src/core/decomposer.js';
import * as testGenerator from '../../src/core/testGenerator.js';
import * as solutionSearcher from '../../src/core/solutionSearcher.js';
import * as composer from '../../src/core/composer.js';

test('orchestrator should call all modules in sequence', async () => {
  const decomposeSpy = spyOn(decomposer, 'decomposeTask').mockResolvedValue([
    { title: 'Subtask 1', number: 2 }
  ]);
  const generateTestSpy = spyOn(testGenerator, 'generateTest').mockResolvedValue({});
  const findSolutionSpy = spyOn(solutionSearcher, 'findSolution').mockResolvedValue({});
  const composeSpy = spyOn(composer, 'composeSolution').mockResolvedValue({});

  const mainIssue = { title: 'Main Task', number: 1 };
  await run(mainIssue);

  expect(decomposeSpy).toHaveBeenCalledTimes(1);
  expect(generateTestSpy).toHaveBeenCalledTimes(1);
  expect(findSolutionSpy).toHaveBeenCalledTimes(1);
  expect(composeSpy).toHaveBeenCalledTimes(1);
}); 