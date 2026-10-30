/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import type { SourceSpan } from "../sources/source-span.js";
import { Node } from "./node.js";

export class EndOfFileNode extends Node {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);

    if (!span.isEmpty)
      throw new ArgumentException(Resources.endOfFileSpanInvalid, nameof<EndOfFileNode>(t => t.span));
  }
}
