/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexClassSubtractionNode } from "../../../models/nodes/classes/regex-class-subtraction.node.js";

RegexClassSubtractionNode.prototype.mayContainRegexStrings = function (this: RegexClassSubtractionNode): boolean {
  return this.children[0].mayContainRegexStrings();
};
