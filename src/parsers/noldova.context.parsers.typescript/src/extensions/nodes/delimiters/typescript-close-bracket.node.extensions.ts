/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";

TypeScriptCloseBracketNode.prototype.isTypeScriptClosingDelimiter = function (this: TypeScriptCloseBracketNode): boolean {
  return true;
};

TypeScriptCloseBracketNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptCloseBracketNode): boolean {
  return true;
};
