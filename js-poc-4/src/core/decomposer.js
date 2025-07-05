import { llmClient } from "./llmClient.js";

/**
 * Universal Algorithm Task Decomposer
 * 
 * Breaks down complex tasks into manageable subtasks using LLM intelligence.
 * Analyzes dependencies, estimates complexity, and creates actionable work items.
 */
export class TaskDecomposer {
  constructor(options = {}) {
    this.llmClient = options.llmClient || llmClient;
    this.maxSubtasks = options.maxSubtasks || parseInt(process.env.UA_MAX_SUBTASKS) || 10;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
  }

  /**
   * Decompose a high-level task into subtasks
   */
  async decompose(taskDescription, options = {}) {
    if (this.debug) {
      console.log(`[TaskDecomposer] Decomposing task: ${taskDescription}`);
    }

    try {
      const result = await this.llmClient.decomposeTask(taskDescription, options);
      
      // Validate and process the result
      const processedResult = this.processDecompositionResult(result, taskDescription);
      
      if (this.debug) {
        console.log(`[TaskDecomposer] Decomposed into ${processedResult.subtasks.length} subtasks`);
      }

      return processedResult;
    } catch (error) {
      console.error(`[TaskDecomposer] Error decomposing task:`, error);
      
      // Fallback to simple decomposition
      return this.createFallbackDecomposition(taskDescription);
    }
  }

  /**
   * Process and validate the decomposition result
   */
  processDecompositionResult(result, originalTask) {
    // Ensure we don't exceed max subtasks
    let subtasks = result.subtasks.slice(0, this.maxSubtasks);
    
    // Validate and clean up subtasks
    subtasks = subtasks.map((subtask, index) => ({
      ...subtask,
      id: subtask.id || `subtask-${index + 1}`,
      title: subtask.title || `Subtask ${index + 1}`,
      description: subtask.description || subtask.title,
      priority: subtask.priority || "medium",
      estimatedComplexity: Math.max(1, Math.min(10, subtask.estimatedComplexity || 5)),
      dependencies: Array.isArray(subtask.dependencies) ? subtask.dependencies : [],
      acceptanceCriteria: Array.isArray(subtask.acceptanceCriteria) ? subtask.acceptanceCriteria : [],
    }));

    // Validate dependencies exist
    const subtaskIds = new Set(subtasks.map(s => s.id));
    subtasks = subtasks.map(subtask => ({
      ...subtask,
      dependencies: subtask.dependencies.filter(dep => subtaskIds.has(dep)),
    }));

    // Calculate metadata
    const metadata = {
      ...result.metadata,
      totalSubtasks: subtasks.length,
      estimatedTotalComplexity: subtasks.reduce((sum, s) => sum + s.estimatedComplexity, 0),
      decompositionReasoning: result.metadata?.decompositionReasoning || "LLM-based decomposition",
    };

    return {
      originalTask,
      subtasks,
      metadata,
    };
  }

  /**
   * Create a fallback decomposition when LLM fails
   */
  createFallbackDecomposition(taskDescription) {
    if (this.debug) {
      console.log(`[TaskDecomposer] Creating fallback decomposition for: ${taskDescription}`);
    }

    return {
      originalTask: taskDescription,
      subtasks: [
        {
          id: "subtask-1",
          title: "Analyze Requirements",
          description: "Analyze and understand the requirements for: " + taskDescription,
          priority: "high",
          estimatedComplexity: 3,
          dependencies: [],
          acceptanceCriteria: ["Requirements are clearly documented", "Edge cases are identified"],
        },
        {
          id: "subtask-2",
          title: "Design Solution",
          description: "Design the solution architecture and approach",
          priority: "high",
          estimatedComplexity: 5,
          dependencies: ["subtask-1"],
          acceptanceCriteria: ["Solution design is documented", "Technical approach is defined"],
        },
        {
          id: "subtask-3",
          title: "Implement Solution",
          description: "Implement the solution based on the design",
          priority: "high",
          estimatedComplexity: 7,
          dependencies: ["subtask-2"],
          acceptanceCriteria: ["Implementation is complete", "Code follows best practices"],
        },
        {
          id: "subtask-4",
          title: "Test Solution",
          description: "Test the implemented solution thoroughly",
          priority: "medium",
          estimatedComplexity: 4,
          dependencies: ["subtask-3"],
          acceptanceCriteria: ["All tests pass", "Edge cases are covered"],
        },
      ],
      metadata: {
        totalSubtasks: 4,
        estimatedTotalComplexity: 19,
        decompositionReasoning: "Fallback decomposition using generic software development lifecycle",
      },
    };
  }

