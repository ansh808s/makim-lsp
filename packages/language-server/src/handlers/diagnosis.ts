import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  TextDocuments,
  TextDocumentChangeEvent,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateDocument } from '../lib/diagnosis';

export class DiagnosisHandler {
  private connection: Connection;
  private documents: TextDocuments<TextDocument>;

  constructor(connection: Connection, documents: TextDocuments<TextDocument>) {
    this.connection = connection;
    this.documents = documents;
  }

  register(): void {
    this.documents.onDidChangeContent(this.validateDocument.bind(this));
    this.documents.onDidOpen(this.validateDocument.bind(this));
  }

  private async validateDocument(
    change: TextDocumentChangeEvent<TextDocument>,
  ): Promise<void> {
    const document = change.document;

    if (document.languageId !== 'makim') {
      return;
    }

    try {
      const diagnostics = await this.performValidation(document);

      await this.connection.sendDiagnostics({
        uri: document.uri,
        diagnostics,
      });
    } catch (error) {
      this.connection.console.error(
        `Validation error for ${document.uri}: ${error}`,
      );

      await this.connection.sendDiagnostics({
        uri: document.uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            },
            message: `Internal validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            source: 'makim-lsp',
          },
        ],
      });
    }
  }

  private async performValidation(
    document: TextDocument,
  ): Promise<Diagnostic[]> {
    const content = document.getText();
    const diagnostics: Diagnostic[] = [];

    const schemaResult = validateDocument(content);
    diagnostics.push(...schemaResult.diagnostics);

    diagnostics.forEach((diagnostic) => {
      if (!diagnostic.source) {
        diagnostic.source = 'makim-lsp';
      }
    });

    return diagnostics;
  }

  async validateDocumentByUri(uri: string): Promise<Diagnostic[]> {
    const document = this.documents.get(uri);
    if (!document) {
      throw new Error(`Document not found: ${uri}`);
    }

    return await this.performValidation(document);
  }

  async clearDiagnostics(uri: string): Promise<void> {
    await this.connection.sendDiagnostics({
      uri,
      diagnostics: [],
    });
  }
}
