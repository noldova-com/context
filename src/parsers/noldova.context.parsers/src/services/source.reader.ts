/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReadOnlyStringSpan } from "@noldova/context.text";

import { InvalidSpanException } from "../exceptions/invalid-span.exception.js";
import { SourceSpan } from "../models/sources/source-span.js";
import type { Source } from "../models/sources/source.js";
import { Resources } from "../resources.js";

export class SourceReader {
  private offset: number;

  public readonly endOffset: number;
  public readonly source: Source;
  public readonly startOffset: number;

  public constructor(source: Source, span?: SourceSpan) {
    const startOffset = span?.startOffset ?? 0;
    const length = span?.length ?? source.length;
    InvalidSpanException.throwIfInvalid(startOffset, length, source.length);

    this.source = source;
    this.startOffset = startOffset;
    this.endOffset = startOffset + length;
    this.offset = startOffset;
  }

  public get currentOffset(): number {
    return this.offset;
  }

  public get isAtEnd(): boolean {
    return this.offset >= this.endOffset;
  }

  public peekCodeUnit(): string;
  public peekCodeUnit(relativeOffset: number): string;
  public peekCodeUnit(relativeOffset: number = 0): string {
    const offset = this.offset + relativeOffset;
    if (offset < this.startOffset || offset >= this.endOffset)
      return Resources.endOfInputCodeUnit;

    return this.source.content.charAt(offset);
  }

  public peekCodePoint(): number {
    if (this.isAtEnd)
      return Resources.endOfInputCodePoint;

    if (this.offset + Resources.utf16CodeUnitLength >= this.endOffset)
      return this.source.content.charCodeAt(this.offset);

    return this.source.content.codePointAt(this.offset)!;
  }

  public readCodeUnit(): string {
    if (this.isAtEnd)
      return Resources.endOfInputCodeUnit;

    const character = this.source.content.charAt(this.offset);
    this.offset++;
    return character;
  }

  public readCodePoint(): number {
    const codePoint = this.peekCodePoint();
    if (!this.isAtEnd)
      this.offset += codePoint > Resources.maximumUtf16CodeUnit ? Resources.utf16SurrogatePairLength : Resources.utf16CodeUnitLength;

    return codePoint;
  }

  public advance(count: number = 1): void {
    this.offset = Math.min(this.offset + count, this.endOffset);
  }

  public seek(offset: number): void {
    this.offset = offset;
  }

  public startsWith(text: string): boolean {
    if (this.offset + text.length > this.endOffset)
      return false;

    return this.source.content.startsWith(text, this.offset);
  }

  public readWhile(predicate: (character: string) => boolean): ReadOnlyStringSpan {
    const startOffset = this.offset;

    while (!this.isAtEnd && predicate(this.source.content.charAt(this.offset)))
      this.offset++;

    return this.source.getSpan(startOffset, this.offset - startOffset);
  }

  public readUntil(predicate: (character: string) => boolean): ReadOnlyStringSpan {
    const startOffset = this.offset;

    while (!this.isAtEnd && !predicate(this.source.content.charAt(this.offset)))
      this.offset++;

    return this.source.getSpan(startOffset, this.offset - startOffset);
  }

  public peekWhile(predicate: (character: string) => boolean): ReadOnlyStringSpan {
    let length = 0;

    while (this.offset + length < this.endOffset && predicate(this.source.content.charAt(this.offset + length)))
      length++;

    return new ReadOnlyStringSpan(this.source.content, this.offset, length);
  }

  public createSpan(startOffset: number, length: number): SourceSpan;
  public createSpan(startSpan: SourceSpan, endSpan: SourceSpan): SourceSpan;
  public createSpan(startOrSpan: number | SourceSpan, lengthOrSpan: number | SourceSpan): SourceSpan {
    const startOffset = Object.isNumber(startOrSpan) ? startOrSpan : startOrSpan.startOffset;
    const length = Object.isNumber(lengthOrSpan) ? lengthOrSpan : lengthOrSpan.endOffset - startOffset;

    return new SourceSpan(startOffset, length);
  }
}
