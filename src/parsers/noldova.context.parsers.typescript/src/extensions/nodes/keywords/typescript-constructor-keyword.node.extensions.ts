/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptConstructorKeywordNode } from "../../../models/nodes/keywords/typescript-constructor-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptConstructorKeywordNode.prototype.isTypeScriptConstructorDeclarationStart = function (
  this: TypeScriptConstructorKeywordNode, _parser: TypeScriptSyntaxParser): this is TypeScriptConstructorKeywordNode {
  return true;
};
