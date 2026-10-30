/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFunctionTypeNode } from "../../../models/nodes/types/typescript-function-type.node.js";

TypeScriptFunctionTypeNode.prototype.hasTypeScriptArrowFunctionBlockingParseError = function (this: TypeScriptFunctionTypeNode): boolean {
  return Object.isUndefined(this.parameterListNode.openParenthesisNode) || this.returnTypeNode.hasTypeScriptArrowFunctionBlockingParseError();
};
