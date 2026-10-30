/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptIdentifierNode } from "../../../models/nodes/identifiers/typescript-identifier.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptIdentifierNode.prototype.toTypeScriptBindingName = function (this: TypeScriptIdentifierNode): TypeScriptIdentifierNode {
  return this;
};

TypeScriptIdentifierNode.prototype.isTypeScriptIdentifierName = function (this: TypeScriptIdentifierNode): boolean {
  return true;
};

TypeScriptIdentifierNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptIdentifierNode): boolean {
  return true;
};

TypeScriptIdentifierNode.prototype.isTypeScriptAccessName = function (this: TypeScriptIdentifierNode): boolean {
  return true;
};

TypeScriptIdentifierNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptIdentifierNode): boolean {
  return true;
};

TypeScriptIdentifierNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptIdentifierNode): this is TypeScriptIdentifierNode {
  return true;
};

TypeScriptIdentifierNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptIdentifierNode, parser: TypeScriptSyntaxParser): TypeScriptIdentifierNode {
  parser.consumeName();
  return this;
};

TypeScriptIdentifierNode.prototype.reportTypeScriptMissingSemicolon = function (this: TypeScriptIdentifierNode, parser: TypeScriptSyntaxParser): void {
  parser.reportMissingSemicolonAfterName(this);
};

TypeScriptIdentifierNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptIdentifierNode): boolean {
  return true;
};

TypeScriptIdentifierNode.prototype.isTypeScriptEvalOrArgumentsName = function (this: TypeScriptIdentifierNode): boolean {
  return this.value === Resources.eval || this.value === Resources.arguments;
};

TypeScriptIdentifierNode.prototype.readTypeScriptEvalOrArgumentsNames = function (this: TypeScriptIdentifierNode, parser: TypeScriptSyntaxParser): void {
  parser.readEvalOrArgumentsName(this);
};
