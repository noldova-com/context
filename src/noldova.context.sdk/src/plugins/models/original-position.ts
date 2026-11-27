/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourcePosition } from "@noldova/context.parsers";

import type { SourceText } from "./source-text.js";

export class OriginalPosition {
  public readonly source: SourceText;
  public readonly position: SourcePosition;

  public constructor(source: SourceText, position: SourcePosition) {
    this.source = source;
    this.position = position;
  }
}
