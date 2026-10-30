/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";

export class RegexClassSubtractionNode extends CompositeNode {
  public declare readonly children: readonly [Node, ...Node[]];

  public constructor(operands: readonly Node[], span: SourceSpan) {
    ArgumentException.throwIfEmpty(operands, Resources.operandsParameterName);
    super([...operands], span);
  }
}
