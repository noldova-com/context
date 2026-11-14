/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExportSpecifierNode } from "../../../models/nodes/declarations/typescript-export-specifier.node.js";
import type { TypeScriptImportExportSpecifierNode } from "../../../models/nodes/declarations/typescript-import-export-specifier.node.js";
import { TypeScriptImportSpecifierNode } from "../../../models/nodes/declarations/typescript-import-specifier.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import { TypeScriptKeywordNode } from "../../../models/nodes/keywords/typescript-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class ImportExportSpecifierParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parseImport(): TypeScriptImportSpecifierNode {
    const parser = this.typescriptParser;
    const specifierNode = this.parse(TypeScriptImportSpecifierNode);
    const localNameNode = specifierNode.aliasNode ?? specifierNode.nameNode;
    if ((localNameNode instanceof TypeScriptKeywordNode && !localNameNode.isTypeScriptBindingIdentifier())
      || localNameNode instanceof TypeScriptStringLiteralNode)
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, localNameNode.span);
    parser.readName(localNameNode);
    return specifierNode;
  }

  public parseExport(): TypeScriptExportSpecifierNode {
    return this.parse(TypeScriptExportSpecifierNode);
  }

  private parse<TNode extends TypeScriptImportExportSpecifierNode>(
    nodeType: new (span: SourceSpan, nameNode: Node, asKeywordNode: TypeScriptAsKeywordNode | undefined, aliasNode: Node | undefined,
      typeKeywordNode: TypeScriptTypeKeywordNode | undefined, leadingTrivia: Node | undefined, trailingTrivia: Node | undefined) => TNode): TNode {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const typeKeywordNode = this.isTypeOnly() ? parser.tryConsume(TypeScriptTypeKeywordNode) : undefined;
    const nameNode = this.nameParser.parseIdentifierOrStringName()!;
    const asKeywordNode = parser.tryConsume(TypeScriptAsKeywordNode);
    const aliasNode = Object.isUndefined(asKeywordNode) ? undefined
      : this.nameParser.parseIdentifierOrStringName() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    const endNode = aliasNode ?? nameNode;
    const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return new nodeType(span, nameNode, asKeywordNode, aliasNode, typeKeywordNode, startNode.leadingTrivia, endNode.trailingTrivia);
  }

  private isTypeOnly(): boolean {
    const parser = this.typescriptParser;
    if (!(parser.currentNode instanceof TypeScriptTypeKeywordNode))
      return false;
    return parser.lookAhead(() => {
      parser.consumeIdentifierName();
      let node = parser.currentNode;
      if (!(node instanceof TypeScriptAsKeywordNode))
        return node.isTypeScriptModuleExportName();
      parser.consumeIdentifierName();
      node = parser.currentNode;
      if (!(node instanceof TypeScriptAsKeywordNode))
        return !node.isTypeScriptModuleExportName();
      parser.consumeIdentifierName();
      return parser.currentNode.isTypeScriptModuleExportName();
    });
  }
}
