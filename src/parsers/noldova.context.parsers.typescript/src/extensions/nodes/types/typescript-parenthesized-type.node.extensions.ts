/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParenthesizedTypeNode } from "../../../models/nodes/types/typescript-parenthesized-type.node.js";

TypeScriptParenthesizedTypeNode.prototype.hasTypeScriptArrowFunctionBlockingParseError = function (this: TypeScriptParenthesizedTypeNode): boolean {
  return this.typeNode.hasTypeScriptArrowFunctionBlockingParseError();
};
