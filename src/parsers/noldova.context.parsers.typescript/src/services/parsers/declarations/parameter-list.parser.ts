/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptTypeParameterListNode } from "../../../models/nodes/types/typescript-type-parameter-list.node.js";
import { TypeScriptParameterListRead } from "../../../models/typescript-parameter-list-read.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { BindingNameParser } from "../names/binding-name.parser.js";
import { ModifierParser } from "./modifier.parser.js";

export class ParameterListParser {
  private readonly bindingNameParser: BindingNameParser;
  private readonly modifierParser: ModifierParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.bindingNameParser = new BindingNameParser(typescriptParser);
    this.modifierParser = new ModifierParser(typescriptParser);
  }

  public parseConstructorParameters(): TypeScriptParameterListNode {
    return this.parseList(this.typescriptParser.context.awaitFlags, true);
  }

  private parseList(enclosingAwaitFlags: TypeScriptContextFlags, holdsParameterProperties: boolean = false): TypeScriptParameterListNode {
    const typescriptParser = this.typescriptParser;
    const openParenthesisNode = typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode)) {
      typescriptParser.reportExpected(Resources.openParenthesis);
      return new TypeScriptParameterListNode(undefined, [], [], typescriptParser.currentNode.getTypeScriptMissingNodeSpan());
    }

    const parameterNodes: TypeScriptParameterNode[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    const endNode = this.readParameters(openParenthesisNode, parameterNodes, commaNodes, () => true, enclosingAwaitFlags, holdsParameterProperties)
      .endNode;
    return this.closeList(openParenthesisNode, parameterNodes, commaNodes, endNode);
  }

  private tryParseList(openParenthesisNode: TypeScriptOpenParenthesisNode, isParameterNameRequired: boolean,
    enclosingAwaitFlags: TypeScriptContextFlags): TypeScriptParameterListNode | undefined {
    this.typescriptParser.advance();
    const parameterNodes: TypeScriptParameterNode[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    const endNode = this.tryParseParameters(openParenthesisNode, parameterNodes, commaNodes, isParameterNameRequired, enclosingAwaitFlags);
    return Object.isUndefined(endNode) ? undefined : this.closeList(openParenthesisNode, parameterNodes, commaNodes, endNode);
  }

  private closeList(openParenthesisNode: TypeScriptOpenParenthesisNode, parameterNodes: readonly TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[], parametersEndNode: Node): TypeScriptParameterListNode {
    const typescriptParser = this.typescriptParser;
    let endNode = parametersEndNode;
    const closeParenthesisNode = typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      typescriptParser.reportExpected(Resources.closeParenthesis);
    else
      endNode = closeParenthesisNode;

    const span = typescriptParser.typescriptLexer.reader.createSpan(openParenthesisNode.span, endNode.span);

    const resultNode = new TypeScriptParameterListNode(
      openParenthesisNode,
      parameterNodes,
      commaNodes,
      span,
      closeParenthesisNode,
      openParenthesisNode.leadingTrivia,
      endNode.trailingTrivia);

    return resultNode;
  }

  public parseParameters(openNode: Node, parameterNodes: TypeScriptParameterNode[], commaNodes: TypeScriptCommaNode[]): Node {
    return this.readParameters(openNode, parameterNodes, commaNodes, () => true, this.typescriptParser.context.awaitFlags, false).endNode;
  }

  public tryParseParameters(openNode: Node, parameterNodes: TypeScriptParameterNode[], commaNodes: TypeScriptCommaNode[],
    isParameterNameRequired: boolean, enclosingAwaitFlags: TypeScriptContextFlags = this.typescriptParser.context.awaitFlags): Node | undefined {
    const read = this.readParameters(openNode, parameterNodes, commaNodes,
      () => !isParameterNameRequired || this.startsNamedParameter(enclosingAwaitFlags), enclosingAwaitFlags, false);
    return read.isComplete ? read.endNode : undefined;
  }

  private startsNamedParameter(enclosingAwaitFlags: TypeScriptContextFlags): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      this.parseModifiers(enclosingAwaitFlags);
      typescriptParser.tryConsume(TypeScriptDotDotDotNode);
      return typescriptParser.currentNode.canStartTypeScriptBindingName() || typescriptParser.currentNode instanceof TypeScriptThisKeywordNode;
    });
  }

  private readParameters(openNode: Node, parameterNodes: TypeScriptParameterNode[], commaNodes: TypeScriptCommaNode[], canParse: () => boolean,
    enclosingAwaitFlags: TypeScriptContextFlags, holdsParameterProperties: boolean): TypeScriptParameterListRead {
    const typescriptParser = this.typescriptParser;
    let endNode = openNode;
    const outerListScope = typescriptParser.context.enterList(TypeScriptListKind.Parameters);
    try {
      while (!typescriptParser.isEndOfFile && !typescriptParser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.Parameters, typescriptParser)) {
        const startNode = typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.Parameters, typescriptParser)) {
          startNode.reportTypeScriptInvalidParameter(typescriptParser);
          if (typescriptParser.context.isListBoundary(typescriptParser))
            break;
          endNode = startNode;
          typescriptParser.advance();
          continue;
        }
        if (!canParse())
          return new TypeScriptParameterListRead(endNode, false);
        const parameterNode = this.parseParameter(undefined, enclosingAwaitFlags, holdsParameterProperties);
        parameterNodes.push(parameterNode);
        endNode = parameterNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (typescriptParser.isEndOfFile || typescriptParser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.Parameters, typescriptParser))
          break;
        typescriptParser.reportExpected(Resources.comma);
        if (typescriptParser.currentNode === startNode) {
          endNode = startNode;
          typescriptParser.advance();
        }
      }
      return new TypeScriptParameterListRead(endNode, true);
    }
    finally {
      typescriptParser.context.leaveList(outerListScope);
    }
  }

  public validate(parameterListNode: TypeScriptParameterListNode, typeParameterListNode: TypeScriptTypeParameterListNode | undefined): void {
    if (Object.isUndefined(typeParameterListNode) || typeParameterListNode.children.length > 0)
      parameterListNode.validateTypeScriptGrammar(this.typescriptParser.context);
  }

  public parseParameter(parsedNameNode?: Node, enclosingAwaitFlags: TypeScriptContextFlags = this.typescriptParser.context.awaitFlags,
    holdsParameterProperties: boolean = false): TypeScriptParameterNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.context.enterRecursion(typescriptParser.currentNode.span);
    try {
      const modifierNodes = Object.isUndefined(parsedNameNode) ? this.parseModifiers(enclosingAwaitFlags) : [];

      const dotDotDotNode = Object.isUndefined(parsedNameNode) ? typescriptParser.tryConsume(TypeScriptDotDotDotNode) : undefined;
      const isThisParameter = Object.isUndefined(parsedNameNode) && Object.isUndefined(dotDotDotNode)
        && typescriptParser.currentNode instanceof TypeScriptThisKeywordNode;
      const nameNode = parsedNameNode ?? (isThisParameter ? typescriptParser.consumeName() : this.parseName());
      if (!Object.isUndefined(parsedNameNode))
        parsedNameNode.readTypeScriptEvalOrArgumentsNames(typescriptParser);
      if (nameNode instanceof TypeScriptMissingIdentifierNode && modifierNodes.length === 0 && typescriptParser.currentNode.isTypeScriptDeclarationModifier())
        typescriptParser.advance();
      const questionNode = isThisParameter ? undefined : typescriptParser.tryConsume(TypeScriptQuestionNode);
      const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
      const typeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseType();
      const equalsNode = isThisParameter ? undefined : typescriptParser.tryConsume(TypeScriptEqualsNode);
      const initializerNode = Object.isUndefined(equalsNode) ? undefined : typescriptParser.parseAssignmentExpression();
      const firstModifierNode = modifierNodes[0];
      if (isThisParameter && !Object.isUndefined(firstModifierNode))
        typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1433, firstModifierNode.getTypeScriptFullSpan());

      const startNode = modifierNodes[0] ?? dotDotDotNode ?? nameNode;
      const endNode: Node = initializerNode ?? equalsNode ?? typeNode ?? colonNode ?? questionNode ?? nameNode;
      const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);

      const resultNode = new TypeScriptParameterNode(
        modifierNodes,
        span,
        nameNode,
        dotDotDotNode,
        questionNode,
        colonNode,
        typeNode,
        equalsNode,
        initializerNode,
        startNode.leadingTrivia,
        endNode.trailingTrivia);

      const hasModifierDiagnostics = this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.Parameter, resultNode);
      resultNode.reportTypeScriptGrammarAfterModifiers(typescriptParser.context, hasModifierDiagnostics);
      if (!holdsParameterProperties)
        resultNode.recordTypeScriptMisplacedParameterProperty(typescriptParser.context);
      return resultNode;
    }
    finally {
      typescriptParser.context.leaveRecursion();
    }
  }

  public parseSignatureParameters(typeParameterListNode: TypeScriptTypeParameterListNode | undefined): TypeScriptParameterListNode {
    const context = this.typescriptParser.context;
    const writtenAwaitCount = context.records.writtenAwaits.length;
    const parameterListNode = this.parseSignatureList();
    this.validate(parameterListNode, typeParameterListNode);
    context.records.writtenAwaits.length = writtenAwaitCount;
    return parameterListNode;
  }

  private parseSignatureList(): TypeScriptParameterListNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    const enclosingAwaitFlags = context.awaitFlags;
    context.contextFlags = previousFlags & ~(TypeScriptContextFlags.Yield | enclosingAwaitFlags);
    try {
      return this.parseList(enclosingAwaitFlags);
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  public parseFunctionParameters(flags: TypeScriptContextFlags = TypeScriptContextFlags.None, isNewTargetScope: boolean = false): TypeScriptParameterListNode {
    return this.inFunctionScope(flags, isNewTargetScope, enclosingAwaitFlags => this.parseList(enclosingAwaitFlags));
  }

  public tryParseFunctionParameters(openParenthesisNode: TypeScriptOpenParenthesisNode, flags: TypeScriptContextFlags, isParameterNameRequired: boolean,
    isNewTargetScope: boolean): TypeScriptParameterListNode | undefined {
    return this.inFunctionScope(flags, isNewTargetScope,
      enclosingAwaitFlags => this.tryParseList(openParenthesisNode, isParameterNameRequired, enclosingAwaitFlags));
  }

  private inFunctionScope<TResult>(flags: TypeScriptContextFlags, isNewTargetScope: boolean,
    parse: (enclosingAwaitFlags: TypeScriptContextFlags) => TResult): TResult {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    const previousFunctionScope = context.isFunctionScope;
    const previousNewTargetScope = context.isNewTargetScope;
    const previousClassStaticBlock = context.isClassStaticBlock;
    const enclosingAwaitFlags = context.awaitFlags;
    context.contextFlags = flags | (previousFlags & TypeScriptContextFlags.DisallowIn);
    context.isFunctionScope = true;
    context.isNewTargetScope = isNewTargetScope;
    context.isClassStaticBlock = false;
    try {
      return parse(enclosingAwaitFlags);
    }
    finally {
      context.contextFlags = previousFlags;
      context.isFunctionScope = previousFunctionScope;
      context.isNewTargetScope = previousNewTargetScope;
      context.isClassStaticBlock = previousClassStaticBlock;
    }
  }

  private parseModifiers(enclosingAwaitFlags: TypeScriptContextFlags): readonly Node[] {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = (previousFlags & ~context.awaitFlags) | enclosingAwaitFlags;
    try {
      return this.modifierParser.parseParameter();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  private parseName(): Node {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node instanceof TypeScriptPrivateIdentifierNode) {
      typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18009, node.span);
      return typescriptParser.consumeName();
    }
    if (typescriptParser.context.isAmbient && node.isTypeScriptBindingIdentifier())
      return typescriptParser.consumeBindingName();
    return this.bindingNameParser.parse();
  }
}
