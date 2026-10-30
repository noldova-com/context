/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptEqualsNode): boolean {
  return true;
};

TypeScriptEqualsNode.prototype.canFollowTypeScriptOptionalParameterMarker = function (this: TypeScriptEqualsNode): boolean {
  return true;
};

TypeScriptEqualsNode.prototype.isTypeScriptFunctionTypeParameterIndicator = function (this: TypeScriptEqualsNode): boolean {
  return true;
};

TypeScriptEqualsNode.prototype.parseTypeScriptExport = function (this: TypeScriptEqualsNode, parser: TypeScriptSyntaxParser, exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[]): Node {
  return parser.parseExportAssignment(exportKeywordNode, this, modifierNodes);
};

TypeScriptEqualsNode.prototype.isTypeScriptExportFormStart = function (this: TypeScriptEqualsNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
