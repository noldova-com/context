/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptImportDeclarationNode } from "../../../models/nodes/declarations/typescript-import-declaration.node.js";
import type { TypeScriptImportEqualsDeclarationNode } from "../../../models/nodes/declarations/typescript-import-equals-declaration.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptDeferKeywordNode } from "../../../models/nodes/keywords/typescript-defer-keyword.node.js";
import { TypeScriptFromKeywordNode } from "../../../models/nodes/keywords/typescript-from-keyword.node.js";
import type { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { ImportAttributesParser } from "./import-attributes.parser.js";
import { ImportClauseParser } from "./import-clause.parser.js";
import { ImportEqualsDeclarationParser } from "./import-equals-declaration.parser.js";
import { ModuleSpecifierParser } from "./module-specifier.parser.js";

export class ImportDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly importClauseParser: ImportClauseParser;
  private readonly attributesParser: ImportAttributesParser;
  private readonly importEqualsParser: ImportEqualsDeclarationParser;
  private readonly moduleSpecifierParser: ModuleSpecifierParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.importClauseParser = new ImportClauseParser(typescriptParser);
    this.attributesParser = new ImportAttributesParser(typescriptParser);
    this.importEqualsParser = new ImportEqualsDeclarationParser(typescriptParser);
    this.moduleSpecifierParser = new ModuleSpecifierParser(typescriptParser);
  }

  public parse(importKeywordNode: TypeScriptImportKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptImportDeclarationNode | TypeScriptImportEqualsDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? importKeywordNode;
    parser.advance();
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    let nameNode = parser.currentNode.isTypeScriptIdentifier(parser.context) ? this.nameParser.parseBindingIdentifier() : undefined;
    let phaseKeywordNode: TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode | undefined;
    if (!Object.isUndefined(nameNode) && nameNode.isTypeScriptImportPhase(parser)) {
      phaseKeywordNode = nameNode;
      nameNode = parser.currentNode.isTypeScriptIdentifier(parser.context) ? this.nameParser.parseBindingIdentifier() : undefined;
    }
    if (!Object.isUndefined(nameNode) && !(parser.currentNode instanceof TypeScriptCommaNode) && !(parser.currentNode instanceof TypeScriptFromKeywordNode)
      && !(phaseKeywordNode instanceof TypeScriptDeferKeywordNode)) {
      const importEqualsNode = this.importEqualsParser.parse(importKeywordNode, nameNode, phaseKeywordNode, modifierNodes);
      parser.context.records.awaitNameCount = previousAwaitNameCount;
      return importEqualsNode;
    }

    const hasClause = !Object.isUndefined(nameNode) || parser.currentNode instanceof TypeScriptAsteriskNode
      || parser.currentNode instanceof TypeScriptOpenBraceNode;
    const importClauseNode = hasClause ? this.importClauseParser.parse(nameNode) : undefined;
    parser.context.records.awaitNameCount = previousAwaitNameCount;
    const fromKeywordNode = hasClause ? parser.tryConsume(TypeScriptFromKeywordNode) : undefined;
    if (hasClause && Object.isUndefined(fromKeywordNode))
      parser.reportExpected(Resources.from);
    const moduleSpecifierNode = this.moduleSpecifierParser.parse();
    const attributesNode = this.attributesParser.parse();
    const semicolonNode = parser.parseStatementTerminator();
    const endNode = semicolonNode ?? attributesNode ?? moduleSpecifierNode;
    const resultNode = new TypeScriptImportDeclarationNode(importKeywordNode, parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span),
      moduleSpecifierNode, phaseKeywordNode, importClauseNode, fromKeywordNode, attributesNode, semicolonNode, modifierNodes,
      startNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }
}
