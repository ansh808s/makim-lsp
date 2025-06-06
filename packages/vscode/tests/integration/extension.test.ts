import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Makim extension activation', () => {
  test('should activate extension', async () => {
    const extension = vscode.extensions.getExtension('makim.makim');
    assert.ok(extension, 'Extension not found');
    await extension!.activate();
    assert.ok(extension!.isActive, 'Extension did not activate');
  });

  test('can open a .makim.yaml file and detect language ID', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: 'name: test',
      language: 'makim',
    });
    await vscode.window.showTextDocument(doc);
    assert.strictEqual(doc.languageId, 'makim');
  });
});
