/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptElseKeywordNode } from "../../../models/nodes/keywords/typescript-else-keyword.node.js";

TypeScriptElseKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptElseKeywordNode): boolean {
  return true;
};
