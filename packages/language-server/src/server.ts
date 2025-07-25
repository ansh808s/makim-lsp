import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  CompletionItem,
  TextDocumentPositionParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { handleInitialize } from './handlers/initialize';
import { registerDocumentHandlers } from './handlers/documents';
import { handleCompletion } from './handlers/completion';

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
  connection.onCompletionResolve((item) => {
    return item;
  });

  documents.listen(connection);
  connection.listen();
}

main();
