/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexPlusNode } from "../../../models/nodes/punctuators/regex-plus.node.js";
import { Resources } from "../../../resources.js";

RegexPlusNode.prototype.parseRegexAtom = function (this: RegexPlusNode): undefined {
  return undefined;
};

RegexPlusNode.prototype.getRegexQuantifierMinimum = function (this: RegexPlusNode): bigint {
  return Resources.oneRepetition;
};
