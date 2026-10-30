/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptAmpersandNode } from "../../../models/nodes/operators/typescript-ampersand.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAmpersandNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptAmpersandNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.BitwiseAnd;
};

TypeScriptAmpersandNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptAmpersandNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptAmpersandNode.prototype.canStartTypeScriptType = function (this: TypeScriptAmpersandNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
