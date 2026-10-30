/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";

TypeScriptCloseBraceNode.prototype.isTypeScriptClosingDelimiter = function (this: TypeScriptCloseBraceNode): boolean {
  return true;
};

TypeScriptCloseBraceNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptCloseBraceNode): boolean {
  return true;
};
