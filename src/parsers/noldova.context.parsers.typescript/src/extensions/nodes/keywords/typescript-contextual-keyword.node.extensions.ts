/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextualKeywordNode } from "../../../models/nodes/keywords/typescript-contextual-keyword.node.js";

TypeScriptContextualKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptContextualKeywordNode): this is TypeScriptContextualKeywordNode {
  return true;
};
