/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNullEscapeNode } from "../../../models/nodes/escapes/regex-null-escape.node.js";
import { Resources } from "../../../resources.js";

RegexNullEscapeNode.prototype.getRegexCharacterValue = function (this: RegexNullEscapeNode): number {
  return Resources.nullCodePoint;
};
