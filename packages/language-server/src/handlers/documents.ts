import {
  TextDocuments,
  TextDocumentChangeEvent,
  Connection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function registerDocumentHandlers(
  documents: TextDocuments<TextDocument>,
  connection: Connection,
) {
  documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
    connection.console.log(`LanguageId: ${event.document.languageId}`);
  });
}
