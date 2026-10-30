/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexClassUnionNode } from "../../../models/nodes/classes/regex-class-union.node.js";

RegexClassUnionNode.prototype.mayContainRegexStrings = function (this: RegexClassUnionNode): boolean {
  return this.children.some(t => t.mayContainRegexStrings());
};
