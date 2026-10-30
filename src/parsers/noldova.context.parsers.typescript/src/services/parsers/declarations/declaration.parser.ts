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
import { TypeScriptMissingDeclarationNode } from "../../../models/nodes/declarations/typescript-missing-declaration.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ModifierParser } from "./modifier.parser.js";

export class DeclarationParser {
  private readonly modifierParser: ModifierParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.modifierParser = new ModifierParser(typescriptParser);
  }

  public isStart(): boolean {
    const parser = this.typescriptParser;
    return parser.lookAhead(() => {
      const modifierNodes: Node[] = [];
      while (!this.isCurrentDeclarationStart(modifierNodes.at(-1))) {
        if (!parser.currentNode.isTypeScriptDeclarationStartModifier() || !parser.currentNode.canParseTypeScriptDeclarationModifier(parser, modifierNodes))
          return false;
        modifierNodes.push(parser.currentNode);
        parser.advance();
      }
      return true;
    });
  }

  public parse(): Node {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const modifierNodes = this.modifierParser.parseDeclaration();

    const previousAmbient = parser.context.hasAmbientDeclaration;
    if (modifierNodes.some(t => t instanceof TypeScriptDeclareKeywordNode))
      parser.context.hasAmbientDeclaration = true;
    try {
      if (parser.currentNode.isTypeScriptDeclarationKeyword(parser)) {
        const declarationNode = parser.currentNode.parseTypeScriptStatement(parser, modifierNodes);
        parser.context.hasAmbientDeclaration = previousAmbient;
        const hasModifierDiagnostics = this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.ModuleElement, declarationNode);
        declarationNode.reportTypeScriptGrammarAfterModifiers(parser.context, hasModifierDiagnostics);
        return declarationNode;
      }

      const endNode = modifierNodes.at(-1)!;
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1146,
        parser.typescriptLexer.reader.createSpan(endNode.span.endOffset, 0));
      const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      const missingNode = new TypeScriptMissingDeclarationNode(modifierNodes, span, startNode.leadingTrivia, endNode.trailingTrivia);
      parser.context.hasAmbientDeclaration = previousAmbient;
      this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.ModuleElement, missingNode);
      return missingNode;
    }
    finally {
      parser.context.hasAmbientDeclaration = previousAmbient;
    }
  }

  private isCurrentDeclarationStart(lastModifier: Node | undefined): boolean {
    const parser = this.typescriptParser;
    return (lastModifier instanceof TypeScriptDeclareKeywordNode && parser.currentNode instanceof TypeScriptTypeKeywordNode)
      || parser.currentNode.isTypeScriptDeclarationStart(parser);
  }
}
