/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNonWordBoundaryAssertionNode } from "../../../models/nodes/assertions/regex-non-word-boundary-assertion.node.js";

RegexNonWordBoundaryAssertionNode.prototype.isSimpleRegexAssertion = function (this: RegexNonWordBoundaryAssertionNode): boolean {
  return true;
};
