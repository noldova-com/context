/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class IdentifierNameParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parseIdentifierOrStringName(): Node | undefined {
    if (this.typescriptParser.currentNode instanceof TypeScriptStringLiteralNode)
      return this.typescriptParser.consumeIdentifierName();
    return this.parseIdentifierName();
  }

  public parseIdentifierName(): Node | undefined {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node.isTypeScriptIdentifierName())
      return parser.consumeIdentifierName();
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, node.getTypeScriptMissingNodeDiagnosticSpan());
    return undefined;
  }

  public parseIdentifier(): Node | undefined {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node.isTypeScriptIdentifier(parser.context))
      return parser.consumeName();
    if (node instanceof TypeScriptPrivateIdentifierNode) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18016, node.span);
      return parser.consumeName();
    }
    if (node.isTypeScriptBindingIdentifier())
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, node.getTypeScriptMissingNodeDiagnosticSpan());
    else
      node.reportTypeScriptInvalidBindingName(parser);
    return undefined;
  }

  public parseBindingIdentifier(): Node | undefined {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node.isTypeScriptBindingIdentifier())
      return parser.consumeBindingName();
    if (node instanceof TypeScriptPrivateIdentifierNode) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18016, node.span);
      return parser.consumeBindingName();
    }
    node.reportTypeScriptInvalidBindingName(parser);
    return undefined;
  }
}
