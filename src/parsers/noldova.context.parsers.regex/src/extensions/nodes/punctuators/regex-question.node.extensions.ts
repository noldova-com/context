/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexQuestionNode } from "../../../models/nodes/punctuators/regex-question.node.js";
import { Resources } from "../../../resources.js";

RegexQuestionNode.prototype.parseRegexAtom = function (this: RegexQuestionNode): undefined {
  return undefined;
};

RegexQuestionNode.prototype.getRegexQuantifierMinimum = function (this: RegexQuestionNode): bigint {
  return Resources.zeroRepetitions;
};

RegexQuestionNode.prototype.getRegexQuantifierMaximum = function (this: RegexQuestionNode): bigint {
  return Resources.oneRepetition;
};
