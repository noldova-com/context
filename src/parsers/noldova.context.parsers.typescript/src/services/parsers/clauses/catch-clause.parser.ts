/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCatchClauseNode } from "../../../models/nodes/clauses/typescript-catch-clause.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptCatchKeywordNode } from "../../../models/nodes/keywords/typescript-catch-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { VariableDeclarationParser } from "../declarations/variable-declaration.parser.js";

export class CatchClauseParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly variableDeclarationParser: VariableDeclarationParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.variableDeclarationParser = new VariableDeclarationParser(typescriptParser);
  }

  public parse(catchKeywordNode: TypeScriptCatchKeywordNode): TypeScriptCatchClauseNode {
    const parser = this.typescriptParser;
    parser.advance();
    const openParenthesisNode = parser.tryConsume(TypeScriptOpenParenthesisNode);
    const variableDeclarationNode = Object.isUndefined(openParenthesisNode) ? undefined : this.variableDeclarationParser.parseWithoutExclamation();
    const initializerNode = variableDeclarationNode?.initializerNode;
    if (!Object.isUndefined(initializerNode))
      parser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(parser.context.source, TypeScriptDiagnosticTemplates.TS1197,
        initializerNode.getTypeScriptFirstTokenSpan());
    const closeParenthesisNode = Object.isUndefined(openParenthesisNode) ? undefined : parser.tryConsume(TypeScriptCloseParenthesisNode);
    if (!Object.isUndefined(openParenthesisNode) && Object.isUndefined(closeParenthesisNode))
      parser.reportExpected(Resources.closeParenthesis);
    const blockNode = parser.parseRequiredBlock();
    return new TypeScriptCatchClauseNode(catchKeywordNode, parser.typescriptLexer.reader.createSpan(catchKeywordNode.span, blockNode.span),
      blockNode, openParenthesisNode, variableDeclarationNode, closeParenthesisNode, catchKeywordNode.leadingTrivia, blockNode.trailingTrivia);
  }
}
