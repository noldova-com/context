/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDeferKeywordNode } from "../../../models/nodes/keywords/typescript-defer-keyword.node.js";
import { TypeScriptFromKeywordNode } from "../../../models/nodes/keywords/typescript-from-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDeferKeywordNode.prototype.isTypeScriptImportPhase = function (this: TypeScriptDeferKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptDeferKeywordNode {
  if (parser.currentNode instanceof TypeScriptFromKeywordNode)
    return !parser.lookAhead(() => {
      parser.advance();
      return parser.currentNode instanceof TypeScriptStringLiteralNode;
    });
  return !(parser.currentNode instanceof TypeScriptCommaNode) && !(parser.currentNode instanceof TypeScriptEqualsNode);
};
