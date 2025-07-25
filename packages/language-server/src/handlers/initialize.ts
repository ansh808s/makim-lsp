import {
  InitializeResult,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';

export function handleInitialize(): InitializeResult {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
}
