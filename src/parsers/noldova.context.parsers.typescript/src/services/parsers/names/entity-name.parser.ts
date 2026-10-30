/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { TypeScriptQualifiedNameNode } from "../../../models/nodes/identifiers/typescript-qualified-name.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class EntityNameParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(missingNameDiagnostic: DiagnosticTemplate = TypeScriptDiagnosticTemplates.TS1110): Node {
    return this.parseRest(this.consumeEntityNameHead(missingNameDiagnostic));
  }

  public parseRest(headNode: Node): Node {
    const typescriptParser = this.typescriptParser;
    let nameNode = headNode;
    while (true) {
      const dotNode = typescriptParser.currentNode;
      if (!(dotNode instanceof TypeScriptDotNode))
        break;
      typescriptParser.advance();
      const node = typescriptParser.currentNode;
      if (node instanceof TypeScriptLessThanNode)
        break;

      let rightNode: Node;
      if (typescriptParser.hasPrecedingLineBreak() && node.isTypeScriptIdentifierName() && typescriptParser.lookAhead(() => {
        typescriptParser.advance();
        return !typescriptParser.hasPrecedingLineBreak() && typescriptParser.currentNode.isTypeScriptIdentifierName();
      })) {
        typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003,
          typescriptParser.typescriptLexer.reader.createSpan(dotNode.span.endOffset, 0));
        rightNode = new TypeScriptMissingIdentifierNode(node.getTypeScriptMissingNodeSpan());
      }
      else if (!node.isTypeScriptIdentifierName()) {
        typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, node.getTypeScriptMissingNodeDiagnosticSpan());
        rightNode = new TypeScriptMissingIdentifierNode(node.getTypeScriptMissingNodeSpan());
      }
      else
        rightNode = node instanceof TypeScriptPrivateIdentifierNode ? this.consumeMissingPrivateName(node) : typescriptParser.consumeIdentifierName();

      const span = typescriptParser.typescriptLexer.reader.createSpan(nameNode.span, rightNode.span);
      nameNode = new TypeScriptQualifiedNameNode(
        nameNode,
        dotNode,
        rightNode,
        span,
        nameNode.leadingTrivia,
        rightNode.trailingTrivia);
    }

    return nameNode;
  }

  private consumeMissingPrivateName(node: Node): TypeScriptMissingIdentifierNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003,
      typescriptParser.typescriptLexer.reader.createSpan(node.span.endOffset, 0));

    return new TypeScriptMissingIdentifierNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan());
  }

  private consumeEntityNameHead(missingNameDiagnostic: DiagnosticTemplate): Node {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (!node.isTypeScriptIdentifierName()) {
      typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(missingNameDiagnostic, node.getTypeScriptMissingNodeDiagnosticSpan());
      return new TypeScriptMissingIdentifierNode(node.getTypeScriptMissingNodeSpan());
    }

    return typescriptParser.consumeName();
  }
}
