import { CompletionItem, Position } from 'vscode-languageserver/node';
import { CompletionItemKind } from 'vscode-languageserver/node';
import { loadSchema } from '../lib/diagnosis/index';
import {
  getPathAtPosition,
  getNodeAtPath,
  getUsedKeysInMap,
} from '../lib/completion/yaml';

interface JSONSchemaProperty {
  type?: string;
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  patternProperties?: Record<string, JSONSchemaProperty>;
  additionalProperties?: JSONSchemaProperty | boolean;
  enum?: (string | number | boolean)[];
}

interface JSONSchema extends JSONSchemaProperty {
  type: string;
}

function getSchemaSubtree(
  schema: JSONSchema,
  path: string[],
): JSONSchemaProperty | null {
  let current: JSONSchemaProperty = schema;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (!current || current.type !== 'object') return null;

    if (current.properties?.[segment]) {
      current = current.properties[segment];
      continue;
    }

    if (current.patternProperties) {
      const match = Object.entries(current.patternProperties).find(
        ([pattern]) => new RegExp(pattern).test(segment),
      );
      if (match) {
        current = match[1];
        continue;
      }
    }

    const isLast = i === path.length - 1;
    if (isLast) {
      return current;
    }

    if (
      current.additionalProperties &&
      typeof current.additionalProperties === 'object'
    ) {
      current = current.additionalProperties;
    } else {
      return null;
    }
  }

  return current;
}

function getCompletionsFromSchema(
  schema: JSONSchemaProperty | null,
  usedKeys: string[] = [],
): CompletionItem[] {
  const items: CompletionItem[] = [];

  if (!schema) return items;

  const alreadyUsed = new Set(usedKeys);

  if (schema.type === 'object') {
    const properties = schema.properties || {};
    for (const [key, value] of Object.entries(properties)) {
      if (alreadyUsed.has(key)) continue;

      items.push({
        label: key,
        kind: CompletionItemKind.Property,
        documentation: value.description,
      });
    }
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    for (const option of schema.enum) {
      items.push({
        label: String(option),
        kind: CompletionItemKind.Value,
        documentation: schema.description,
      });
    }
  }

  return items;
}

export function handleCompletion(
  content: string,
  position: Position,
): CompletionItem[] {
  const schema = loadSchema() as JSONSchema;
  const path = getPathAtPosition(content, position);

  const schemaSubtree = getSchemaSubtree(schema, path);
  const currentNode = getNodeAtPath(content, path.slice(0, -1));
  const usedKeys = getUsedKeysInMap(currentNode);
  const completions = getCompletionsFromSchema(schemaSubtree, usedKeys);

  return completions;
}
