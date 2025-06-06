import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { handleInitialize } from './handlers/initialize';
import { registerDocumentHandlers } from './handlers/documents';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

function main() {
  connection.onInitialize(handleInitialize);

  connection.onInitialized(() => {
    connection.console.log('Makim LSP initialized');
  });

  registerDocumentHandlers(documents, connection);
  documents.listen(connection);
  connection.listen();
}

main();
