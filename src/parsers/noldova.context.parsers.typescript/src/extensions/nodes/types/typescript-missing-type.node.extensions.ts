/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMissingTypeNode } from "../../../models/nodes/types/typescript-missing-type.node.js";

TypeScriptMissingTypeNode.prototype.hasTypeScriptArrowFunctionBlockingParseError = function (this: TypeScriptMissingTypeNode): boolean {
  return true;
};
