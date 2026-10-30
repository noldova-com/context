/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptInKeywordNode } from "../../../models/nodes/keywords/typescript-in-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptGreaterThanNode } from "../../../models/nodes/operators/typescript-greater-than.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptTypeParameterListNode } from "../../../models/nodes/types/typescript-type-parameter-list.node.js";
import { TypeScriptTypeParameterNode } from "../../../models/nodes/types/typescript-type-parameter.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ModifierParser } from "../declarations/modifier.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class TypeParameterListParser {
  private readonly modifierParser: ModifierParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.modifierParser = new ModifierParser(typescriptParser);
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parse(accepted: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterListNode | undefined {
    const resultNode = this.parseAllowingEmptyList(accepted);
    resultNode?.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }

  public parseAllowingEmptyList(accepted: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterListNode | undefined {
    const typescriptParser = this.typescriptParser;
    const lessThanNode = typescriptParser.tryConsume(TypeScriptLessThanNode);
    if (Object.isUndefined(lessThanNode))
      return undefined;

    const parameterNodes: Node[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    let endNode: Node = lessThanNode;

    typescriptParser.context.enterList(TypeScriptListKind.TypeParameters);
    try {
      while (!typescriptParser.isEndOfFile) {
        const startNode = typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.TypeParameters, typescriptParser)) {
          if (startNode.isTypeScriptListTerminator(TypeScriptListKind.TypeParameters, typescriptParser))
            break;
          typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1139, startNode.span);
          if (typescriptParser.context.isListBoundary(typescriptParser))
            break;
          endNode = startNode;
          typescriptParser.advance();
          continue;
        }
        const parameterNode = this.parseTypeParameter(accepted);
        parameterNodes.push(parameterNode);
        endNode = parameterNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (typescriptParser.isEndOfFile || typescriptParser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.TypeParameters, typescriptParser))
          break;
        typescriptParser.reportExpected(Resources.comma);
        if (typescriptParser.currentNode === startNode) {
          endNode = startNode;
          typescriptParser.advance();
        }
      }
    }
    finally {
      typescriptParser.context.leaveList();
    }

    const greaterThanNode = typescriptParser.tryConsume(TypeScriptGreaterThanNode);
    if (Object.isUndefined(greaterThanNode))
      typescriptParser.reportExpected(Resources.greaterThan);
    else
      endNode = greaterThanNode;

    const span = typescriptParser.typescriptLexer.reader.createSpan(
      lessThanNode.span,
      endNode.span);

    return new TypeScriptTypeParameterListNode(
      lessThanNode,
      parameterNodes,
      commaNodes,
      span,
      greaterThanNode,
      lessThanNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  public parseMappedTypeParameter(): TypeScriptTypeParameterNode {
    const typescriptParser = this.typescriptParser;
    const nameNode = typescriptParser.consumeName();
    const inKeywordNode = typescriptParser.tryConsume(TypeScriptInKeywordNode);
    const constraintNode = this.typescriptParser.parseType();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      nameNode.span,
      constraintNode.span);

    return new TypeScriptTypeParameterNode(
      [],
      nameNode,
      span,
      inKeywordNode,
      constraintNode,
      undefined,
      undefined,
      nameNode.leadingTrivia,
      constraintNode.trailingTrivia);
  }

  private parseTypeParameter(accepted: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterNode {
    const typescriptParser = this.typescriptParser;
    const modifierNodes = this.modifierParser.parseTypeParameter();
    this.modifierParser.validateTypeParameter(modifierNodes, accepted);

    const nameNode = this.nameParser.parseIdentifier()
      ?? new TypeScriptMissingIdentifierNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan());
    const constraintKeywordNode = typescriptParser.tryConsume(TypeScriptExtendsKeywordNode);
    const constraintNode = Object.isUndefined(constraintKeywordNode) ? undefined : this.typescriptParser.parseType();
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    const defaultTypeNode = Object.isUndefined(equalsNode) ? undefined : this.typescriptParser.parseType();
    const startNode = modifierNodes[0] ?? nameNode;
    const endNode = defaultTypeNode ?? equalsNode ?? constraintNode ?? constraintKeywordNode ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);

    return new TypeScriptTypeParameterNode(
      modifierNodes,
      nameNode,
      span,
      constraintKeywordNode,
      constraintNode,
      equalsNode,
      defaultTypeNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
