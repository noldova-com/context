/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptEnumKeywordNode } from "../../../models/nodes/keywords/typescript-enum-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptEnumKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptEnumKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return parser.parseEnumDeclaration(this, modifierNodes);
};

TypeScriptEnumKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptEnumKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
