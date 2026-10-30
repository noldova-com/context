/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSlashEqualsNode } from "../../../models/nodes/operators/typescript-slash-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptSlashEqualsNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptSlashEqualsNode): boolean {
  return true;
};

TypeScriptSlashEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptSlashEqualsNode): boolean {
  return true;
};

TypeScriptSlashEqualsNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptSlashEqualsNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseRegularExpression();
};

TypeScriptSlashEqualsNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptSlashEqualsNode): boolean {
  return true;
};
