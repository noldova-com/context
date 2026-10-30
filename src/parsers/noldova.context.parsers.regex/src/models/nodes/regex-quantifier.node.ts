/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

export class RegexQuantifierNode extends ValueNode {
  public readonly minimum: bigint;
  public readonly maximum: bigint | undefined;
  public readonly greedy: boolean;

  public constructor(value: string, minimum: bigint, maximum: bigint | undefined, greedy: boolean, span: SourceSpan) {
    super(value, span);
    this.minimum = minimum;
    this.maximum = maximum;
    this.greedy = greedy;
  }
}
