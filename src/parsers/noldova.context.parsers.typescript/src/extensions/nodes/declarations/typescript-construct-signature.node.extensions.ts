/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptConstructSignatureNode } from "../../../models/nodes/declarations/typescript-construct-signature.node.js";

TypeScriptConstructSignatureNode.prototype.getTypeScriptThisParameterRejection = function (this: TypeScriptConstructSignatureNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS2681;
};