  /**
   * Get subtasks in dependency order
   */
  getSubtasksInOrder(subtasks) {
    const ordered = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (subtask) => {
      if (visiting.has(subtask.id)) {
        throw new Error(`Circular dependency detected involving subtask: ${subtask.id}`);
      }
      
      if (visited.has(subtask.id)) {
        return;
      }

      visiting.add(subtask.id);

      // Visit dependencies first
      for (const depId of subtask.dependencies) {
        const depSubtask = subtasks.find(s => s.id === depId);
        if (depSubtask) {
          visit(depSubtask);
        }
      }

      visiting.delete(subtask.id);
      visited.add(subtask.id);
      ordered.push(subtask);
    };

    for (const subtask of subtasks) {
      visit(subtask);
    }

    return ordered;
  }

  /**
   * Get subtasks that can be worked on in parallel
   */
  getParallelSubtasks(subtasks) {
    const orderedSubtasks = this.getSubtasksInOrder(subtasks);
    const parallelGroups = [];
    const completed = new Set();

    for (const subtask of orderedSubtasks) {
      // Check if all dependencies are completed
      const canStart = subtask.dependencies.every(dep => completed.has(dep));
      
      if (canStart) {
        // Find or create a group for this subtask
        let group = parallelGroups.find(g => 
          g.every(s => !subtask.dependencies.includes(s.id))
        );
        
        if (!group) {
          group = [];
          parallelGroups.push(group);
        }
        
        group.push(subtask);
        completed.add(subtask.id);
      }
    }

    return parallelGroups;
  }

  /**
   * Analyze the decomposition quality
   */
  analyzeDecomposition(decomposition) {
    const { subtasks, metadata } = decomposition;
    
    const analysis = {
      totalSubtasks: subtasks.length,
      avgComplexity: subtasks.reduce((sum, s) => sum + s.estimatedComplexity, 0) / subtasks.length,
      hasHighPriority: subtasks.some(s => s.priority === "high"),
      hasDependencies: subtasks.some(s => s.dependencies.length > 0),
      allHaveAcceptanceCriteria: subtasks.every(s => s.acceptanceCriteria.length > 0),
      balancedComplexity: Math.max(...subtasks.map(s => s.estimatedComplexity)) - Math.min(...subtasks.map(s => s.estimatedComplexity)) <= 7,
      parallelizability: this.getParallelSubtasks(subtasks).length,
    };

    // Calculate quality score
    let qualityScore = 0;
    if (analysis.totalSubtasks >= 2 && analysis.totalSubtasks <= 8) qualityScore += 20;
    if (analysis.avgComplexity >= 3 && analysis.avgComplexity <= 7) qualityScore += 20;
    if (analysis.hasHighPriority) qualityScore += 10;
    if (analysis.hasDependencies) qualityScore += 10;
    if (analysis.allHaveAcceptanceCriteria) qualityScore += 20;
    if (analysis.balancedComplexity) qualityScore += 10;
    if (analysis.parallelizability > 1) qualityScore += 10;

    analysis.qualityScore = qualityScore;
    analysis.qualityGrade = this.getQualityGrade(qualityScore);

    return analysis;
  }

  /**
   * Get quality grade based on score
   */
  getQualityGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }
}

// Export a default instance
export const taskDecomposer = new TaskDecomposer();

// Export convenience methods
export const {
  decompose,
  getSubtasksInOrder,
  getParallelSubtasks,
  analyzeDecomposition,
} = taskDecomposer; 