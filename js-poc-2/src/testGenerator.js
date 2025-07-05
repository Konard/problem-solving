import { writeFile } from "fs/promises";
import { join } from "path";

/**
 * Generates a failing Bun test file for a given subtask.
 * Returns the relative path to the created test file.
 */
export async function generateFailingTest({ subtaskTitle, subtaskBody }) {
  const safeName = subtaskTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const fileName = `${safeName}.test.js`;
  const filePath = join("tests", fileName);

  const testTemplate = `import { expect, test } from 'bun:test';

// Failing test for: ${subtaskTitle}
// ${subtaskBody.replace(/\n/g, "\n// ")}

test('${subtaskTitle}', () => {
  // TODO: Implement
  expect(false).toBe(true);
});
`;

  await writeFile(filePath, testTemplate, "utf8");
  return filePath;
} 