/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNewlineEscapeNode } from "../../../models/nodes/escapes/regex-newline-escape.node.js";
import { Resources } from "../../../resources.js";

RegexNewlineEscapeNode.prototype.getRegexCharacterValue = function (this: RegexNewlineEscapeNode): number {
  return Resources.newlineCodePoint;
};
