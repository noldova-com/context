/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";

TypeScriptColonNode.prototype.canFollowTypeScriptOptionalParameterMarker = function (this: TypeScriptColonNode): boolean {
  return true;
};

TypeScriptColonNode.prototype.isTypeScriptFunctionTypeParameterIndicator = function (this: TypeScriptColonNode): boolean {
  return true;
};

TypeScriptColonNode.prototype.isTypeScriptIndexSignatureParameterIndicator = function (this: TypeScriptColonNode): boolean {
  return true;
};

TypeScriptColonNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptColonNode): boolean {
  return true;
};
