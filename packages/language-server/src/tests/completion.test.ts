import { describe, test, expect } from 'vitest';
import { handleCompletion } from '../handlers/completion';
import { Position } from 'vscode-languageserver/node';

describe('Makim Completion', () => {
  test('should suggest top-level keys', () => {
    const yaml = `
`;
    const position: Position = { line: 1, character: 0 };
    const items = handleCompletion(yaml, position);
    const labels = items.map((item) => item.label);
    expect(labels).toContain('groups');
    expect(labels).toContain('env');
  });

  test('should suggest task-level keys', () => {
    const yaml = `
groups:
  build:
    tasks:
      compile:
        `;
    const position: Position = { line: 5, character: 8 };
    const items = handleCompletion(yaml, position);
    const labels = items.map((item) => item.label);

    expect(labels).toContain('run');
    expect(labels).toContain('backend');
    expect(labels).toContain('log');
  });

  test('should suggest enum values', () => {
    const yaml = `
groups:
  build:
    tasks:
      compile:
        log:
          level: 
`;
    const position: Position = { line: 6, character: 17 };
    const items = handleCompletion(yaml, position);
    const labels = items.map((item) => item.label);

    expect(labels).toContain('err');
    expect(labels).toContain('out');
    expect(labels).toContain('both');
  });

  test('should return empty list for unknown context', () => {
    const yaml = `
some:
  unknown:
    path: true
`;
    const position: Position = { line: 3, character: 10 };
    const items = handleCompletion(yaml, position);
    expect(items).toHaveLength(0);
  });
});
