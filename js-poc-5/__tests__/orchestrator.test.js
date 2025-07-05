import { UniversalAlgorithm } from "../src/orchestrator.js";
import { LLMClient } from "../src/core/llmClient.js";
import { GitHubClient } from "../src/core/githubClient.js";

// Mock the core components
jest.mock("../src/core/llmClient.js");
jest.mock("../src/core/githubClient.js");

describe("UniversalAlgorithm", () => {
  let ua;
  let mockLLMClient;
  let mockGitHubClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockLLMClient = {
      generateDecomposition: jest.fn(),
      generateTest: jest.fn(),
      generateSolution: jest.fn(),
      composeSolutions: jest.fn(),
    };
    
    mockGitHubClient = {
      createIssue: jest.fn(),
      createPullRequest: jest.fn(),
      createBranch: jest.fn(),
      createOrUpdateFile: jest.fn(),
      addIssueComment: jest.fn(),
      linkIssues: jest.fn(),
      generateBranchName: jest.fn(),
      getIssue: jest.fn(),
    };
    
    // Mock the constructors
    LLMClient.mockImplementation(() => mockLLMClient);
    GitHubClient.mockImplementation(() => mockGitHubClient);
    
    ua = new UniversalAlgorithm({
      llmClient: mockLLMClient,
      githubClient: mockGitHubClient,
      verbose: false,
    });
  });

  describe("Constructor", () => {
    it("should initialize with default options", () => {
      const defaultUA = new UniversalAlgorithm();
      expect(defaultUA).toBeInstanceOf(UniversalAlgorithm);
      expect(defaultUA.verbose).toBe(false);
    });

    it("should initialize with custom options", () => {
      const customUA = new UniversalAlgorithm({
        verbose: true,
        llmClient: mockLLMClient,
        githubClient: mockGitHubClient,
      });
      expect(customUA.verbose).toBe(true);
      expect(customUA.llmClient).toBe(mockLLMClient);
      expect(customUA.githubClient).toBe(mockGitHubClient);
    });
  });

  describe("solve", () => {
    const mockTaskDescription = "Build a URL shortener service";
    
    beforeEach(() => {
      // Mock successful decomposition
      mockLLMClient.generateDecomposition.mockResolvedValue({
        subtasks: [
          {
            title: "Create URL validation",
            description: "Validate input URLs",
            acceptanceCriteria: ["URL is valid", "Error handling"],
            dependencies: [],
          },
          {
            title: "Generate short codes",
            description: "Create unique short codes",
            acceptanceCriteria: ["Unique codes", "Collision handling"],
            dependencies: [],
          },
        ],
      });
      
      // Mock GitHub API calls
      mockGitHubClient.createIssue
        .mockResolvedValueOnce({
          number: 1,
          title: "[MAIN] Build a URL shortener service",
          body: "Main task description",
          html_url: "https://github.com/test/repo/issues/1",
        })
        .mockResolvedValueOnce({
          number: 2,
          title: "[SUBTASK] Create URL validation",
          body: "Subtask description",
          html_url: "https://github.com/test/repo/issues/2",
          subtaskData: {
            title: "Create URL validation",
            description: "Validate input URLs",
            acceptanceCriteria: ["URL is valid", "Error handling"],
            dependencies: [],
          },
        })
        .mockResolvedValueOnce({
          number: 3,
          title: "[SUBTASK] Generate short codes",
          body: "Subtask description",
          html_url: "https://github.com/test/repo/issues/3",
          subtaskData: {
            title: "Generate short codes",
            description: "Create unique short codes",
            acceptanceCriteria: ["Unique codes", "Collision handling"],
            dependencies: [],
          },
        });
      
      mockGitHubClient.linkIssues.mockResolvedValue({});
      
      // Mock test generation
      mockLLMClient.generateTest.mockResolvedValue(`
        describe("URL Validation", () => {
          it("should validate URLs", () => {
            expect(validateURL("https://example.com")).toBe(true);
          });
        });
      `);
      
      mockGitHubClient.createBranch.mockResolvedValue({});
      mockGitHubClient.createOrUpdateFile.mockResolvedValue({});
      mockGitHubClient.createPullRequest.mockResolvedValue({
        number: 10,
        title: "[TEST] Create URL validation",
        html_url: "https://github.com/test/repo/pull/10",
      });
      mockGitHubClient.addIssueComment.mockResolvedValue({});
      mockGitHubClient.generateBranchName.mockReturnValue("test/create-url-validation");
      
      // Mock solution generation
      mockLLMClient.generateSolution.mockResolvedValue(`
        export function validateURL(url) {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        }
      `);
      
      // Mock composition
      mockLLMClient.composeSolutions.mockResolvedValue(`
        export { validateURL } from "./url-validation.js";
        export { generateShortCode } from "./short-code-generator.js";
        
        export class URLShortener {
          constructor() {
            this.urls = new Map();
          }
          
          shorten(url) {
            if (!validateURL(url)) {
              throw new Error("Invalid URL");
            }
            const shortCode = generateShortCode();
            this.urls.set(shortCode, url);
            return shortCode;
          }
        }
      `);
    });

    it("should complete the full solve workflow", async () => {
      const result = await ua.solve(mockTaskDescription);
      
      expect(result).toHaveProperty("taskDescription", mockTaskDescription);
      expect(result).toHaveProperty("phases");
      expect(result.phases).toHaveProperty("decomposition");
      expect(result.phases).toHaveProperty("testGeneration");
      expect(result.phases).toHaveProperty("solutionSearch");
      expect(result.phases).toHaveProperty("composition");
      
      // Verify decomposition phase
      expect(mockLLMClient.generateDecomposition).toHaveBeenCalledWith(mockTaskDescription);
      expect(mockGitHubClient.createIssue).toHaveBeenCalledTimes(3); // 1 main + 2 subtasks
      
      // Verify test generation phase
      expect(mockLLMClient.generateTest).toHaveBeenCalledTimes(2);
      
      // Verify solution search phase
      expect(mockLLMClient.generateSolution).toHaveBeenCalledTimes(2);
      
      // Verify composition phase
      expect(mockLLMClient.composeSolutions).toHaveBeenCalledTimes(1);
      
      expect(result.phases.decomposition.subtaskIssues).toHaveLength(2);
      expect(result.phases.testGeneration).toHaveLength(2);
      expect(result.phases.solutionSearch).toHaveLength(2);
      expect(result.phases.composition.status).toBe("success");
    });

    it("should handle errors gracefully", async () => {
      mockLLMClient.generateDecomposition.mockRejectedValue(new Error("LLM API error"));
      
      await expect(ua.solve(mockTaskDescription)).rejects.toThrow("LLM API error");
    });
  });

  describe("decomposeOnly", () => {
    it("should decompose a task without solving", async () => {
      const mockTaskDescription = "Build a chat application";
      
      mockLLMClient.generateDecomposition.mockResolvedValue({
        subtasks: [
          {
            title: "Create user authentication",
            description: "Implement login/signup",
            acceptanceCriteria: ["User can login", "User can signup"],
            dependencies: [],
          },
        ],
      });
      
      mockGitHubClient.createIssue.mockResolvedValue({
        number: 1,
        title: "[MAIN] Build a chat application",
        body: "Main task description",
      });
      
      mockGitHubClient.linkIssues.mockResolvedValue({});
      
      const result = await ua.decomposeOnly(mockTaskDescription);
      
      expect(result).toHaveProperty("mainIssue");
      expect(result).toHaveProperty("subtaskIssues");
      expect(result.subtaskIssues).toHaveLength(1);
      expect(mockLLMClient.generateDecomposition).toHaveBeenCalledWith(mockTaskDescription);
      expect(mockLLMClient.generateTest).not.toHaveBeenCalled();
      expect(mockLLMClient.generateSolution).not.toHaveBeenCalled();
    });
  });

  describe("solveSubtask", () => {
    it("should solve a single subtask", async () => {
      const mockIssueNumber = 123;
      const mockSubtaskIssue = {
        number: mockIssueNumber,
        title: "[SUBTASK] Create user authentication",
        body: `## Subtask Description
        Implement login/signup functionality
        
        ## Acceptance Criteria
        - [ ] User can login
        - [ ] User can signup`,
      };
      
      mockGitHubClient.getIssue.mockResolvedValue(mockSubtaskIssue);
      mockLLMClient.generateTest.mockResolvedValue("test code");
      mockLLMClient.generateSolution.mockResolvedValue("solution code");
      
      mockGitHubClient.createBranch.mockResolvedValue({});
      mockGitHubClient.createOrUpdateFile.mockResolvedValue({});
      mockGitHubClient.createPullRequest.mockResolvedValue({
        number: 10,
        title: "[TEST] Create user authentication",
      });
      mockGitHubClient.addIssueComment.mockResolvedValue({});
      mockGitHubClient.generateBranchName.mockReturnValue("test/create-user-auth");
      
      const result = await ua.solveSubtask(mockIssueNumber);
      
      expect(result).toHaveProperty("subtaskIssue");
      expect(result).toHaveProperty("testResult");
      expect(result).toHaveProperty("solutionResult");
      expect(mockGitHubClient.getIssue).toHaveBeenCalledWith(mockIssueNumber);
      expect(mockLLMClient.generateTest).toHaveBeenCalledTimes(1);
      expect(mockLLMClient.generateSolution).toHaveBeenCalledTimes(1);
    });
  });

  describe("parseSubtaskFromIssue", () => {
    it("should parse subtask data from issue", () => {
      const mockIssue = {
        title: "[SUBTASK] Create user authentication",
        body: `## Subtask Description
        Implement login/signup functionality
        
        ## Acceptance Criteria
        - [ ] User can login
        - [ ] User can signup
        - [ ] Password validation works`,
      };
      
      const result = ua.parseSubtaskFromIssue(mockIssue);
      
      expect(result.title).toBe("Create user authentication");
      expect(result.description).toContain("Implement login/signup functionality");
      expect(result.acceptanceCriteria).toHaveLength(3);
      expect(result.acceptanceCriteria[0]).toBe("User can login");
      expect(result.acceptanceCriteria[1]).toBe("User can signup");
      expect(result.acceptanceCriteria[2]).toBe("Password validation works");
    });
  });

  describe("extractAcceptanceCriteria", () => {
    it("should extract acceptance criteria from issue body", () => {
      const issueBody = `## Subtask Description
      Some description
      
      ## Acceptance Criteria
      - [ ] Criterion 1
      - [ ] Criterion 2
      - [ ] Criterion 3
      
      ## Other Section
      Some other content`;
      
      const result = ua.extractAcceptanceCriteria(issueBody);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Criterion 1");
      expect(result[1]).toBe("Criterion 2");
      expect(result[2]).toBe("Criterion 3");
    });
    
    it("should return empty array if no acceptance criteria found", () => {
      const issueBody = `## Subtask Description
      Some description without criteria`;
      
      const result = ua.extractAcceptanceCriteria(issueBody);
      
      expect(result).toHaveLength(0);
    });
  });
}); 