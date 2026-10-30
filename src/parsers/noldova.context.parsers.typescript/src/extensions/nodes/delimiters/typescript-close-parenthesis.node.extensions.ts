/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";

TypeScriptCloseParenthesisNode.prototype.canFollowTypeScriptOptionalParameterMarker = function (this: TypeScriptCloseParenthesisNode): boolean {
  return true;
};

TypeScriptCloseParenthesisNode.prototype.isTypeScriptClosingDelimiter = function (this: TypeScriptCloseParenthesisNode): boolean {
  return true;
};

TypeScriptCloseParenthesisNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptCloseParenthesisNode): boolean {
  return true;
};
