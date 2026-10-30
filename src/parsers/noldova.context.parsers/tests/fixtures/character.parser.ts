/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, type Node, Parser, ParserContext, ParserException, Source } from "@noldova/context.parsers";

import { CharacterLexer } from "./character.lexer.js";

export class CharacterParser extends Parser<LiteralNode> {
  public readonly characterLexer: CharacterLexer;

  public constructor(context: ParserContext, lexer: CharacterLexer) {
    super(context, lexer);
    this.characterLexer = lexer;
  }

  public static create(text: string, addDiagnostics: boolean = false): CharacterParser {
    const source = new Source(text);
    const context = new ParserContext(source);

    return new CharacterParser(context, new CharacterLexer(source, context.diagnosticCollector, addDiagnostics));
  }

  public reLex(action: () => Node): void {
    this.reLexCurrentNode(() => this.characterLexer.reLex(action));
  }

  protected override parseRootNode(): LiteralNode {
    const node = this.tryConsume(LiteralNode);
    if (Object.isUndefined(node))
      throw new ParserException("A character was required by this test parser.");

    return node;
  }
}
