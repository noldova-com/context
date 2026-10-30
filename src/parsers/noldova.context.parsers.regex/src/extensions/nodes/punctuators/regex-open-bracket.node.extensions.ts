/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexOpenBracketNode } from "../../../models/nodes/punctuators/regex-open-bracket.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexOpenBracketNode.prototype.parseRegexAtom = function (this: RegexOpenBracketNode, parser: RegexSyntaxParser): Node {
  return parser.parseCharacterClass();
};
