import Ajv, { AnySchema, ErrorObject } from 'ajv';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import * as yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { getJSONPathRange, getYAMLErrorRange } from '../utils/yaml';

interface ValidationResult {
  diagnostics: Diagnostic[];
  parsed?: unknown;
}

let schema: unknown;

const loadSchema = (): unknown => {
  if (!schema) {
    const schemaPath = path.resolve(__dirname, '../schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);
  }
  return schema;
};

function getDetailedSchemaError(err: ErrorObject): string {
  switch (err.keyword) {
    case 'required':
      return `Missing required property: "${err.params.missingProperty}"`;

    case 'type':
      return `Type mismatch expected ${err.params.type}, got ${typeof err.data}`;

    case 'enum':
      return `Invalid value: must be one of ${err.params.allowedValues.join(', ')}`;

    case 'additionalProperties':
      return `Unexpected property: "${err.params.additionalProperty}"`;

    default:
      return `Validation error: ${err.message ?? 'Invalid value'}`;
  }
}

export function validateDocument(content: string): ValidationResult {
  const diagnostics: Diagnostic[] = [];
  const schema = loadSchema();

  try {
    const document = yaml.parseDocument(content, { keepSourceTokens: true });
    if (document.errors.length > 0) {
      for (const error of document.errors) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: getYAMLErrorRange(error),
          message: `YAML Parse Error: ${error.message}`,
        });
      }
      return { diagnostics };
    }

    const parsed = document.toJSON();
    if (!parsed) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        message: 'Empty configuration file',
      });
      return { diagnostics };
    }

    const ajv = new Ajv({ allErrors: true, verbose: true });
    const validate = ajv.compile(schema as AnySchema);
    const valid = validate(parsed);

    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        const path = err.instancePath
          .split('/')
          .filter(Boolean)
          .map((seg) => (isNaN(Number(seg)) ? seg : Number(seg)));
        const message = getDetailedSchemaError(err);

        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: getJSONPathRange(document, path),
          message,
        });
      }
    }

    return { diagnostics, parsed };
  } catch (error) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: `Validation Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return { diagnostics };
  }
}
