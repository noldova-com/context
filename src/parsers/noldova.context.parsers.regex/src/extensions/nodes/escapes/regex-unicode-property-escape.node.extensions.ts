/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexUnicodePropertyEscapeNode } from "../../../models/nodes/escapes/regex-unicode-property-escape.node.js";

RegexUnicodePropertyEscapeNode.prototype.mayContainRegexStrings = function (this: RegexUnicodePropertyEscapeNode): boolean {
  return this.mayContainStrings;
};
