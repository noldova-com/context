/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptVariableDeclarationNode } from "../../../models/nodes/declarations/typescript-variable-declaration.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptMissingTypeNode } from "../../../models/nodes/types/typescript-missing-type.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { BindingNameParser } from "../names/binding-name.parser.js";

export class VariableDeclarationParser {
  private readonly bindingNameParser: BindingNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.bindingNameParser = new BindingNameParser(typescriptParser);
  }

  public parse(): TypeScriptVariableDeclarationNode {
    return this.parseDeclaration(true);
  }

  public parseWithoutExclamation(): TypeScriptVariableDeclarationNode {
    return this.parseDeclaration(false);
  }

  private parseDeclaration(allowsExclamation: boolean): TypeScriptVariableDeclarationNode {
    const typescriptParser = this.typescriptParser;
    const nameNode = this.bindingNameParser.parseVariableName();
    const exclamationNode = allowsExclamation && nameNode.isTypeScriptBindingIdentifier() && !typescriptParser.hasPrecedingLineBreak()
      ? typescriptParser.tryConsume(TypeScriptExclamationNode) : undefined;
    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const typeNode = Object.isUndefined(colonNode) ? undefined : this.parseType();
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode) ? undefined : typescriptParser.parseAssignmentExpression();
    const endNode: Node = initializerNode ?? equalsNode ?? typeNode ?? colonNode ?? exclamationNode ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(nameNode.span, endNode.span);
    return new TypeScriptVariableDeclarationNode(
      span,
      nameNode,
      exclamationNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      nameNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private parseType(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptCloseParenthesisNode) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1110, node.span);
      return new TypeScriptMissingTypeNode(node.getTypeScriptMissingNodeSpan());
    }
    return parser.parseType();
  }
}
