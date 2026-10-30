/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

export class TypeScriptMissingDeclarationNode extends Node {
  public readonly modifierNodes: readonly Node[];

  public constructor(modifierNodes: readonly Node[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
  }
}
