/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterClassNode } from "../../../models/nodes/classes/regex-character-class.node.js";

RegexCharacterClassNode.prototype.mayContainRegexStrings = function (this: RegexCharacterClassNode): boolean {
  return this.mayContainStrings;
};
