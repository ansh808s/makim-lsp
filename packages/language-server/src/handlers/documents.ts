import {
  TextDocuments,
  TextDocumentChangeEvent,
  Connection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosisHandler } from './diagnosis';

export function registerDocumentHandlers(
  documents: TextDocuments<TextDocument>,
  connection: Connection,
) {
  const diagnosisHandler = new DiagnosisHandler(connection, documents);
  diagnosisHandler.register();
  documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
    connection.console.log(`LanguageId: ${event.document.languageId}`);
  });
  documents.onDidClose((event) => {
    connection.console.log(`Document closed: ${event.document.uri}`);
    diagnosisHandler.clearDiagnostics(event.document.uri);
  });

  documents.onDidSave((event) => {
    connection.console.log(`Document saved: ${event.document.uri}`);
  });
}
