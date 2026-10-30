/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

export class RegexBackreferenceNode extends ValueNode {
  public readonly groupIndex: number;

  public constructor(value: string, groupIndex: number, span: SourceSpan) {
    super(value, span);
    this.groupIndex = groupIndex;
  }
}
