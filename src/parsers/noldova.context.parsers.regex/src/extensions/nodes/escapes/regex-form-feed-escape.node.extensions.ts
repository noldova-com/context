/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexFormFeedEscapeNode } from "../../../models/nodes/escapes/regex-form-feed-escape.node.js";
import { Resources } from "../../../resources.js";

RegexFormFeedEscapeNode.prototype.getRegexCharacterValue = function (this: RegexFormFeedEscapeNode): number {
  return Resources.formFeedCodePoint;
};
