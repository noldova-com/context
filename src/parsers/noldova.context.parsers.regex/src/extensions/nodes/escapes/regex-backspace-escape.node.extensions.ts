/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexBackspaceEscapeNode } from "../../../models/nodes/escapes/regex-backspace-escape.node.js";
import { Resources } from "../../../resources.js";

RegexBackspaceEscapeNode.prototype.getRegexCharacterValue = function (this: RegexBackspaceEscapeNode): number {
  return Resources.backspaceCodePoint;
};
