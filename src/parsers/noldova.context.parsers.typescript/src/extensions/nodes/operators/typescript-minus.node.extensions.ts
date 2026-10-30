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
import { TypeScriptBigIntLiteralNode } from "../../../models/nodes/literals/typescript-big-int-literal.node.js";
import { TypeScriptNumericLiteralNode } from "../../../models/nodes/literals/typescript-numeric-literal.node.js";
import { TypeScriptMinusNode } from "../../../models/nodes/operators/typescript-minus.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptMinusNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptMinusNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Additive;
};

TypeScriptMinusNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptMinusNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptMinusNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptMinusNode): boolean {
  return true;
};

TypeScriptMinusNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptMinusNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};

TypeScriptMinusNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptMinusNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptMinusNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptMinusNode): boolean {
  return false;
};

TypeScriptMinusNode.prototype.canStartTypeScriptType = function (this: TypeScriptMinusNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptNumericLiteralNode || parser.currentNode instanceof TypeScriptBigIntLiteralNode;
  });
};

TypeScriptMinusNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptMinusNode, parser: TypeParser): Node {
  return parser.parseNegativeLiteralType(this);
};
