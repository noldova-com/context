/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

export class SourceEdit {
  public readonly span: SourceSpan;
  public readonly text: string;
  public readonly plugin: string;

  public constructor(span: SourceSpan, text: string, plugin: string) {
    this.span = span;
    this.text = text;
    this.plugin = plugin;
  }
}
