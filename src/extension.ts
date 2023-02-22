import * as vscode from "vscode";
import { MyHoverProvider } from "./hoverProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "tooltip-type" is now active!');
  vscode.window.showInformationMessage(
    'Congratulations, your extension "tooltip-type" is now active!'
  );

  const hoverProvider = new MyHoverProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { pattern: "**/*.ts" },
      hoverProvider
    )
  );
}

export function deactivate() {}
