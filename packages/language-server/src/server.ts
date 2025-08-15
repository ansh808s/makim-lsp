import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  CompletionItem,
  TextDocumentPositionParams,
  CodeLens,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { handleInitialize } from './handlers/initialize';
import { registerDocumentHandlers } from './handlers/documents';
import { handleCompletion } from './handlers/completion';
import { createTaskCodeLenses, findTasksInDocument } from './lib/code-lens';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

function main() {
  connection.onInitialize(handleInitialize);

  connection.onInitialized(() => {
    connection.console.log('Makim LSP initialized');
  });

  registerDocumentHandlers(documents, connection);

  connection.onCompletion(
    (params: TextDocumentPositionParams): CompletionItem[] => {
      const document = documents.get(params.textDocument.uri);
      if (!document) return [];

      return handleCompletion(document.getText(), params.position);
    },
  );
  connection.onCodeLens((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const content = document.getText();
    const codeLenses: CodeLens[] = [];

    const tasks = findTasksInDocument(content);
    const taskCodeLenses = createTaskCodeLenses(tasks, params.textDocument.uri);
    codeLenses.push(...taskCodeLenses);

    return codeLenses;
  });

  connection.onCompletionResolve((item) => {
    return item;
  });

  documents.listen(connection);
  connection.listen();
}

main();
