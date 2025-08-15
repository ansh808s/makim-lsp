import { describe, test, expect } from 'vitest';
import { findTasksInDocument, createTaskCodeLenses } from '../lib/code-lens';

describe('Makim CodeLens', () => {
  test('should find all tasks in a YAML document', () => {
    const yaml = `
groups:
  build:
    tasks:
      compile:
        run: npm run build
      test:
        run: npm test
`;

    const tasks = findTasksInDocument(yaml);

    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.taskName)).toEqual(
      expect.arrayContaining(['compile', 'test']),
    );
    expect(tasks.every((t) => t.groupName === 'build')).toBe(true);
  });

  test('should create a code lens for each task found', () => {
    const yaml = `
groups:
  deploy:
    tasks:
      stage:
        run: echo staging
      prod:
        run: echo production
`;

    const tasks = findTasksInDocument(yaml);
    const lenses = createTaskCodeLenses(tasks, 'file://test.makim.yaml');

    expect(lenses).toHaveLength(2);
    expect(lenses[0].command?.title).toContain('Run deploy.stage');
    expect(lenses[1].command?.title).toContain('Run deploy.prod');
  });

  test('should return empty array when no groups are defined', () => {
    const yaml = `
env:
  VAR1: value
`;

    const tasks = findTasksInDocument(yaml);
    const lenses = createTaskCodeLenses(tasks, 'file://test.makim.yaml');

    expect(tasks).toHaveLength(0);
    expect(lenses).toHaveLength(0);
  });

  test('should return empty array when groups have no tasks', () => {
    const yaml = `
groups:
  build:
    help: This is a build group
`;

    const tasks = findTasksInDocument(yaml);
    const lenses = createTaskCodeLenses(tasks, 'file://test.makim.yaml');

    expect(tasks).toHaveLength(0);
    expect(lenses).toHaveLength(0);
  });
});
