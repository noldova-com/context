/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptLineCommentNode } from "../../../models/nodes/trivia/typescript-line-comment.node.js";
import { TypeScriptTriviaNode } from "../../../models/nodes/typescript-trivia.node.js";
import { TypeScriptDirectiveArgument } from "../../../models/trivia/typescript-directive-argument.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class SourceDirectiveParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(triviaNode: Node | undefined): void {
    if (Object.isUndefined(triviaNode))
      return;

    const pieces = triviaNode instanceof TypeScriptTriviaNode ? triviaNode.children : [triviaNode];
    for (const commentNode of pieces)
      if (commentNode instanceof TypeScriptLineCommentNode)
        this.parseComment(commentNode);
  }

  private parseComment(commentNode: TypeScriptLineCommentNode): void {
    const text = commentNode.value;
    const isTripleSlash = text.startsWith(Resources.slash);
    let position = SourceDirectiveParser.skipBlanks(text, isTripleSlash ? Resources.slash.length : 0);
    if (text.startsWith(Resources.at, position)) {
      const name = SourceDirectiveParser.readName(text, position + Resources.at.length);
      if (name === Resources.checkDirective || name === Resources.noCheckDirective)
        this.typescriptParser.context.hasNoCheckDirective = name === Resources.noCheckDirective;
      return;
    }
    if (!isTripleSlash || !text.startsWith(Resources.lessThan, position)
      || SourceDirectiveParser.readName(text, position + Resources.lessThan.length) !== Resources.reference)
      return;

    position += Resources.lessThan.length + Resources.reference.length;
    const directiveArguments = new Map<string, TypeScriptDirectiveArgument>();
    while (true) {
      position = SourceDirectiveParser.skipBlanks(text, position);
      if (text.startsWith(Resources.slashGreaterThan, position))
        break;
      const name = SourceDirectiveParser.readName(text, position);
      if (name.length === 0)
        break;
      position = SourceDirectiveParser.skipBlanks(text, position + name.length);
      if (!text.startsWith(Resources.equals, position))
        break;
      position = SourceDirectiveParser.skipBlanks(text, position + Resources.equals.length);
      const value = SourceDirectiveParser.readQuoted(text, position);
      if (Object.isUndefined(value))
        break;
      const valueOffset = commentNode.span.startOffset + Resources.slashSlash.length + position + 1;
      directiveArguments.set(name, new TypeScriptDirectiveArgument(value, this.typescriptParser.typescriptLexer.reader.createSpan(valueOffset, value.length)));
      position += value.length + 2;
    }

    const diagnostics = this.typescriptParser.context.diagnosticCollector;
    if (directiveArguments.get(Resources.noDefaultLib)?.value === Resources.true)
      return;
    const typesArgument = directiveArguments.get(Resources.types);
    if (!Object.isUndefined(typesArgument)) {
      const resolutionModeArgument = directiveArguments.get(Resources.resolutionMode);
      if (!Object.isUndefined(resolutionModeArgument)
        && resolutionModeArgument.value !== Resources.import && resolutionModeArgument.value !== Resources.require)
        diagnostics.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1453, resolutionModeArgument.span);
      return;
    }
    if (!directiveArguments.has(Resources.lib) && !directiveArguments.has(Resources.path))
      diagnostics.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1084, commentNode.span);
  }

  private static skipBlanks(text: string, position: number): number {
    while (position < text.length && (text[position] === Resources.space || text[position] === Resources.tab))
      position++;
    return position;
  }

  private static readName(text: string, position: number): string {
    let end = position;
    while (end < text.length && SourceDirectiveParser.isNameCharacter(text.charAt(end)))
      end++;
    return text.slice(position, end).toLowerCase();
  }

  private static isNameCharacter(character: string): boolean {
    return String.isAsciiLetter(character) || character === Resources.minus;
  }

  private static readQuoted(text: string, position: number): string | undefined {
    const quote = text[position];
    if (quote !== Resources.singleQuote && quote !== Resources.doubleQuote)
      return undefined;
    const end = text.indexOf(quote, position + 1);
    return end < 0 ? undefined : text.slice(position + 1, end);
  }
}
