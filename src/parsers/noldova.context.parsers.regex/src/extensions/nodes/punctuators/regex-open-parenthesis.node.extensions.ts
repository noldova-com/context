/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexOpenParenthesisNode } from "../../../models/nodes/punctuators/regex-open-parenthesis.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexOpenParenthesisNode.prototype.parseRegexAtom = function (this: RegexOpenParenthesisNode, parser: RegexSyntaxParser): Node {
  return parser.parseGroup();
};
