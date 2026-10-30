/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class StatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      return this.typescriptParser.currentNode.parseTypeScriptStatement(this.typescriptParser);
    }
    finally {
      context.leaveRecursion();
    }
  }

  public parseTerminator(expressionNode?: Node): TypeScriptSemicolonNode | undefined {
    const parser = this.typescriptParser;
    const semicolonNode = parser.tryConsume(TypeScriptSemicolonNode);
    if (!Object.isUndefined(semicolonNode) || this.canParseTerminator())
      return semicolonNode;

    if (Object.isUndefined(expressionNode))
      parser.reportExpected(Resources.semicolon);
    else
      expressionNode.reportTypeScriptMissingSemicolon(parser);

    return undefined;
  }

  public canParseTerminator(): boolean {
    const parser = this.typescriptParser;
    return parser.currentNode instanceof TypeScriptSemicolonNode || parser.isEndOfFile
      || parser.currentNode instanceof TypeScriptCloseBraceNode || parser.hasPrecedingLineBreak();
  }
}
