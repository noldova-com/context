/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    return this.parse(true);
  }

  public parseExport(): TypeScriptExportSpecifierNode {
    return this.parse(false);
  }

  private parse(isImport: true): TypeScriptImportSpecifierNode;
  private parse(isImport: false): TypeScriptExportSpecifierNode;
  private parse(isImport: boolean): TypeScriptImportExportSpecifierNode {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const typeKeywordNode = this.isTypeOnly() ? parser.tryConsume(TypeScriptTypeKeywordNode) : undefined;
    const nameNode = this.nameParser.parseIdentifierOrStringName()!;
    const asKeywordNode = parser.tryConsume(TypeScriptAsKeywordNode);
    const aliasNode = Object.isUndefined(asKeywordNode) ? undefined
      : this.nameParser.parseIdentifierOrStringName() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    const localNameNode = aliasNode ?? nameNode;
    if (isImport && ((localNameNode instanceof TypeScriptKeywordNode && !localNameNode.isTypeScriptBindingIdentifier())
      || localNameNode instanceof TypeScriptStringLiteralNode))
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, localNameNode.span);
    if (isImport)
      parser.readName(localNameNode);
    const endNode = localNameNode;
    const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return isImport
      ? new TypeScriptImportSpecifierNode(span, nameNode, asKeywordNode, aliasNode, typeKeywordNode, startNode.leadingTrivia, endNode.trailingTrivia)
      : new TypeScriptExportSpecifierNode(span, nameNode, asKeywordNode, aliasNode, typeKeywordNode, startNode.leadingTrivia, endNode.trailingTrivia);
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
