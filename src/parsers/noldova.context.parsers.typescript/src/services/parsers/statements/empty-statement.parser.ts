/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptEmptyStatementNode } from "../../../models/nodes/statements/typescript-empty-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class EmptyStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(semicolonNode: TypeScriptSemicolonNode): TypeScriptEmptyStatementNode {
    this.typescriptParser.advance();
    return new TypeScriptEmptyStatementNode(semicolonNode, semicolonNode.span, semicolonNode.leadingTrivia, semicolonNode.trailingTrivia);
  }
}
