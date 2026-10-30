/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMissingDeclarationNode } from "../../../models/nodes/declarations/typescript-missing-declaration.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";

TypeScriptMissingDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptMissingDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptMissingDeclarationNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptMissingDeclarationNode): boolean {
  return true;
};

TypeScriptMissingDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptMissingDeclarationNode): boolean {
  return true;
};
