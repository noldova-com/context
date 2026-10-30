/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptDebuggerKeywordNode } from "../../../models/nodes/keywords/typescript-debugger-keyword.node.js";
import { TypeScriptDebuggerStatementNode } from "../../../models/nodes/statements/typescript-debugger-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class DebuggerStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(debuggerKeywordNode: TypeScriptDebuggerKeywordNode): TypeScriptDebuggerStatementNode {
    this.typescriptParser.advance();
    const semicolonNode = this.typescriptParser.parseStatementTerminator();
    const endNode: Node = semicolonNode ?? debuggerKeywordNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(debuggerKeywordNode.span, endNode.span);
    return new TypeScriptDebuggerStatementNode(
      debuggerKeywordNode,
      span,
      semicolonNode,
      debuggerKeywordNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
