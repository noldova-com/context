/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import { TypeScriptImportTypeNode } from "../../../models/nodes/types/typescript-import-type.node.js";
import { TypeScriptLiteralTypeNode } from "../../../models/nodes/types/typescript-literal-type.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptImportTypeNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptImportTypeNode, context: TypeScriptParserContext): void {
  const argumentNode = this.argumentNode;
  if (!(argumentNode instanceof TypeScriptLiteralTypeNode && argumentNode.literalNode instanceof TypeScriptStringLiteralNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1141, argumentNode.span);
};
