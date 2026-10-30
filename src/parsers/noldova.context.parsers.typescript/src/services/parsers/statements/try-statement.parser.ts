/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCatchKeywordNode } from "../../../models/nodes/keywords/typescript-catch-keyword.node.js";
import { TypeScriptFinallyKeywordNode } from "../../../models/nodes/keywords/typescript-finally-keyword.node.js";
import type { TypeScriptTryKeywordNode } from "../../../models/nodes/keywords/typescript-try-keyword.node.js";
import type { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";
import { TypeScriptTryStatementNode } from "../../../models/nodes/statements/typescript-try-statement.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { CatchClauseParser } from "../clauses/catch-clause.parser.js";

export class TryStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly catchClauseParser: CatchClauseParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.catchClauseParser = new CatchClauseParser(typescriptParser);
  }

  public parse(tryKeywordNode?: TypeScriptTryKeywordNode): TypeScriptTryStatementNode {
    const parser = this.typescriptParser;
    if (Object.isUndefined(tryKeywordNode))
      parser.reportExpected(Resources.try);
    else
      parser.advance();
    const tryBlockNode = parser.parseRequiredBlock();
    const startNode = tryKeywordNode ?? tryBlockNode;
    const catchKeywordNode = parser.currentNode;
    const catchClauseNode = catchKeywordNode instanceof TypeScriptCatchKeywordNode ? this.catchClauseParser.parse(catchKeywordNode) : undefined;
    let finallyKeywordNode: TypeScriptFinallyKeywordNode | undefined;
    let finallyBlockNode: TypeScriptBlockNode | undefined;
    if (Object.isUndefined(catchClauseNode) || parser.currentNode instanceof TypeScriptFinallyKeywordNode) {
      finallyKeywordNode = parser.tryConsume(TypeScriptFinallyKeywordNode);
      if (Object.isUndefined(finallyKeywordNode))
        parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1472, parser.currentNode.span);
      finallyBlockNode = parser.parseRequiredBlock();
    }
    const endNode: Node = finallyBlockNode ?? catchClauseNode!;
    return new TypeScriptTryStatementNode(tryKeywordNode, parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span),
      tryBlockNode, catchClauseNode, finallyKeywordNode, finallyBlockNode, startNode.leadingTrivia, endNode.trailingTrivia);
  }
}
