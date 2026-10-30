/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTildeNode } from "../../../models/nodes/operators/typescript-tilde.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTildeNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptTildeNode): boolean {
  return true;
};

TypeScriptTildeNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptTildeNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};

TypeScriptTildeNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptTildeNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};
