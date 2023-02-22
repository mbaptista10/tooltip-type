import {
  Hover,
  HoverProvider,
  MarkdownString,
  Position,
  TextDocument,
} from "vscode";
import { formatTypeAliasMarkdown, getTypesAsString } from "./handleTypes";

export class MyHoverProvider implements HoverProvider {
  provideHover(document: TextDocument, position: Position): Hover | null {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    if (!word) {
      return null;
    }

    const fileName = document.fileName;
    const typesAsString = getTypesAsString(fileName, word);

    const description = formatTypeAliasMarkdown(typesAsString);

    const title = `All properties of: ${word}`;
    const markdown = new MarkdownString();
    markdown.appendMarkdown(`**${title}**\n\n${description}`);

    return new Hover(markdown);
  }
}
