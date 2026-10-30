/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBarBarNode } from "../../../models/nodes/operators/typescript-bar-bar.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptBarBarNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptBarBarNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.LogicalOr;
};

TypeScriptBarBarNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptBarBarNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptBarBarNode.prototype.isTypeScriptLogicalOperator = function (this: TypeScriptBarBarNode): this is TypeScriptBarBarNode {
  return true;
};

TypeScriptBarBarNode.prototype.passesTypeScriptContextualTypeToRightOperand = function (this: TypeScriptBarBarNode): boolean {
  return true;
};

TypeScriptBarBarNode.prototype.passesTypeScriptContextualTypeToLeftOperand = function (this: TypeScriptBarBarNode): boolean {
  return true;
};

TypeScriptBarBarNode.prototype.validateTypeScriptBinaryOperands = function (
  this: TypeScriptBarBarNode,
  context: TypeScriptParserContext,
  leftNode: Node,
  _rightNode: Node): void {
  if (!Object.isUndefined(leftNode.getTypeScriptNullishOperatorNode()))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS5076, leftNode.span, [Resources.questionQuestion, this.value]);
};
