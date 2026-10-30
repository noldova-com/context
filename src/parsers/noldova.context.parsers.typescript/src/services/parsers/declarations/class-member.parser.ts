/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptSemicolonClassElementNode } from "../../../models/nodes/declarations/typescript-semicolon-class-element.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { PropertyNameParser } from "../names/property-name.parser.js";
import { BlockParser } from "../statements/block.parser.js";
import { TypeParameterListParser } from "../types/type-parameter-list.parser.js";
import { AccessorParser } from "./accessor.parser.js";
import { ConstructorDeclarationParser } from "./constructor-declaration.parser.js";
import { IndexSignatureParser } from "./index-signature.parser.js";
import { MethodDeclarationParser } from "./method-declaration.parser.js";
import { ModifierParser } from "./modifier.parser.js";
import { ParameterListParser } from "./parameter-list.parser.js";
import { PropertyDeclarationParser } from "./property-declaration.parser.js";
import { StaticBlockParser } from "./static-block.parser.js";

export class ClassMemberParser {
  private readonly constructorDeclarationParser: ConstructorDeclarationParser;
  private readonly accessorParser: AccessorParser;
  private readonly indexSignatureParser: IndexSignatureParser;
  private readonly methodDeclarationParser: MethodDeclarationParser;
  private readonly modifierParser: ModifierParser;
  private readonly propertyDeclarationParser: PropertyDeclarationParser;
  private readonly propertyNameParser: PropertyNameParser;
  private readonly staticBlockParser: StaticBlockParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    const blockParser = new BlockParser(typescriptParser);
    const parameterListParser = new ParameterListParser(typescriptParser);
    const typeParameterListParser = new TypeParameterListParser(typescriptParser);
    this.propertyNameParser = new PropertyNameParser(typescriptParser);
    this.modifierParser = new ModifierParser(typescriptParser);
    this.constructorDeclarationParser = new ConstructorDeclarationParser(typescriptParser, parameterListParser, typeParameterListParser, blockParser);
    this.accessorParser = new AccessorParser(typescriptParser, this.propertyNameParser, parameterListParser, typeParameterListParser, blockParser, true);
    this.indexSignatureParser = new IndexSignatureParser(typescriptParser, parameterListParser);
    this.methodDeclarationParser = new MethodDeclarationParser(typescriptParser, parameterListParser, typeParameterListParser, blockParser, true);
    this.propertyDeclarationParser = new PropertyDeclarationParser(typescriptParser);
    this.staticBlockParser = new StaticBlockParser(typescriptParser, blockParser);
  }

  public parse(): Node {
    const startNode = this.typescriptParser.currentNode;
    const modifierNodes = this.modifierParser.parse();
    const memberNode = this.parseMember(startNode, modifierNodes);
    const hasModifierDiagnostics = this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.ClassElement, memberNode);
    memberNode.reportTypeScriptGrammarAfterModifiers(this.typescriptParser.context, hasModifierDiagnostics);
    return memberNode;
  }

  private parseMember(startNode: Node, modifierNodes: readonly Node[]): Node {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node.startsTypeScriptClassStaticBlock(typescriptParser)) {
      typescriptParser.advance();
      return this.staticBlockParser.parse(modifierNodes, node, typescriptParser.requireCurrentNode(TypeScriptOpenBraceNode));
    }

    if (node instanceof TypeScriptSemicolonNode) {
      if (modifierNodes.length > 0)
        return this.parseNamelessProperty(startNode, modifierNodes);
      typescriptParser.advance();
      const span = typescriptParser.typescriptLexer.reader.createSpan(
        startNode.span,
        node.span);
      return new TypeScriptSemicolonClassElementNode(
        modifierNodes,
        node,
        span,
        startNode.leadingTrivia,
        node.trailingTrivia);
    }

    if (node.isTypeScriptConstructorDeclarationStart(typescriptParser))
      return this.constructorDeclarationParser.parse(startNode, modifierNodes, node);

    if (node.startsTypeScriptAccessor(this.typescriptParser))
      return this.accessorParser.parse(startNode, modifierNodes, node);

    if (node instanceof TypeScriptOpenBracketNode && this.indexSignatureParser.isStart)
      return this.indexSignatureParser.parse(startNode, modifierNodes, node);

    if (modifierNodes.length > 0 && !(node instanceof TypeScriptAsteriskNode) && !(node instanceof TypeScriptOpenBracketNode)
      && !node.canStartTypeScriptPropertyName())
      return this.parseNamelessProperty(startNode, modifierNodes);

    const asteriskNode = typescriptParser.tryConsume(TypeScriptAsteriskNode);
    const nameNode = this.propertyNameParser.parse();
    const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
    if (!Object.isUndefined(asteriskNode)
      || typescriptParser.currentNode.canStartTypeScriptSignature())
      return this.methodDeclarationParser.parse(
        startNode,
        modifierNodes,
        nameNode,
        asteriskNode,
        questionNode);

    const exclamationNode = Object.isUndefined(questionNode)
      ? typescriptParser.tryConsume(TypeScriptExclamationNode)
      : undefined;
    return this.propertyDeclarationParser.parse(
      startNode,
      modifierNodes,
      nameNode,
      questionNode,
      exclamationNode);
  }

  private parseNamelessProperty(startNode: Node, modifierNodes: readonly Node[]): Node {
    const typescriptParser = this.typescriptParser;
    typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1146,
      typescriptParser.typescriptLexer.reader.createSpan(modifierNodes.at(-1)!.span.endOffset, 0));
    return this.propertyDeclarationParser.parse(startNode, modifierNodes,
      new TypeScriptMissingIdentifierNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan()));
  }
}
