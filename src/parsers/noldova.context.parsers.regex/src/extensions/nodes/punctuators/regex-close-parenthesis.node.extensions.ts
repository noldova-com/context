/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCloseParenthesisNode } from "../../../models/nodes/punctuators/regex-close-parenthesis.node.js";

RegexCloseParenthesisNode.prototype.parseRegexAtom = function (this: RegexCloseParenthesisNode): undefined {
  return undefined;
};
