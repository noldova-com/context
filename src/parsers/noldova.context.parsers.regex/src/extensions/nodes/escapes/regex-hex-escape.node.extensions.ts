/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexHexEscapeNode } from "../../../models/nodes/escapes/regex-hex-escape.node.js";

RegexHexEscapeNode.prototype.getRegexCharacterValue = function (this: RegexHexEscapeNode): number {
  return this.codePoint;
};
