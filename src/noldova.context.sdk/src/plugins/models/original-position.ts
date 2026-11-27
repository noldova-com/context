/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourcePosition } from "@noldova/context.parsers";

export class OriginalPosition {
  public readonly path: string;
  public readonly position: SourcePosition;

  public constructor(path: string, position: SourcePosition) {
    this.path = path;
    this.position = position;
  }
}
