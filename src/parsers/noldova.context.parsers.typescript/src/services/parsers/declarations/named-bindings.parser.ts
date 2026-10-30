/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CompositeNode, Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptExportSpecifierNode } from "../../../models/nodes/declarations/typescript-export-specifier.node.js";
import type { TypeScriptImportSpecifierNode } from "../../../models/nodes/declarations/typescript-import-specifier.node.js";
import { TypeScriptNamedExportsNode } from "../../../models/nodes/declarations/typescript-named-exports.node.js";
import { TypeScriptNamedImportsNode } from "../../../models/nodes/declarations/typescript-named-imports.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ImportExportSpecifierParser } from "./import-export-specifier.parser.js";

export class NamedBindingsParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly specifierParser: ImportExportSpecifierParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.specifierParser = new ImportExportSpecifierParser(typescriptParser);
  }

  public parseImports(): TypeScriptNamedImportsNode {
    return this.parse(true);
  }

  public parseExports(): TypeScriptNamedExportsNode {
    return this.parse(false);
  }

  private parse(isImport: true): TypeScriptNamedImportsNode;
  private parse(isImport: false): TypeScriptNamedExportsNode;
  private parse(isImport: boolean): CompositeNode {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const openBraceNode = parser.tryConsume(TypeScriptOpenBraceNode);
    const memberNodes: (TypeScriptImportSpecifierNode | TypeScriptExportSpecifierNode)[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    let endNode: Node | undefined = openBraceNode;
    if (Object.isUndefined(openBraceNode))
      parser.reportExpected(Resources.openBrace);
    else {
      parser.context.enterList(TypeScriptListKind.ImportOrExportSpecifiers);
      try {
        while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode) && !parser.currentNode.startsTypeScriptFromClause(parser)) {
          if (!parser.currentNode.isTypeScriptListElement(TypeScriptListKind.ImportOrExportSpecifiers, parser)) {
            parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, parser.currentNode.span);
            if (parser.context.isListBoundary(parser))
              break;
            endNode = parser.currentNode;
            parser.advance();
            continue;
          }
          const memberNode = isImport ? this.specifierParser.parseImport() : this.specifierParser.parseExport();
          memberNodes.push(memberNode);
          endNode = memberNode;
          const commaNode = parser.tryConsume(TypeScriptCommaNode);
          if (!Object.isUndefined(commaNode)) {
            commaNodes.push(commaNode);
            endNode = commaNode;
          }
          else if (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode))
            parser.reportExpected(Resources.comma);
        }
      }
      finally {
        parser.context.leaveList();
      }
    }
    const closeBraceNode = Object.isUndefined(openBraceNode) ? undefined : parser.tryConsume(TypeScriptCloseBraceNode);
    if (!Object.isUndefined(openBraceNode) && Object.isUndefined(closeBraceNode))
      parser.reportExpected(Resources.closeBrace);
    endNode = closeBraceNode ?? endNode;
    const span = Object.isUndefined(endNode)
      ? startNode.getTypeScriptMissingNodeSpan()
      : parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return isImport
      ? new TypeScriptNamedImportsNode(memberNodes, commaNodes, span, openBraceNode, closeBraceNode, openBraceNode?.leadingTrivia, endNode?.trailingTrivia)
      : new TypeScriptNamedExportsNode(memberNodes, commaNodes, span, openBraceNode, closeBraceNode, openBraceNode?.leadingTrivia, endNode?.trailingTrivia);
  }
}
