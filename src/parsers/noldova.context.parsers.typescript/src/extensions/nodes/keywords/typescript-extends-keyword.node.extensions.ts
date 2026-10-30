/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";

TypeScriptExtendsKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptExtendsKeywordNode): boolean {
  return true;
};
