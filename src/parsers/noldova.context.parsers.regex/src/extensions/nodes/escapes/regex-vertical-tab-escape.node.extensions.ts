/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexVerticalTabEscapeNode } from "../../../models/nodes/escapes/regex-vertical-tab-escape.node.js";
import { Resources } from "../../../resources.js";

RegexVerticalTabEscapeNode.prototype.getRegexCharacterValue = function (this: RegexVerticalTabEscapeNode): number {
  return Resources.verticalTabCodePoint;
};
