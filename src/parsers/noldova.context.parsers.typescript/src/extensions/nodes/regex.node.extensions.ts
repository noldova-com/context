/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNode } from "@noldova/context.parsers.regex";

RegexNode.prototype.isTypeScriptLeftHandSideExpression = function (this: RegexNode): boolean {
  return true;
};
