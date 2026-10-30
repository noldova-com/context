/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptUnknownNode } from "../../models/nodes/typescript-unknown.node.js";

TypeScriptUnknownNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptUnknownNode): boolean {
  return true;
};
