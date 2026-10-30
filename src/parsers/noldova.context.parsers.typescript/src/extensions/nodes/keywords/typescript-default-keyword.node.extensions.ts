/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptDefaultClauseNode } from "../../../models/nodes/clauses/typescript-default-clause.node.js";
import { TypeScriptDecoratorNode } from "../../../models/nodes/declarations/typescript-decorator.node.js";
import { TypeScriptDefaultKeywordNode } from "../../../models/nodes/keywords/typescript-default-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDefaultKeywordNode.prototype.isTypeScriptSwitchClauseStart = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.reportTypeScriptUnexpectedStatementToken = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser,
  kind: TypeScriptListKind): void {
  if (kind === TypeScriptListKind.SourceElements)
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, this.span, [Resources.export]);
  else
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1128, this.span);
};

TypeScriptDefaultKeywordNode.prototype.parseTypeScriptSwitchClause = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptDefaultClauseNode {
  return parser.parseDefaultClause(this);
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.canParseTypeScriptDeclarationModifier = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser,
  writtenNodes: readonly Node[] = []): boolean {
  if (writtenNodes.length !== 0 && !(writtenNodes[0] instanceof TypeScriptDecoratorNode)
    && !(writtenNodes.findLast(t => !(t instanceof TypeScriptDecoratorNode)) instanceof TypeScriptExportKeywordNode))
    return false;

  return this.hasTypeScriptModifierFollower(parser);
};

TypeScriptDefaultKeywordNode.prototype.hasTypeScriptModifierFollower = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canFollowTypeScriptDefaultKeyword(parser);
  });
};

TypeScriptDefaultKeywordNode.prototype.canFollowTypeScriptExportKeyword = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.hasTypeScriptModifierFollower(parser);
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptExportFormStart = function (this: TypeScriptDefaultKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.parseTypeScriptExport = function (this: TypeScriptDefaultKeywordNode, parser: TypeScriptSyntaxParser, exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[]): Node {
  return parser.parseExportAssignment(exportKeywordNode, this, modifierNodes);
};

TypeScriptDefaultKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptDefaultKeywordNode): boolean {
  return true;
};

TypeScriptDefaultKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptDefaultKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.ModuleElement && context.isNamespaceBody && context.isModuleStatementList)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1319, this.span);
  else if ((writtenFlags & TypeScriptModifierFlags.Export) === TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span,
      [Resources.export, context.source.getText(this.span)]);

  return TypeScriptModifierFlags.None;
};
