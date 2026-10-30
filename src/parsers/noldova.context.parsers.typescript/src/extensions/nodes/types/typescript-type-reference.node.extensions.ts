/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptTypeReferenceNode } from "../../../models/nodes/types/typescript-type-reference.node.js";

TypeScriptTypeReferenceNode.prototype.isTypeScriptConstReference = function (this: TypeScriptTypeReferenceNode): boolean {
  return this.nameNode instanceof TypeScriptConstKeywordNode && Object.isUndefined(this.typeArgumentListNode);
};
