/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptEnumMemberNode } from "../../../models/nodes/declarations/typescript-enum-member.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { PropertyNameParser } from "../names/property-name.parser.js";

export class EnumMemberParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly propertyNameParser: PropertyNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.propertyNameParser = new PropertyNameParser(typescriptParser);
  }

  public parse(): TypeScriptEnumMemberNode {
    const parser = this.typescriptParser;
    const nameNode = this.propertyNameParser.parse();
    const equalsNode = parser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode) ? undefined : this.parseInitializer();
    const endNode = initializerNode ?? nameNode;
    const span = parser.typescriptLexer.reader.createSpan(nameNode.span, endNode.span);
    const resultNode = new TypeScriptEnumMemberNode(nameNode, span, equalsNode, initializerNode, nameNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }

  private parseInitializer(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptCommaNode || node instanceof TypeScriptCloseBraceNode)
      return node.reportTypeScriptMissingExpression(parser);
    const previousMemberInitializer = parser.context.isMemberInitializer;
    parser.context.isMemberInitializer = true;
    try {
      return parser.parseAssignmentExpression();
    }
    finally {
      parser.context.isMemberInitializer = previousMemberInitializer;
    }
  }
}
