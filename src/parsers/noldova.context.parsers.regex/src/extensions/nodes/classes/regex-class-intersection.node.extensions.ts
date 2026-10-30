/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexClassIntersectionNode } from "../../../models/nodes/classes/regex-class-intersection.node.js";

RegexClassIntersectionNode.prototype.mayContainRegexStrings = function (this: RegexClassIntersectionNode): boolean {
  return this.children.every(t => t.mayContainRegexStrings());
};
