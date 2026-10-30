/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBracketNode } from "../delimiters/typescript-close-bracket.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenBracketNode } from "../delimiters/typescript-open-bracket.node.js";
import { TypeScriptBindingPatternNode } from "./typescript-binding-pattern.node.js";

export class TypeScriptArrayBindingPatternNode extends TypeScriptBindingPatternNode {
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    elementNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(elementNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.openBracketNode = openBracketNode;
    this.closeBracketNode = closeBracketNode;
  }
}
