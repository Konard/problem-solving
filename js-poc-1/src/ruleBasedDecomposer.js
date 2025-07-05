class RuleBasedDecomposer {
  constructor() {
    // Common patterns that indicate task decomposition
    this.patterns = {
      // Match numbered items at the start of a line
      numberedList: /^\s*\d+[\.\)]\s*.+$/gm,
      
      // Match bullet points at the start of a line
      bulletPoints: /^\s*[•\-\*]\s*.+$/gm,
      
      // Match explicit steps
      steps: /^\s*Step\s+\d+:\s*.+$/gim,
      
      // Match prerequisites
      prerequisites: /^\s*Prerequisites?:?\s*.+$/gim,
      
      // Match sequential tasks with first/then pattern
      firstThen: /(?:First|Initially|To start),?\s*([^\.]+?)\s*(?:then|after that|next),?\s*([^\.]+(?:\.|$))/gi
    };
  }

  decompose(taskDescription) {
    const subtasks = [];
    
    // Handle firstThen pattern separately (since it can span lines)
    const firstThenMatches = [...taskDescription.matchAll(this.patterns.firstThen)];
    firstThenMatches.forEach(match => {
      subtasks.push({
        type: 'sequential',
        tasks: [
          { description: match[1].trim(), type: 'prerequisite' },
          { description: match[2].trim(), type: 'dependent' }
        ]
      });
    });
    // Remove firstThen pattern from text to avoid double matching
    let text = taskDescription.replace(this.patterns.firstThen, '');
    // Handle other patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (patternName === 'firstThen') continue;
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        let description = match[0].trim();
        // Remove the marker (number, bullet, etc.)
        if (patternName === 'numberedList') {
          description = description.replace(/^\s*\d+[\.\)]\s*/, '');
        } else if (patternName === 'bulletPoints') {
          description = description.replace(/^\s*[•\-\*]\s*/, '');
        } else if (patternName === 'steps') {
          description = description.replace(/^\s*Step\s+\d+:\s*/, '');
        } else if (patternName === 'prerequisites') {
          description = description.replace(/^\s*Prerequisites?:?\s*/, '');
        }
        if (!subtasks.some(st => st.description === description)) {
          subtasks.push({ description, type: patternName });
        }
      });
    }

    // If no patterns found, treat the whole description as a single task
    if (subtasks.length === 0) {
      subtasks.push({
        description: taskDescription.trim(),
        type: 'atomic'
      });
    }

    return {
      originalTask: taskDescription,
      subtasks,
      metadata: {
        decompositionMethod: subtasks.length > 1 || subtasks.some(st => st.type === 'sequential') ? 'rule-based' : 'atomic',
        patternCount: Object.keys(this.patterns).length,
        subtaskCount: subtasks.length
      }
    };
  }

  validateDecomposition(decomposition) {
    const validation = {
      isValid: true,
      issues: []
    };

    // Check if we have subtasks
    if (decomposition.subtasks.length === 0) {
      validation.isValid = false;
      validation.issues.push('No subtasks found in decomposition');
    }

    // Check for circular dependencies in sequential tasks
    const sequentialTasks = decomposition.subtasks.filter(st => st.type === 'sequential');
    for (const task of sequentialTasks) {
      if (task.tasks.some(t => t.description === task.tasks[0].description)) {
        validation.isValid = false;
        validation.issues.push('Circular dependency detected in sequential tasks');
      }
    }

    return validation;
  }
}

module.exports = RuleBasedDecomposer; 