/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";
import { ReadOnlyStringSpan } from "@noldova/context.text";

import { InvalidSpanException } from "../../exceptions/invalid-span.exception.js";
import type { SourceSpan } from "./source-span.js";

export class Source {
  public readonly content: string;
  public readonly identity: string | undefined;
  public readonly length: number;

  public constructor(content: string, identity?: string) {
    if (!Object.isUndefined(identity))
      ArgumentException.throwIfNullOrWhitespace(identity, nameof<Source>(t => t.identity));

    this.content = content;
    this.identity = identity;
    this.length = this.content.length;
  }

  public getSpan(span: SourceSpan): ReadOnlyStringSpan;
  public getSpan(startOffset: number, length: number): ReadOnlyStringSpan;
  public getSpan(startOrSpan: number | SourceSpan, length: number = 0): ReadOnlyStringSpan {
    if (!Object.isNumber(startOrSpan))
      return this.getSpan(startOrSpan.startOffset, startOrSpan.length);

    InvalidSpanException.throwIfInvalid(startOrSpan, length, this.length);
    return new ReadOnlyStringSpan(this.content, startOrSpan, length);
  }

  public getText(span: SourceSpan): string;
  public getText(startOffset: number, length: number): string;
  public getText(startOrSpan: number | SourceSpan, length: number = 0): string {
    if (!Object.isNumber(startOrSpan))
      return this.getText(startOrSpan.startOffset, startOrSpan.length);

    InvalidSpanException.throwIfInvalid(startOrSpan, length, this.length);
    return this.content.slice(startOrSpan, startOrSpan + length);
  }
}
