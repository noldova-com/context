/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptConstructorTypeNode } from "../../../models/nodes/types/typescript-constructor-type.node.js";

TypeScriptConstructorTypeNode.prototype.getTypeScriptThisParameterRejection = function (this: TypeScriptConstructorTypeNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS2681;
};

TypeScriptConstructorTypeNode.prototype.hasTypeScriptArrowFunctionBlockingParseError = function (this: TypeScriptConstructorTypeNode): boolean {
  return Object.isUndefined(this.parameterListNode.openParenthesisNode) || this.returnTypeNode.hasTypeScriptArrowFunctionBlockingParseError();
};
