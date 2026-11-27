/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceOrigin } from "./source-origin.js";

export class AddedFile {
  public readonly path: string;
  public readonly text: string;
  public readonly origin: SourceOrigin;

  public constructor(path: string, text: string, origin: SourceOrigin) {
    this.path = path;
    this.text = text;
    this.origin = origin;
  }
}
