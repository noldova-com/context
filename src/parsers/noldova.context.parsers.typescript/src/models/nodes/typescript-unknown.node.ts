/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { ValueNode } from "@noldova/context.parsers";

export class TypeScriptUnknownNode extends ValueNode {
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(value, span, leadingTrivia, trailingTrivia);
  }
}
