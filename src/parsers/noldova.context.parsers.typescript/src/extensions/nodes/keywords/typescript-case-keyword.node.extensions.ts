/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TypeScriptCaseClauseNode } from "../../../models/nodes/clauses/typescript-case-clause.node.js";
import { TypeScriptCaseKeywordNode } from "../../../models/nodes/keywords/typescript-case-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptCaseKeywordNode.prototype.isTypeScriptSwitchClauseStart = function (this: TypeScriptCaseKeywordNode): boolean {
  return true;
};

TypeScriptCaseKeywordNode.prototype.parseTypeScriptSwitchClause = function (this: TypeScriptCaseKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptCaseClauseNode {
  return parser.parseCaseClause(this);
};

TypeScriptCaseKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptCaseKeywordNode): boolean {
  return true;
};
