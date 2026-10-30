/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDeclarationListHolder } from "../../../enums/typescript-declaration-list-holder.js";
import { TypeScriptForStatementNode } from "../../../models/nodes/statements/typescript-for-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptForStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptForStatementNode, context: TypeScriptParserContext): void {
  this.initializerNode?.readTypeScriptDeclarations(context, TypeScriptDeclarationListHolder.ForHeader);
  this.initializerNode?.reportTypeScriptAmbientResourceDeclaration(context);
};

TypeScriptForStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptForStatementNode): SourceSpan {
  return this.forKeywordNode.span;
};
