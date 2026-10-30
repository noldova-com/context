/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptCaseClauseNode } from "../../../models/nodes/clauses/typescript-case-clause.node.js";
import type { TypeScriptDefaultClauseNode } from "../../../models/nodes/clauses/typescript-default-clause.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptSwitchKeywordNode } from "../../../models/nodes/keywords/typescript-switch-keyword.node.js";
import { TypeScriptCaseBlockNode } from "../../../models/nodes/statements/typescript-case-block.node.js";
import { TypeScriptSwitchStatementNode } from "../../../models/nodes/statements/typescript-switch-statement.node.js";
import { TypeScriptJumpTarget } from "../../../models/typescript-jump-target.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class SwitchStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(switchKeywordNode: TypeScriptSwitchKeywordNode): TypeScriptSwitchStatementNode {
    const parser = this.typescriptParser;
    parser.advance();
    const openParenthesisNode = parser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      parser.reportExpected(Resources.openParenthesis);
    const expressionNode = parser.parseExpressionAllowingIn();
    const closeParenthesisNode = parser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      parser.reportExpected(Resources.closeParenthesis);
    const caseBlockNode = this.parseSwitchBody();
    const resultNode = new TypeScriptSwitchStatementNode(switchKeywordNode, expressionNode, caseBlockNode,
      parser.typescriptLexer.reader.createSpan(switchKeywordNode.span, caseBlockNode.span),
      openParenthesisNode, closeParenthesisNode, switchKeywordNode.leadingTrivia, caseBlockNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }

  private parseSwitchBody(): TypeScriptCaseBlockNode {
    const context = this.typescriptParser.context;
    context.jumpTargets.push(TypeScriptJumpTarget.ofSwitch);
    try {
      return this.parseCaseBlock();
    }
    finally {
      context.jumpTargets.pop();
    }
  }

  private parseCaseBlock(): TypeScriptCaseBlockNode {
    const context = this.typescriptParser.context;
    const previousCaseClause = context.isCaseClause;
    const previousSubstatement = context.isSubstatement;
    context.isCaseClause = true;
    context.isSubstatement = false;
    context.enterList(TypeScriptListKind.SwitchClauses);
    try {
      const parser = this.typescriptParser;
      const startNode = parser.currentNode;
      const openBraceNode = parser.tryConsume(TypeScriptOpenBraceNode);
      if (Object.isUndefined(openBraceNode))
        parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, startNode.span, [Resources.openBrace]);
      const clauses: (TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode)[] = [];
      let endNode: Node | undefined = openBraceNode;
      while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode)) {
        const clauseNode = parser.currentNode.parseTypeScriptSwitchClause(parser);
        if (Object.isUndefined(clauseNode)) {
          parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1130, parser.currentNode.span);
          if (context.isListBoundary(parser))
            break;
          endNode = parser.currentNode;
          parser.advance();
          continue;
        }
        clauses.push(clauseNode);
        endNode = clauseNode;
      }
      const closeBraceNode = parser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(closeBraceNode))
        parser.reportExpected(Resources.closeBrace);
      endNode = closeBraceNode ?? endNode;
      const span = Object.isUndefined(endNode)
        ? startNode.getTypeScriptMissingNodeSpan()
        : parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      return new TypeScriptCaseBlockNode(clauses, span, openBraceNode, closeBraceNode, Object.isUndefined(endNode) ? undefined : startNode.leadingTrivia,
        endNode?.trailingTrivia);
    }
    finally {
      context.leaveList();
      context.isCaseClause = previousCaseClause;
      context.isSubstatement = previousSubstatement;
    }
  }
}
