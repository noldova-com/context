/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFromKeywordNode } from "../../../models/nodes/keywords/typescript-from-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptFromKeywordNode.prototype.startsTypeScriptFromClause = function (this: TypeScriptFromKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptStringLiteralNode;
  });
};
