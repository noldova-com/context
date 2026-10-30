/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMetaPropertyNode } from "../../../models/nodes/expressions/typescript-meta-property.node.js";

TypeScriptMetaPropertyNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptMetaPropertyNode): boolean {
  return true;
};
