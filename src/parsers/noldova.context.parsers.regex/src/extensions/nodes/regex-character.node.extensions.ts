/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";

RegexCharacterNode.prototype.getRegexCharacterValue = function (this: RegexCharacterNode): number | undefined {
  return this.value.codePointAt(0);
};
