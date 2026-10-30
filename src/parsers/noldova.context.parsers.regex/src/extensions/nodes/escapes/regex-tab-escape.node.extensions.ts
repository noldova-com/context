/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexTabEscapeNode } from "../../../models/nodes/escapes/regex-tab-escape.node.js";
import { Resources } from "../../../resources.js";

RegexTabEscapeNode.prototype.getRegexCharacterValue = function (this: RegexTabEscapeNode): number {
  return Resources.tabCodePoint;
};
