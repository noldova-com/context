/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptUniqueKeywordNode } from "../../../models/nodes/keywords/typescript-unique-keyword.node.js";

TypeScriptUniqueKeywordNode.prototype.isTypeScriptTypeOperator = function (this: TypeScriptUniqueKeywordNode): boolean {
  return true;
};
