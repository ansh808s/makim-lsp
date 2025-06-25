import { Range } from 'vscode-languageserver';
import * as yaml from 'yaml';

export const getYAMLErrorRange = (error: yaml.YAMLError): Range => {
  let startLine = 0;
  let startCharacter = 0;
  let endLine = 0;
  let endCharacter = 0;
  const linePos = error.linePos;

  if (linePos) {
    startLine = linePos[0].line - 1;
    startCharacter = linePos[0].col - 1;
    endLine = linePos[1] ? linePos[1].line - 1 : startLine;
    endCharacter = linePos[1] ? linePos[1].col - 1 : startCharacter;
  }

  return {
    start: { line: startLine, character: startCharacter },
    end: { line: endLine, character: endCharacter },
  };
};

export const getJSONPathRange = (
  document: yaml.Document.Parsed,
  path: (string | number)[],
): Range => {
  const node = document.getIn(path, true) as yaml.Node | null;

  if (!node || !node.range) {
    return {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    };
  }

  const [start, , end] = node.range;
  const lines = document.toString().split('\n');

  let startOffset = start;
  let endOffset = end;

  let startLine = 0;
  let startChar = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1;
    if (startOffset < lineLength) {
      startLine = i;
      startChar = startOffset == endOffset ? 0 : startOffset;
      break;
    }
    startOffset -= lineLength;
  }

  let endLine = 0;
  let endChar = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1;
    if (endOffset < lineLength) {
      endLine = i;
      endChar = startOffset == endOffset ? 0 : endOffset;
      break;
    }
    endOffset -= lineLength;
  }

  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  };
};
