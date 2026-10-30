/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexIdentityEscapeNode } from "../../../models/nodes/escapes/regex-identity-escape.node.js";

RegexIdentityEscapeNode.prototype.getRegexCharacterValue = function (this: RegexIdentityEscapeNode): number {
  return this.codePoint;
};
