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
import { TypeScriptSlashNode } from "../../../models/nodes/operators/typescript-slash.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptSlashNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptSlashNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Multiplicative;
};

TypeScriptSlashNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptSlashNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptSlashNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptSlashNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseRegularExpression();
};

TypeScriptSlashNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptSlashNode): boolean {
  return true;
};
