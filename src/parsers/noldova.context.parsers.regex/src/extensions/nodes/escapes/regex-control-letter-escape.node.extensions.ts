/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexControlLetterEscapeNode } from "../../../models/nodes/escapes/regex-control-letter-escape.node.js";

RegexControlLetterEscapeNode.prototype.getRegexCharacterValue = function (this: RegexControlLetterEscapeNode): number {
  return this.codePoint;
};
