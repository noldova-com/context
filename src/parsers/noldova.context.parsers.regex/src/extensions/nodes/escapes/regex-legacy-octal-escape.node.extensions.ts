/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexLegacyOctalEscapeNode } from "../../../models/nodes/escapes/regex-legacy-octal-escape.node.js";

RegexLegacyOctalEscapeNode.prototype.getRegexCharacterValue = function (this: RegexLegacyOctalEscapeNode): number {
  return this.codePoint;
};
