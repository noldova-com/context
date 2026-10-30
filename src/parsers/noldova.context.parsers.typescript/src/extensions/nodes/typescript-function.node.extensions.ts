/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptExportKeywordNode } from "../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptFunctionNode } from "../../models/nodes/typescript-function.node.js";
import type { TypeScriptParserContext } from "../../models/typescript-parser-context.js";

TypeScriptFunctionNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptFunctionNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptFunctionNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptFunctionNode,
  _context: TypeScriptParserContext): SourceSpan {
  return this.nameNode?.span ?? this.modifierNodes[0]?.span ?? this.functionKeywordNode.span;
};

TypeScriptFunctionNode.prototype.hasTypeScriptBody = function (this: TypeScriptFunctionNode): boolean {
  return this.bodyNode?.isTypeScriptPresent() === true;
};
