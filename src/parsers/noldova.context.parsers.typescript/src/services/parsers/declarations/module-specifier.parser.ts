/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ModuleSpecifierParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptStringLiteralNode)
      return parser.consumeName();
    if (parser.isEndOfFile || node.isTypeScriptClosingDelimiter() || node instanceof TypeScriptSemicolonNode)
      return node.reportTypeScriptMissingExpression(parser);
    return parser.parseExpression();
  }
}
