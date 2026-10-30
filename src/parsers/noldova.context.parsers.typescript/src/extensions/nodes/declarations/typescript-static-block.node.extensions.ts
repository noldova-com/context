/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptStaticBlockNode } from "../../../models/nodes/declarations/typescript-static-block.node.js";

TypeScriptStaticBlockNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptStaticBlockNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS1184;
};
