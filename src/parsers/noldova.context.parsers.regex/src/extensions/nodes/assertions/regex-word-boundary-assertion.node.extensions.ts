/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexWordBoundaryAssertionNode } from "../../../models/nodes/assertions/regex-word-boundary-assertion.node.js";

RegexWordBoundaryAssertionNode.prototype.isSimpleRegexAssertion = function (this: RegexWordBoundaryAssertionNode): boolean {
  return true;
};
