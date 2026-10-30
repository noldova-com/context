/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptCaretNode } from "../../../models/nodes/operators/typescript-caret.node.js";

TypeScriptCaretNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptCaretNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.BitwiseXor;
};

TypeScriptCaretNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptCaretNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
