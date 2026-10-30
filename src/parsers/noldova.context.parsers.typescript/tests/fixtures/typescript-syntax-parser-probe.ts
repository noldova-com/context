/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, Source } from "@noldova/context.parsers";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

export class TypeScriptSyntaxParserProbe extends TypeScriptSyntaxParser {
  public advanceCount: number = 0;
  public readonly parsedExpressionNodes: Node[] = [];
  public readonly parsedStatementNodes: Node[] = [];

  public constructor(content: string) {
    const source = new Source(content);
    const context = new TypeScriptParserContext(source);
    super(context, new TypeScriptLexer(source, context.diagnosticCollector, context.records.commentDirectiveOffsets));
  }

  public override parseStatement(): Node {
    const node = super.parseStatement();
    this.parsedStatementNodes.push(node);
    return node;
  }

  public override advance(): void {
    this.advanceCount++;
    super.advance();
  }

  public override consumeName(): Node {
    this.advanceCount++;
    return super.consumeName();
  }

  public override tryParseParenthesizedExpressionOrArrowFunction(): Node | undefined {
    const node = super.tryParseParenthesizedExpressionOrArrowFunction();
    if (!Object.isUndefined(node))
      this.parsedExpressionNodes.push(node);

    return node;
  }
}
