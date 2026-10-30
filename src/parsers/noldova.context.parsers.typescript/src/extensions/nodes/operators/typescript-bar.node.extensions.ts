/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptBarNode } from "../../../models/nodes/operators/typescript-bar.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptBarNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptBarNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.BitwiseOr;
};

TypeScriptBarNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptBarNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptBarNode.prototype.canStartTypeScriptType = function (this: TypeScriptBarNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
