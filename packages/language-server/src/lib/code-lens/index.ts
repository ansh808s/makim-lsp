import { parseDocument, isMap, isScalar, Pair } from 'yaml';
import { Range, CodeLens } from 'vscode-languageserver/node';

export interface TaskInfo {
  groupName: string;
  taskName: string;
  line: number;
  range: Range;
}

export const findTasksInDocument = (content: string): TaskInfo[] => {
  const tasks: TaskInfo[] = [];
  const lines = content.split('\n');

  try {
    const document = parseDocument(content);
    const rootNode = document.contents;

    if (!isMap(rootNode)) return tasks;

    const groupsItem = rootNode.items.find(
      (item: Pair) => isScalar(item.key) && item.key.value === 'groups',
    );

    if (!groupsItem || !isMap(groupsItem.value)) return tasks;

    for (const groupItem of groupsItem.value.items as Pair[]) {
      if (!isScalar(groupItem.key) || !isMap(groupItem.value)) continue;

      const groupName = String(groupItem.key.value);

      const tasksItem = groupItem.value.items.find(
        (item: Pair) => isScalar(item.key) && item.key.value === 'tasks',
      );

      if (!tasksItem || !isMap(tasksItem.value)) continue;

      for (const taskItem of tasksItem.value.items as Pair[]) {
        if (!isScalar(taskItem.key) || !taskItem.key.range) continue;

        const taskName = String(taskItem.key.value);
        const [startOffset] = taskItem.key.range;

        let line = 0;
        let currentOffset = 0;

        for (let i = 0; i < lines.length; i++) {
          if (currentOffset + lines[i].length >= startOffset) {
            line = i;
            break;
          }
          currentOffset += lines[i].length + 1;
        }

        const lineStart =
          currentOffset - (line > 0 ? lines[line].length + 1 : 0);
        const character = startOffset - lineStart;

        tasks.push({
          groupName,
          taskName,
          line,
          range: {
            start: { line, character },
            end: { line, character: character + taskName.length },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error parsing YAML for tasks:', error);
  }

  return tasks;
};

export const createTaskCodeLenses = (
  tasks: TaskInfo[],
  documentUri: string,
): CodeLens[] => {
  const codeLenses: CodeLens[] = [];

  for (const task of tasks) {
    const codeLensRange = {
      start: { line: task.line, character: task.range.start.character },
      end: { line: task.line, character: task.range.start.character },
    };

    codeLenses.push({
      range: codeLensRange,
      command: {
        title: `$(play) Run ${task.groupName}.${task.taskName}`,
        command: 'makim.runTask',
        arguments: [documentUri, task.groupName, task.taskName],
      },
    });
  }

  return codeLenses;
};
