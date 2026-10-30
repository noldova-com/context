/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAsteriskNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptAsteriskNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Multiplicative;
};

TypeScriptAsteriskNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptAsteriskNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptAsteriskNode.prototype.canFollowTypeScriptModifier = function (this: TypeScriptAsteriskNode): boolean {
  return true;
};

TypeScriptAsteriskNode.prototype.canStartTypeScriptType = function (this: TypeScriptAsteriskNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptAsteriskNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptAsteriskNode, parser: TypeParser): Node {
  return parser.parseWildcardType(this);
};

TypeScriptAsteriskNode.prototype.canStartTypeScriptClassMember = function (this: TypeScriptAsteriskNode): boolean {
  return true;
};

TypeScriptAsteriskNode.prototype.isTypeScriptExportClauseStart = function (this: TypeScriptAsteriskNode): boolean {
  return true;
};
