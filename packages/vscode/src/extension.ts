import * as path from 'path';
import { ExtensionContext } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join('..', 'language-server', 'dist', 'server.js'),
  );

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: { execArgv: ['--nolazy', '--inspect=6060'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'makim' }],
    outputChannelName: 'Makim Language Server',
  };

  client = new LanguageClient(
    'makimLanguageServer',
    'Makim Language Server',
    serverOptions,
    clientOptions,
  );

  context.subscriptions.push(client);

  client.start();
  client.start().then(() => {
    console.log('Language client started!');
  });
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
