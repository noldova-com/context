/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexAsteriskNode } from "../../../models/nodes/punctuators/regex-asterisk.node.js";
import { Resources } from "../../../resources.js";

RegexAsteriskNode.prototype.parseRegexAtom = function (this: RegexAsteriskNode): undefined {
  return undefined;
};

RegexAsteriskNode.prototype.getRegexQuantifierMinimum = function (this: RegexAsteriskNode): bigint {
  return Resources.zeroRepetitions;
};
