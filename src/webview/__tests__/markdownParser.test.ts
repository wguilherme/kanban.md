import { describe, it, expect } from 'vitest';
import { MarkdownKanbanParser } from '../../markdownParser';

const testFileContent = `# Test Features Board

## To Do

### Design Login Page
#design #frontend #ui
  - priority: high
  - workload: Hard
  - due: 2024-12-15
  - steps:
      - [ ] Create wireframe
      - [ ] Design mockups
      - [x] Get approval

### Write API Docs
  - tags: [backend, documentation]
  - priority: medium
  - workload: Normal

## In Progress

### Setup Database
#backend #infrastructure
  - priority: high
  - workload: Extreme
  - steps:
      - [x] Install PostgreSQL
      - [x] Create schemas
      - [ ] Add migrations

## Done

### Project Kickoff
  - tags: [planning]
  - priority: low
  - workload: Easy
`;

describe('MarkdownKanbanParser', () => {
  describe('parseMarkdown - Real file test', () => {
    it('parses test-features.kanban.md correctly', () => {
      const board = MarkdownKanbanParser.parseMarkdown(testFileContent);

      expect(board.title).toBe('Test Features Board');
      expect(board.columns).toHaveLength(3);

      // First task - Design Login Page
      const task1 = board.columns[0].tasks[0];
      expect(task1.title).toBe('Design Login Page');
      expect(task1.priority).toBe('high');
      expect(task1.workload).toBe('Hard');
      expect(task1.dueDate).toBe('2024-12-15');
      expect(task1.tags).toContain('design');
      expect(task1.tags).toContain('frontend');
      expect(task1.tags).toContain('ui');
      expect(task1.steps).toHaveLength(3);
      expect(task1.steps![0].text).toBe('Create wireframe');
      expect(task1.steps![2].completed).toBe(true);

      // Second task - Write API Docs
      const task2 = board.columns[0].tasks[1];
      expect(task2.title).toBe('Write API Docs');
      expect(task2.priority).toBe('medium');
      expect(task2.workload).toBe('Normal');
      expect(task2.tags).toContain('backend');
      expect(task2.tags).toContain('documentation');

      // Third task - Setup Database
      const task3 = board.columns[1].tasks[0];
      expect(task3.title).toBe('Setup Database');
      expect(task3.priority).toBe('high');
      expect(task3.workload).toBe('Extreme');
      expect(task3.tags).toContain('backend');
      expect(task3.tags).toContain('infrastructure');

      // Fourth task - Project Kickoff
      const task4 = board.columns[2].tasks[0];
      expect(task4.title).toBe('Project Kickoff');
      expect(task4.priority).toBe('low');
      expect(task4.workload).toBe('Easy');
      expect(task4.tags).toContain('planning');
    });
  });

  describe('parseMarkdown - Priority', () => {
    it('parses structured priority format', () => {
      const markdown = `# Board

## To Do

### Task One
  - priority: high
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].priority).toBe('high');
    });

    it('parses all priority levels', () => {
      const markdown = `# Board

## Column

### High Priority
  - priority: high

### Medium Priority
  - priority: medium

### Low Priority
  - priority: low
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].priority).toBe('high');
      expect(board.columns[0].tasks[1].priority).toBe('medium');
      expect(board.columns[0].tasks[2].priority).toBe('low');
    });
  });

  describe('parseMarkdown - Tags', () => {
    it('parses inline hashtag tags', () => {
      const markdown = `# Board

## To Do

### Task One
#frontend #backend
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].tags).toContain('frontend');
      expect(board.columns[0].tasks[0].tags).toContain('backend');
    });

    it('parses array format tags', () => {
      const markdown = `# Board

## To Do

### Task One
  - tags: [design, ui, ux]
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].tags).toContain('design');
      expect(board.columns[0].tasks[0].tags).toContain('ui');
      expect(board.columns[0].tasks[0].tags).toContain('ux');
    });
  });

  describe('parseMarkdown - Steps', () => {
    it('parses steps with checkboxes', () => {
      const markdown = `# Board

## To Do

### Task One
  - steps:
      - [ ] Step one
      - [x] Step two
      - [ ] Step three
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      const steps = board.columns[0].tasks[0].steps;

      expect(steps).toHaveLength(3);
      expect(steps![0].text).toBe('Step one');
      expect(steps![0].completed).toBe(false);
      expect(steps![1].text).toBe('Step two');
      expect(steps![1].completed).toBe(true);
      expect(steps![2].text).toBe('Step three');
      expect(steps![2].completed).toBe(false);
    });
  });

  describe('parseMarkdown - Workload', () => {
    it('parses all workload levels', () => {
      const markdown = `# Board

## Column

### Easy Task
  - workload: Easy

### Normal Task
  - workload: Normal

### Hard Task
  - workload: Hard

### Extreme Task
  - workload: Extreme
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].workload).toBe('Easy');
      expect(board.columns[0].tasks[1].workload).toBe('Normal');
      expect(board.columns[0].tasks[2].workload).toBe('Hard');
      expect(board.columns[0].tasks[3].workload).toBe('Extreme');
    });
  });

  describe('parseMarkdown - Due Date', () => {
    it('parses due date', () => {
      const markdown = `# Board

## To Do

### Task One
  - due: 2024-12-31
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      expect(board.columns[0].tasks[0].dueDate).toBe('2024-12-31');
    });
  });

  describe('parseMarkdown - Combined properties', () => {
    it('parses task with all properties', () => {
      const markdown = `# Board

## To Do

### Complete Task
#urgent
  - priority: high
  - workload: Hard
  - due: 2024-12-25
  - tags: [feature, important]
  - steps:
      - [x] First step
      - [ ] Second step
`;
      const board = MarkdownKanbanParser.parseMarkdown(markdown);
      const task = board.columns[0].tasks[0];

      expect(task.title).toBe('Complete Task');
      expect(task.priority).toBe('high');
      expect(task.workload).toBe('Hard');
      expect(task.dueDate).toBe('2024-12-25');
      expect(task.tags).toContain('urgent');
      expect(task.tags).toContain('feature');
      expect(task.tags).toContain('important');
      expect(task.steps).toHaveLength(2);
    });
  });
});
