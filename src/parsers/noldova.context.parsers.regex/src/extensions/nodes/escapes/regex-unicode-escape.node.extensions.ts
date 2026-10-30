/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexUnicodeEscapeNode } from "../../../models/nodes/escapes/regex-unicode-escape.node.js";

RegexUnicodeEscapeNode.prototype.getRegexCharacterValue = function (this: RegexUnicodeEscapeNode): number {
  return this.codePoint;
};
