/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptCommaNode } from "../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDelimitedListNode } from "../../models/nodes/typescript-delimited-list.node.js";
import type { TypeScriptParserContext } from "../../models/typescript-parser-context.js";

declare module "../../models/nodes/typescript-delimited-list.node.js" {
  interface TypeScriptDelimitedListNode {
    getTypeScriptTrailingComma(): TypeScriptCommaNode | undefined;
    reportTypeScriptRestTrailingComma(context: TypeScriptParserContext): void;
  }
}

TypeScriptDelimitedListNode.prototype.getTypeScriptTrailingComma = function (this: TypeScriptDelimitedListNode): TypeScriptCommaNode | undefined {
  return this.commaNodes.length === this.children.length ? this.commaNodes.at(-1) : undefined;
};

TypeScriptDelimitedListNode.prototype.reportTypeScriptRestTrailingComma = function (this: TypeScriptDelimitedListNode, context: TypeScriptParserContext): void {
  const trailingCommaNode = this.getTypeScriptTrailingComma();
  if (!Object.isUndefined(trailingCommaNode) && this.children.at(-1)!.isTypeScriptRestElement())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1013, trailingCommaNode.span);
};
