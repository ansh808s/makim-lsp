import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
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

  const runTaskCommand = vscode.commands.registerCommand(
    'makim.runTask',
    (fileUri: string, groupName: string, taskName: string) => {
      runMakimTask(fileUri, groupName, taskName);
    },
  );

  context.subscriptions.push(runTaskCommand);

  client = new LanguageClient(
    'makimLanguageServer',
    'Makim Language Server',
    serverOptions,
    clientOptions,
  );

  context.subscriptions.push(client);

  client.start().then(() => {
    console.log('Language client started!');
  });
}

function runMakimTask(fileUri: string, groupName: string, taskName: string) {
  const filePath = vscode.Uri.parse(fileUri).fsPath;
  const fileName = path.basename(filePath);

  const terminal = getOrCreateTerminal('Makim');

  terminal.show();

  const workingDir = path.dirname(filePath);
  terminal.sendText(`cd "${workingDir}"`);
  terminal.sendText(`makim --file "${fileName}" ${groupName}.${taskName}`);

  vscode.window.showInformationMessage(
    `Running Makim task: ${groupName}.${taskName}`,
  );
}

function getOrCreateTerminal(name: string): vscode.Terminal {
  let terminal = vscode.window.terminals.find((t) => t.name === name);

  if (!terminal) {
    terminal = vscode.window.createTerminal(name);
  }

  return terminal;
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
