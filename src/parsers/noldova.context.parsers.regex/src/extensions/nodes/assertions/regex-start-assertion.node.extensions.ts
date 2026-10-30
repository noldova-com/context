/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexStartAssertionNode } from "../../../models/nodes/assertions/regex-start-assertion.node.js";

RegexStartAssertionNode.prototype.isSimpleRegexAssertion = function (this: RegexStartAssertionNode): boolean {
  return true;
};
