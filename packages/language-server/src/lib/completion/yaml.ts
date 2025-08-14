/* eslint-disable @typescript-eslint/no-explicit-any */

import { Position } from 'vscode-languageserver/node';
import { parseDocument, isMap, isSeq, isScalar, Pair } from 'yaml';

export function getOffsetFromPosition(
  content: string,
  position: Position,
): number {
  const lines = content.split('\n');
  let offset = 0;
  for (let i = 0; i < position.line; i++) {
    offset += lines[i].length + 1;
  }
  return offset + position.character;
}

export function getPathAtPosition(
  content: string,
  position: Position,
): string[] {
  const offset = getOffsetFromPosition(content, position);
  const document = parseDocument(content);

  const path: string[] = [];

  function find(node: any, currentPath: string[] = []): boolean {
    if (!node?.range) return false;
    const [start, , end] = node.range;

    if (offset < start || offset > end) return false;

    if (isMap(node)) {
      for (const item of node.items as Pair[]) {
        const keyNode = item.key;
        const valueNode = item.value;

        if (keyNode && isScalar(keyNode)) {
          const keyValue = String(keyNode.value);
          const newPath = [...currentPath, keyValue];

          if (
            keyNode.range &&
            offset >= keyNode.range[0] &&
            offset <= keyNode.range[1]
          ) {
            path.push(...newPath);
            return true;
          }

          if (valueNode) {
            if (find(valueNode, newPath)) {
              return true;
            }
          } else {
            const keyEnd = keyNode.range![1];
            const lineAfterKey = content.substring(keyEnd);
            const colonMatch = lineAfterKey.match(/^\s*:/);

            if (colonMatch) {
              const colonEnd = keyEnd + colonMatch[0].length;
              if (offset >= colonEnd) {
                const isInThisKeyContext = true;

                for (const otherItem of node.items as Pair[]) {
                  const otherKeyNode: any = otherItem.key;
                  if (
                    otherKeyNode &&
                    otherKeyNode.range &&
                    otherKeyNode.range[0] > offset
                  ) {
                    if (otherKeyNode.range[0] > colonEnd) {
                      break;
                    }
                  }
                }

                if (isInThisKeyContext) {
                  path.push(...newPath);
                  return true;
                }
              }
            }
          }
        }
      }
    } else if (isSeq(node)) {
      for (let i = 0; i < node.items.length; i++) {
        const child = node.items[i];
        const newPath = [...currentPath, String(i)];
        if (find(child, newPath)) {
          return true;
        }
      }
    } else if (isScalar(node)) {
      if (offset >= node.range[0] && offset <= node.range[1]) {
        path.push(...currentPath);
        return true;
      }
    }

    return false;
  }

  if (find(document.contents)) {
    return path;
  }

  return inferPathFromContext(content, position);
}

function inferPathFromContext(content: string, position: Position): string[] {
  const lines = content.split('\n');
  const currentLine = lines[position.line];
  let currentIndent = currentLine.match(/^(\s*)/)?.[1]?.length || 0;

  const path: string[] = [];

  for (let i = position.line - 1; i >= 0; i--) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
    const trimmedLine = line.trim();

    if (trimmedLine === '') continue;

    if (indent < currentIndent && trimmedLine.includes(':')) {
      const keyMatch = trimmedLine.match(/^([^:]+):/);
      if (keyMatch) {
        const key = keyMatch[1].trim();
        path.unshift(key);
        currentIndent = indent;
      }
    }

    if (indent === 0 && trimmedLine.includes(':')) {
      break;
    }
  }

  const currentTrimmed = currentLine.trim();
  if (currentTrimmed.endsWith(':')) {
    const keyMatch = currentTrimmed.match(/^([^:]+):/);
    if (keyMatch) {
      const key = keyMatch[1].trim();
      path.push(key);
    }
  }

  return path;
}

export function getNodeAtPath(content: string, path: string[]): any {
  const doc = parseDocument(content);
  let node: any = doc.contents;

  for (const segment of path) {
    if (!node) return null;

    if (isMap(node)) {
      const item = node.items.find((i: any) => i.key?.value === segment);
      node = item?.value;
    } else if (Array.isArray(node.items)) {
      const index = Number(segment);
      node = node.items[index];
    } else {
      return null;
    }
  }

  return node;
}

export function getUsedKeysInMap(node: any): string[] {
  if (!isMap(node)) return [];
  return node.items.map((i: any) => String(i.key?.value)).filter(Boolean);
}
