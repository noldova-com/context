/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly characterIndexInvalid: string = "The character index must be a non-negative safe integer within the requested line.";
  public static readonly currentNodeTypeInvalid: string = "The current node does not match the type required by the recognized grammar branch.";
  public static readonly endOfInputCodePoint: number = 0;
  public static readonly endOfInputCodeUnit: string = "\0";
  public static readonly endOfFileSpanInvalid: string = "An end-of-file node must have an empty text span.";
  public static readonly lexerEndOfFileInvalid: string = "An end-of-file node must identify the reader's current end position.";
  public static readonly lexerEndOfFileRequired: string = "A stationary lexer at the end of its source region must produce EndOfFileNode.";
  public static readonly lineEndInvalid: string = "The line end offset must be a safe integer greater than or equal to its start offset.";
  public static readonly lineIndexInvalid: string = "The line index must be a non-negative safe integer.";
  public static readonly lineStartInvalid: string = "The line start offset must be a non-negative safe integer.";
  public static readonly maximumUtf16CodeUnit: number = 0xFFFF;
  public static readonly parserAlreadyUsed: string = "The parser session has already been used.";
  public static readonly parserInputRemains: string = "The parser cannot publish a result while input remains unconsumed.";
  public static readonly parserLexerCollectorInvalid: string = "The lexer must report to the parser context's diagnostic collector.";
  public static readonly utf16CodeUnitLength: number = 1;
  public static readonly utf16SurrogatePairLength: number = 2;

  public static invalidOffset(offset: number, minimumOffset: number, maximumOffset: number): string {
    return `Offset ${offset} is outside the permitted range from ${minimumOffset} through ${maximumOffset}.`;
  }

  public static invalidSpan(startOffset: number, length: number, sourceLength: number): string {
    return `Span [${startOffset}, ${startOffset + length}) is outside the source length ${sourceLength}.`;
  }

  public static lexerDidNotAdvance(offset: number): string {
    return `The lexer did not advance from source offset ${offset}.`;
  }

  public static lineOutOfBounds(lineIndex: number, lineCount: number): string {
    return `Line index ${lineIndex} is outside the source line count ${lineCount}.`;
  }
}
