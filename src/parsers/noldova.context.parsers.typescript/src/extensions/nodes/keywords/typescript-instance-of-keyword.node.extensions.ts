/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptInstanceOfKeywordNode } from "../../../models/nodes/keywords/typescript-instance-of-keyword.node.js";

TypeScriptInstanceOfKeywordNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptInstanceOfKeywordNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptInstanceOfKeywordNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptInstanceOfKeywordNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
