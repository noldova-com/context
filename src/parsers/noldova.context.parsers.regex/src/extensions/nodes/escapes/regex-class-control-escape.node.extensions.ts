/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexClassControlEscapeNode } from "../../../models/nodes/escapes/regex-class-control-escape.node.js";

RegexClassControlEscapeNode.prototype.getRegexCharacterValue = function (this: RegexClassControlEscapeNode): number {
  return this.codePoint;
};
