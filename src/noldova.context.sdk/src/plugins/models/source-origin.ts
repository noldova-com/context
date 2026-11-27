/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import type { SourceFile } from "./source-file.js";

export class SourceOrigin {
  public readonly source: SourceFile;
  public readonly span: SourceSpan;

  public constructor(source: SourceFile, span: SourceSpan) {
    this.source = source;
    this.span = span;
  }
}
