/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexClassStringDisjunctionNode } from "../../../models/nodes/classes/regex-class-string-disjunction.node.js";

RegexClassStringDisjunctionNode.prototype.mayContainRegexStrings = function (this: RegexClassStringDisjunctionNode): boolean {
  return this.mayContainStrings;
};
