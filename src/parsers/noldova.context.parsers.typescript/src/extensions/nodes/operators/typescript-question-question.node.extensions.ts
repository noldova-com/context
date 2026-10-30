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
import { TypeScriptQuestionQuestionNode } from "../../../models/nodes/operators/typescript-question-question.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptQuestionQuestionNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptQuestionQuestionNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.NullishCoalescing;
};

TypeScriptQuestionQuestionNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptQuestionQuestionNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptQuestionQuestionNode.prototype.validateTypeScriptBinaryOperands = function (
  this: TypeScriptQuestionQuestionNode,
  context: TypeScriptParserContext,
  leftNode: Node,
  rightNode: Node): void {
  const leftLogicalOperatorNode = leftNode.getTypeScriptLogicalOperatorNode();
  if (!Object.isUndefined(leftLogicalOperatorNode)) {
    const value = leftLogicalOperatorNode.value;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS5076, leftNode.span, [value, Resources.questionQuestion]);
    return;
  }

  const rightLogicalOperatorNode = rightNode.getTypeScriptLogicalOperatorNode();
  if (Object.isUndefined(rightLogicalOperatorNode))
    return;

  const value = rightLogicalOperatorNode.value;
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS5076, rightNode.span, [Resources.questionQuestion, value]);
};

TypeScriptQuestionQuestionNode.prototype.passesTypeScriptContextualTypeToRightOperand = function (this: TypeScriptQuestionQuestionNode): boolean {
  return true;
};

TypeScriptQuestionQuestionNode.prototype.passesTypeScriptContextualTypeToLeftOperand = function (this: TypeScriptQuestionQuestionNode): boolean {
  return true;
};

TypeScriptQuestionQuestionNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptQuestionQuestionNode, parser: TypeParser): Node {
  return parser.parseNestedNullableType();
};
