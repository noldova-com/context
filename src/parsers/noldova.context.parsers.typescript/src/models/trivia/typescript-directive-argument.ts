/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

export class TypeScriptDirectiveArgument {
  public readonly span: SourceSpan;
  public readonly value: string;

  public constructor(value: string, span: SourceSpan) {
    this.value = value;
    this.span = span;
  }
}
