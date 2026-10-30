/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCarriageReturnEscapeNode } from "../../../models/nodes/escapes/regex-carriage-return-escape.node.js";
import { Resources } from "../../../resources.js";

RegexCarriageReturnEscapeNode.prototype.getRegexCharacterValue = function (this: RegexCarriageReturnEscapeNode): number {
  return Resources.carriageReturnCodePoint;
};
