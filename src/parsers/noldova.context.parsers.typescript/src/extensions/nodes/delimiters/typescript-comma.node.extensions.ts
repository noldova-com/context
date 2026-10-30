/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";

TypeScriptCommaNode.prototype.canFollowTypeScriptOptionalParameterMarker = function (this: TypeScriptCommaNode): boolean {
  return true;
};

TypeScriptCommaNode.prototype.isTypeScriptFunctionTypeParameterIndicator = function (this: TypeScriptCommaNode): boolean {
  return true;
};

TypeScriptCommaNode.prototype.isTypeScriptIndexSignatureParameterIndicator = function (this: TypeScriptCommaNode): boolean {
  return true;
};

TypeScriptCommaNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptCommaNode): boolean {
  return true;
};

TypeScriptCommaNode.prototype.passesTypeScriptContextualTypeToRightOperand = function (this: TypeScriptCommaNode): boolean {
  return true;
};
