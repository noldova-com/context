/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexEndAssertionNode } from "../../../models/nodes/assertions/regex-end-assertion.node.js";

RegexEndAssertionNode.prototype.isSimpleRegexAssertion = function (this: RegexEndAssertionNode): boolean {
  return true;
};
