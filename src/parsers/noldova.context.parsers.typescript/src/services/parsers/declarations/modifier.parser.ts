/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDecoratorNode } from "../../../models/nodes/declarations/typescript-decorator.node.js";
import { TypeScriptAtNode } from "../../../models/nodes/delimiters/typescript-at.node.js";
import { TypeScriptDefaultKeywordNode } from "../../../models/nodes/keywords/typescript-default-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptStaticKeywordNode } from "../../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { DecoratorParser } from "./decorator.parser.js";

export class ModifierParser {
  private readonly decoratorParser: DecoratorParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.decoratorParser = new DecoratorParser(typescriptParser);
  }

  public parse(): readonly Node[] {
    const nodes: Node[] = [];
    this.parseDecorators(nodes);
    this.parseKeywords(nodes, t => t.canParseTypeScriptClassMemberModifier(this.typescriptParser));
    return nodes;
  }

  public validate(modifierNodes: readonly Node[], target: TypeScriptModifierTarget, declarationNode: Node): boolean {
    if (modifierNodes.length === 0 || declarationNode.readsTypeScriptModifierListItself())
      return false;

    const context = this.typescriptParser.context;
    if (declarationNode.getTypeScriptDecoratorSupport() !== TypeScriptDecoratorSupport.Supported)
      for (const modifierNode of modifierNodes)
        if (modifierNode instanceof TypeScriptDecoratorNode)
          context.records.uncheckedSpans.push(modifierNode.expressionNode.span);

    const diagnostics = context.diagnosticCollector;
    const diagnosticCount = diagnostics.diagnostics.length;
    const decoratorNodes: TypeScriptDecoratorNode[] = [];
    const readAfterListNodes: Node[] = [];
    let writtenFlags = TypeScriptModifierFlags.None;
    let decoratorBeforeExportNode: TypeScriptDecoratorNode | undefined;
    let exportedDecoratorNode: TypeScriptDecoratorNode | undefined;
    let hasExportKeyword = false;
    for (const modifierNode of modifierNodes) {
      if (modifierNode instanceof TypeScriptDecoratorNode) {
        decoratorNodes.push(modifierNode);
        modifierNode.validateTypeScriptModifierForDeclaration(context, declarationNode);
        if (!hasExportKeyword)
          decoratorBeforeExportNode ??= modifierNode;
        else if (!Object.isUndefined(decoratorBeforeExportNode))
          diagnostics.addTypeScriptRelatedGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS8038, modifierNode.span,
            TypeScriptDiagnosticTemplates.TS1486, decoratorBeforeExportNode.span);
        else
          exportedDecoratorNode ??= modifierNode;
      }
      else {
        const rejectionTemplate = declarationNode.getTypeScriptModifierRejection(context, modifierNode);
        if (!Object.isUndefined(rejectionTemplate))
          diagnostics.addTypeScriptGrammarDiagnostic(context.source, rejectionTemplate, modifierNode.span, [context.source.getText(modifierNode.span)]);
        else {
          writtenFlags |= modifierNode.validateTypeScriptModifier(context, target, writtenFlags, declarationNode);
          if (diagnostics.diagnostics.length !== diagnosticCount)
            return true;
          if (modifierNode.isTypeScriptModifierReadAfterList())
            readAfterListNodes.push(modifierNode);
          else
            modifierNode.validateTypeScriptModifierForDeclaration(context, declarationNode);
        }
        if (modifierNode instanceof TypeScriptDefaultKeywordNode && !Object.isUndefined(exportedDecoratorNode)
          && diagnostics.diagnostics.length === diagnosticCount)
          diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1206, exportedDecoratorNode.span);
        hasExportKeyword ||= modifierNode instanceof TypeScriptExportKeywordNode;
      }
      if (diagnostics.diagnostics.length !== diagnosticCount)
        return true;
    }

    for (const modifierNode of readAfterListNodes) {
      modifierNode.validateTypeScriptModifierForDeclaration(context, declarationNode);
      if (diagnostics.diagnostics.length !== diagnosticCount)
        return true;
    }

    for (const decoratorNode of decoratorNodes)
      decoratorNode.validateTypeScriptGrammar(context);

    return false;
  }

  public validateTypeParameter(modifierNodes: readonly Node[], accepted: TypeScriptTypeParameterAnnotations): void {
    const context = this.typescriptParser.context;
    const diagnostics = context.diagnosticCollector;
    const diagnosticCount = diagnostics.diagnostics.length;
    let writtenAnnotations = TypeScriptTypeParameterAnnotations.None;
    for (const modifierNode of modifierNodes) {
      writtenAnnotations |= modifierNode.validateTypeScriptTypeParameterModifier(context, accepted, writtenAnnotations);
      if (diagnostics.diagnostics.length !== diagnosticCount)
        return;
    }
  }

  public parseDeclaration(): readonly Node[] {
    return this.parseModifiers((node, writtenNodes) => node.canParseTypeScriptDeclarationModifier(this.typescriptParser, writtenNodes));
  }

  public parseParameter(): readonly Node[] {
    return this.parseModifiers(t => t.canParseTypeScriptParameterModifier(this.typescriptParser));
  }

  public parseTypeMember(): readonly Node[] {
    const modifierNodes: Node[] = [];
    this.parseKeywords(modifierNodes, t => t.isTypeScriptTypeMemberModifier() && t.hasTypeScriptModifierFollower(this.typescriptParser));
    return modifierNodes;
  }

  public parseTypeParameter(): readonly Node[] {
    const modifierNodes: Node[] = [];
    this.parseKeywords(modifierNodes, t => t.canParseTypeScriptTypeParameterModifier(this.typescriptParser));
    return modifierNodes;
  }

  public parseParameterKeywords(): readonly Node[] {
    const modifierNodes: Node[] = [];
    this.parseKeywords(modifierNodes, t => t.canParseTypeScriptParameterModifier(this.typescriptParser));
    return modifierNodes;
  }

  private parseModifiers(canParseModifier: (node: Node, writtenNodes: readonly Node[]) => boolean): readonly Node[] {
    const modifierNodes: Node[] = [];
    this.parseDecorators(modifierNodes);
    const hasReadKeyword = this.parseKeywords(modifierNodes, canParseModifier);
    if (hasReadKeyword && this.typescriptParser.currentNode instanceof TypeScriptAtNode) {
      this.parseDecorators(modifierNodes);
      this.parseKeywords(modifierNodes, canParseModifier);
    }
    return modifierNodes;
  }

  private parseDecorators(modifierNodes: Node[]): void {
    while (this.typescriptParser.currentNode instanceof TypeScriptAtNode)
      modifierNodes.push(this.decoratorParser.parse(this.typescriptParser.currentNode));
  }

  private parseKeywords(modifierNodes: Node[], canParseModifier: (node: Node, writtenNodes: readonly Node[]) => boolean): boolean {
    const readCount = modifierNodes.length;
    let node = this.typescriptParser.currentNode;
    while (!(node instanceof TypeScriptStaticKeywordNode && modifierNodes.some(t => t instanceof TypeScriptStaticKeywordNode))
      && canParseModifier(node, modifierNodes)) {
      modifierNodes.push(node);
      this.typescriptParser.advance();
      node = this.typescriptParser.currentNode;
    }
    return modifierNodes.length !== readCount;
  }
}
