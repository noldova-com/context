/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptQuestionQuestionEqualsNode } from "../../../models/nodes/operators/typescript-question-question-equals.node.js";

TypeScriptQuestionQuestionEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptQuestionQuestionEqualsNode): boolean {
  return true;
};
