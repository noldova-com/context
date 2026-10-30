/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptSemicolonNode.prototype.parseTypeScriptStatement = function (this: TypeScriptSemicolonNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseEmptyStatement(this);
};

TypeScriptSemicolonNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptSemicolonNode): boolean {
  return true;
};

TypeScriptSemicolonNode.prototype.canStartTypeScriptRecoveryStatement = function (this: TypeScriptSemicolonNode): boolean {
  return false;
};

TypeScriptSemicolonNode.prototype.canStartTypeScriptClassMember = function (this: TypeScriptSemicolonNode): boolean {
  return true;
};
