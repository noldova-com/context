/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, Source, SourceReader } from "@noldova/context.parsers";

import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import { TypeScriptStringValueReader } from "../../../services/lexers/readers/typescript-string-value.reader.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptStringLiteralNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.isTypeScriptConstructorDeclarationStart = function (
  this: TypeScriptStringLiteralNode, parser: TypeScriptSyntaxParser): this is TypeScriptStringLiteralNode {
  const value = new TypeScriptStringValueReader().read(new SourceReader(parser.context.source, this.span));
  return value === Resources.constructorKeyword && parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptOpenParenthesisNode;
  });
};

TypeScriptStringLiteralNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.isTypeScriptModuleExportName = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptStringLiteralNode, parser: TypeScriptSyntaxParser): TypeScriptStringLiteralNode {
  parser.advance();
  return this;
};

TypeScriptStringLiteralNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptStringLiteralNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptStringLiteralNode.prototype.isTypeScriptStringOrNumericLiteral = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};

TypeScriptStringLiteralNode.prototype.getTypeScriptEffectivePropertyName = function (this: TypeScriptStringLiteralNode, context: TypeScriptParserContext): string | undefined {
  return new TypeScriptStringValueReader().read(new SourceReader(context.source, this.span));
};

TypeScriptStringLiteralNode.prototype.getTypeScriptDiagnosticText = function (this: TypeScriptStringLiteralNode): string {
  return new TypeScriptStringValueReader().readTokenValue(new SourceReader(new Source(this.value)));
};

TypeScriptStringLiteralNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptStringLiteralNode): boolean {
  return true;
};
