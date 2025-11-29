export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  workload?: 'Easy' | 'Normal' | 'Hard' | 'Extreme';
  dueDate?: string;
  startDate?: string;
  defaultExpanded?: boolean;
  steps?: Array<{ text: string; completed: boolean }>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  archived?: boolean;
}

export interface KanbanBoard {
  title: string;
  columns: KanbanColumn[];
}

export class MarkdownKanbanParser {
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static parseMarkdown(content: string): KanbanBoard {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const board: KanbanBoard = {
      title: '',
      columns: []
    };

    let currentColumn: KanbanColumn | null = null;
    let currentTask: KanbanTask | null = null;
    let inTaskProperties = false;
    let inTaskDescription = false;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check code block markers
      if (trimmedLine.startsWith('```')) {
        if (inTaskDescription) {
          if (trimmedLine === '```md' || trimmedLine === '```') {
            inCodeBlock = !inCodeBlock;
            continue;
          }
        }
      }

      // If inside code block, process as description content
      if (inCodeBlock && inTaskDescription && currentTask) {
        if (trimmedLine === '```') {
          inCodeBlock = false;
          inTaskDescription = false;
          continue;
        } else {
          const cleanLine = line.replace(/^\s{4,}/, '');
          currentTask.description = currentTask.description 
            ? currentTask.description + '\n' + cleanLine
            : cleanLine;
        }
        continue;
      }

      // Parse board title
      if (!inCodeBlock && trimmedLine.startsWith('# ') && !board.title) {
        board.title = trimmedLine.substring(2).trim();
        this.finalizeCurrentTask(currentTask, currentColumn);
        currentTask = null;
        inTaskProperties = false;
        inTaskDescription = false;
        continue;
      }

      // Parse column title
      if (!inCodeBlock && trimmedLine.startsWith('## ')) {
        this.finalizeCurrentTask(currentTask, currentColumn);
        currentTask = null;
        if (currentColumn) {
          board.columns.push(currentColumn);
        }
        
        let columnTitle = trimmedLine.substring(3).trim();
        let isArchived = false;
        
        // Check for [Archived] marker
        if (columnTitle.endsWith('[Archived]')) {
          isArchived = true;
          columnTitle = columnTitle.replace(/\s*\[Archived\]$/, '').trim();
        }
        
        currentColumn = {
          id: this.generateId(),
          title: columnTitle,
          tasks: [],
          archived: isArchived
        };
        inTaskProperties = false;
        inTaskDescription = false;
        continue;
      }

      // Parse task title
      if (!inCodeBlock && this.isTaskTitle(line, trimmedLine)) {
        this.finalizeCurrentTask(currentTask, currentColumn);

        if (currentColumn) {
          let taskTitle = '';

          if (trimmedLine.startsWith('### ')) {
            taskTitle = trimmedLine.substring(4).trim();
          } else {
            taskTitle = trimmedLine.substring(2).trim();
            // Remove checkbox markers
            if (taskTitle.startsWith('[ ] ') || taskTitle.startsWith('[x] ')) {
              taskTitle = taskTitle.substring(4).trim();
            }
          }

          currentTask = {
            id: this.generateId(),
            title: taskTitle,
            description: '',
            tags: []
          };
          inTaskProperties = true;
          inTaskDescription = false;
        }
        continue;
      }

      // Parse task properties
      if (!inCodeBlock && currentTask && inTaskProperties) {
        // Parse inline hashtags
        if (this.parseInlineTags(line, currentTask)) {
          continue;
        }

        if (this.parseTaskProperty(line, currentTask)) {
          continue;
        }

        // Parse step items
        if (this.parseTaskStep(line, currentTask)) {
          continue;
        }

        // Check if description section starts
        if (line.match(/^\s+```md/)) {
          inTaskProperties = false;
          inTaskDescription = true;
          inCodeBlock = true;
          continue;
        }
      }

      // Handle empty lines
      if (trimmedLine === '') {
        continue;
      }

      // Finalize current task
      if (!inCodeBlock && currentTask && (inTaskProperties || inTaskDescription)) {
        this.finalizeCurrentTask(currentTask, currentColumn);
        currentTask = null;
        inTaskProperties = false;
        inTaskDescription = false;
        i--;
      }
    }

    // Add final task and column
    this.finalizeCurrentTask(currentTask, currentColumn);
    if (currentColumn) {
      board.columns.push(currentColumn);
    }

    return board;
  }

  private static isTaskTitle(line: string, trimmedLine: string): boolean {
    // Exclude property lines and step items
    if (line.startsWith('- ') &&
        (trimmedLine.match(/^\s*- (due|tags|priority|workload|steps|defaultExpanded):/) ||
         line.match(/^\s{6,}- \[([ x])\]/))) {
      return false;
    }

    return (line.startsWith('- ') && !line.startsWith('  ')) ||
           trimmedLine.startsWith('### ');
  }

  private static parseInlineTags(line: string, task: KanbanTask): boolean {
    const trimmed = line.trim();

    // Check if line contains hashtags
    if (!trimmed.startsWith('#')) {
      return false;
    }

    // Extract all hashtags from the line
    const hashtagMatches = trimmed.match(/#[\w\-@$%✓0-9]+/g);
    if (!hashtagMatches) {
      return false;
    }

    // Remove '#' prefix and add to tags array
    const tags = hashtagMatches.map(tag => tag.substring(1));

    if (!task.tags) {
      task.tags = [];
    }

    task.tags.push(...tags);
    return true;
  }

  private static parseTaskProperty(line: string, task: KanbanTask): boolean {
    const propertyMatch = line.match(/^\s+- (due|tags|priority|workload|steps|defaultExpanded):\s*(.*)$/);
    if (!propertyMatch) return false;

    const [, propertyName, propertyValue] = propertyMatch;
    const value = propertyValue.trim();

    switch (propertyName) {
      case 'due':
        task.dueDate = value;
        break;
      case 'tags':
        const tagsMatch = value.match(/\[(.*)\]/);
        if (tagsMatch) {
          const arrayTags = tagsMatch[1].split(',').map(tag => tag.trim());
          if (!task.tags) {
            task.tags = [];
          }
          task.tags.push(...arrayTags);
        }
        break;
      case 'priority':
        if (['low', 'medium', 'high'].includes(value)) {
          task.priority = value as 'low' | 'medium' | 'high';
        }
        break;
      case 'workload':
        if (['Easy', 'Normal', 'Hard', 'Extreme'].includes(value)) {
          task.workload = value as 'Easy' | 'Normal' | 'Hard' | 'Extreme';
        }
        break;
      case 'defaultExpanded':
        task.defaultExpanded = value.toLowerCase() === 'true';
        break;
      case 'steps':
        task.steps = [];
        break;
    }
    return true;
  }

  private static parseTaskStep(line: string, task: KanbanTask): boolean {
    if (!task.steps) return false;
    
    const stepMatch = line.match(/^\s{6,}- \[([ x])\]\s*(.*)$/);
    if (!stepMatch) return false;

    const [, checkmark, text] = stepMatch;
    task.steps.push({ 
      text: text.trim(), 
      completed: checkmark === 'x' 
    });
    return true;
  }

  private static finalizeCurrentTask(task: KanbanTask | null, column: KanbanColumn | null): void {
    if (!task || !column) return;

    if (task.description) {
      task.description = task.description.trim();
      if (task.description === '') {
        delete task.description;
      }
    }
    column.tasks.push(task);
  }

  static generateMarkdown(board: KanbanBoard, taskHeaderFormat: 'title' | 'list' = 'title'): string {
    let markdown = '';

    if (board.title) {
      markdown += `# ${board.title}\n\n`;
    }

    for (const column of board.columns) {
      const columnTitle = column.archived ? `${column.title} [Archived]` : column.title;
      markdown += `## ${columnTitle}\n\n`;

      for (const task of column.tasks) {
        if (taskHeaderFormat === 'title') {
          markdown += `### ${task.title}\n\n`;
        } else {
          markdown += `- ${task.title}\n`;
        }

        // Add task properties
        markdown += this.generateTaskProperties(task);

        // Add description
        if (task.description && task.description.trim() !== '') {
          markdown += `    \`\`\`md\n`;
          const descriptionLines = task.description.trim().split('\n');
          for (const descLine of descriptionLines) {
            markdown += `    ${descLine}\n`;
          }
          markdown += `    \`\`\`\n`;
        }

        markdown += '\n';
      }
    }
    return markdown;
  }

  private static generateTaskProperties(task: KanbanTask): string {
    let properties = '';

    if (task.dueDate) {
      properties += `  - due: ${task.dueDate}\n`;
    }
    if (task.tags && task.tags.length > 0) {
      properties += `  - tags: [${task.tags.join(', ')}]\n`;
    }
    if (task.priority) {
      properties += `  - priority: ${task.priority}\n`;
    }
    if (task.workload) {
      properties += `  - workload: ${task.workload}\n`;
    }
    if (task.defaultExpanded !== undefined) {
      properties += `  - defaultExpanded: ${task.defaultExpanded}\n`;
    }
    if (task.steps && task.steps.length > 0) {
      properties += `  - steps:\n`;
      for (const step of task.steps) {
        const checkbox = step.completed ? '[x]' : '[ ]';
        properties += `      - ${checkbox} ${step.text}\n`;
      }
    }

    return properties;
  }
}