/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCallSignatureNode } from "../../../models/nodes/declarations/typescript-call-signature.node.js";
import { TypeScriptConstructSignatureNode } from "../../../models/nodes/declarations/typescript-construct-signature.node.js";
import { TypeScriptMethodSignatureNode } from "../../../models/nodes/declarations/typescript-method-signature.node.js";
import { TypeScriptPropertySignatureNode } from "../../../models/nodes/declarations/typescript-property-signature.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptNewKeywordNode } from "../../../models/nodes/keywords/typescript-new-keyword.node.js";
import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptMissingTypeNode } from "../../../models/nodes/types/typescript-missing-type.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { AccessorParser } from "../declarations/accessor.parser.js";
import { IndexSignatureParser } from "../declarations/index-signature.parser.js";
import { ModifierParser } from "../declarations/modifier.parser.js";
import type { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { PropertyNameParser } from "../names/property-name.parser.js";
import { BlockParser } from "../statements/block.parser.js";
import type { TypeParameterListParser } from "./type-parameter-list.parser.js";

export class TypeMemberParser {
  private readonly accessorParser: AccessorParser;
  private readonly indexSignatureParser: IndexSignatureParser;
  private readonly modifierParser: ModifierParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    parameterListParser: ParameterListParser,
    typeParameterListParser: TypeParameterListParser) {
    this.typescriptParser = typescriptParser;
    this.parameterListParser = parameterListParser;
    this.indexSignatureParser = new IndexSignatureParser(typescriptParser, parameterListParser);
    this.modifierParser = new ModifierParser(typescriptParser);
    this.propertyNameParser = new PropertyNameParser(typescriptParser);
    this.typeParameterListParser = typeParameterListParser;
    const blockParser = new BlockParser(typescriptParser);
    this.accessorParser = new AccessorParser(typescriptParser, this.propertyNameParser, parameterListParser, typeParameterListParser, blockParser);
  }

  private parse(): Node {
    const typescriptParser = this.typescriptParser;
    if (typescriptParser.currentNode.canStartTypeScriptSignature())
      return this.parseCallSignature();

    if (typescriptParser.currentNode instanceof TypeScriptNewKeywordNode && this.isConstructSignature())
      return this.parseConstructSignature(typescriptParser.currentNode);

    const startNode = typescriptParser.currentNode;
    const modifierNodes = this.modifierParser.parseTypeMember();

    const context = typescriptParser.context;
    const previousTypeMemberContext = context.isTypeMemberContext;
    context.isTypeMemberContext = true;
    try {
      const memberNode = this.parseMember(startNode, modifierNodes);
      memberNode.reportTypeScriptGrammarAfterModifiers(context, this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.TypeMember, memberNode));

      return memberNode;
    }
    finally {
      context.isTypeMemberContext = previousTypeMemberContext;
    }
  }

  private parseMember(startNode: Node, modifierNodes: readonly Node[]): Node {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node.startsTypeScriptAccessor(typescriptParser))
      return this.accessorParser.parse(startNode, modifierNodes, node);

    if (node instanceof TypeScriptOpenBracketNode && this.indexSignatureParser.isStart)
      return this.indexSignatureParser.parse(startNode, modifierNodes, node);

    return this.parsePropertyOrMethod(startNode, modifierNodes);
  }

  public parseList(memberNodes: Node[], isInterface: boolean = false): Node | undefined {
    this.typescriptParser.context.enterList(TypeScriptListKind.TypeMembers);
    try {
      const parser = this.typescriptParser;
      let endNode: Node | undefined;
      while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode)) {
        if (!parser.currentNode.canStartTypeScriptTypeMember(parser)) {
          parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1131, parser.currentNode.span);
          if (parser.context.isListBoundary(parser))
            break;
          endNode = parser.currentNode;
          parser.advance();
          continue;
        }
        const memberNode = this.parse();
        memberNode.reportTypeScriptSignatureInitializer(parser.context, isInterface);
        memberNodes.push(memberNode);
        endNode = memberNode;
      }
      return endNode;
    }
    finally {
      this.typescriptParser.context.leaveList();
    }
  }

  private parseMemberType(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptCloseBraceNode || node instanceof TypeScriptSemicolonNode || node instanceof TypeScriptCommaNode) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1110, node.span);
      return new TypeScriptMissingTypeNode(node.getTypeScriptMissingNodeSpan());
    }
    return parser.parseType();
  }

  private parseCallSignature(): TypeScriptCallSignatureNode {
    const typescriptParser = this.typescriptParser;
    const startNode = typescriptParser.currentNode;
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);

    const parameterListNode = this.parameterListParser.parseSignatureParameters(typeParameterListNode);

    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);

    const returnTypeNode = Object.isUndefined(colonNode) && !this.consumeMisplacedArrow() ? undefined : typescriptParser.parseReturnType();
    returnTypeNode?.validateTypeScriptPredicateParameter(typescriptParser.context, parameterListNode.children);

    const terminatorNode = this.consumeTerminator();

    let endNode: Node = parameterListNode;
    if (!Object.isUndefined(colonNode))
      endNode = colonNode;
    if (!Object.isUndefined(returnTypeNode))
      endNode = returnTypeNode;
    if (!Object.isUndefined(terminatorNode))
      endNode = terminatorNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);

    const signatureNode = new TypeScriptCallSignatureNode(
      span,
      parameterListNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      terminatorNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);
    parameterListNode.readTypeScriptHolder(typescriptParser.context, signatureNode);
    return signatureNode;
  }

  private consumeMisplacedArrow(): boolean {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (!(node instanceof TypeScriptArrowNode))
      return false;

    typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, node.span, [Resources.colon]);
    typescriptParser.advance();
    return true;
  }

  private parseConstructSignature(newKeywordNode: TypeScriptNewKeywordNode): TypeScriptConstructSignatureNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);

    const parameterListNode = this.parameterListParser.parseSignatureParameters(typeParameterListNode);

    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);

    const returnTypeNode = Object.isUndefined(colonNode) ? undefined : typescriptParser.parseReturnType(false);

    const terminatorNode = this.consumeTerminator();

    let endNode: Node = parameterListNode;
    if (!Object.isUndefined(colonNode))
      endNode = colonNode;
    if (!Object.isUndefined(returnTypeNode))
      endNode = returnTypeNode;
    if (!Object.isUndefined(terminatorNode))
      endNode = terminatorNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      newKeywordNode.span,
      endNode.span);

    const signatureNode = new TypeScriptConstructSignatureNode(
      newKeywordNode,
      span,
      parameterListNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      terminatorNode,
      newKeywordNode.leadingTrivia,
      endNode.trailingTrivia);
    parameterListNode.readTypeScriptHolder(typescriptParser.context, signatureNode);
    return signatureNode;
  }

  private parsePropertyOrMethod(startNode: Node, modifierNodes: readonly Node[]): Node {
    const typescriptParser = this.typescriptParser;
    const nameNode = this.propertyNameParser.parse();

    const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
    if (typescriptParser.currentNode.canStartTypeScriptSignature()) {
      const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
      const parameterListNode = this.parameterListParser.parseSignatureParameters(typeParameterListNode);
      const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
      const returnTypeNode = Object.isUndefined(colonNode) && !this.consumeMisplacedArrow() ? undefined : typescriptParser.parseReturnType();
      returnTypeNode?.validateTypeScriptPredicateParameter(typescriptParser.context, parameterListNode.children);
      const terminatorNode = this.consumeTerminator();

      let endNode: Node = parameterListNode;
      if (!Object.isUndefined(colonNode))
        endNode = colonNode;
      if (!Object.isUndefined(returnTypeNode))
        endNode = returnTypeNode;
      if (!Object.isUndefined(terminatorNode))
        endNode = terminatorNode;
      const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);

      const signatureNode = new TypeScriptMethodSignatureNode(
        modifierNodes,
        span,
        nameNode,
        parameterListNode,
        questionNode,
        typeParameterListNode,
        colonNode,
        returnTypeNode,
        terminatorNode,
        startNode.leadingTrivia,
        endNode.trailingTrivia);

      parameterListNode.readTypeScriptHolder(typescriptParser.context, signatureNode);
      signatureNode.validateTypeScriptGrammar(this.typescriptParser.context);

      return signatureNode;
    }

    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const typeNode = Object.isUndefined(colonNode) ? undefined : this.parseMemberType();
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode) ? undefined : typescriptParser.parseAssignmentExpression();
    const terminatorNode = this.consumeTerminator();

    const endNode: Node = terminatorNode ?? initializerNode ?? equalsNode ?? typeNode ?? colonNode ?? questionNode ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);

    const signatureNode = new TypeScriptPropertySignatureNode(
      modifierNodes,
      span,
      nameNode,
      questionNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      terminatorNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    signatureNode.validateTypeScriptGrammar(this.typescriptParser.context);

    return signatureNode;
  }

  private isConstructSignature(): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      typescriptParser.advance();
      return typescriptParser.currentNode.canStartTypeScriptSignature();
    });
  }

  private consumeTerminator(): TypeScriptCommaNode | TypeScriptSemicolonNode | undefined {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.tryConsume(TypeScriptCommaNode)
      ?? typescriptParser.parseStatementTerminator();
  }
}
