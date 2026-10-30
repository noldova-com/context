/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { InvalidSpanException, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourceReaderTests {
  @TestMethod
  public startsAtTheBeginningWithoutLanguageSpecificConsumption(): void {
    const source = new Source("#!/usr/bin/env node\nvalue");
    const reader = new SourceReader(source);

    Assert.areEqual(source, reader.source);
    Assert.areEqual(0, reader.startOffset);
    Assert.areEqual(source.length, reader.endOffset);
    Assert.areEqual(0, reader.currentOffset);
    Assert.isFalse(reader.isAtEnd);
    Assert.areEqual("#", reader.peekCodeUnit());
  }

  @TestMethod
  public startsAtTheBeginningOfABoundedSourceRegion(): void {
    const source = new Source("prefixbodysuffix");
    const reader = new SourceReader(source, new SourceSpan(6, 4));

    Assert.areEqual(source, reader.source);
    Assert.areEqual(6, reader.startOffset);
    Assert.areEqual(10, reader.endOffset);
    Assert.areEqual(6, reader.currentOffset);
    Assert.isFalse(reader.isAtEnd);
    Assert.areEqual("b", reader.peekCodeUnit());
    Assert.areEqual("body", reader.readWhile(() => true).toString());
    Assert.areEqual(10, reader.currentOffset);
    Assert.isTrue(reader.isAtEnd);
    Assert.areEqual("\0", reader.peekCodeUnit());
  }

  @TestMethod
  public acceptsAnEmptyBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("source"), new SourceSpan(3, 0));

    Assert.areEqual(3, reader.startOffset);
    Assert.areEqual(3, reader.endOffset);
    Assert.areEqual(3, reader.currentOffset);
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public rejectsABoundedRegionOutsideTheSource(): void {
    const source = new Source("source");

    Assert.throws(() => new SourceReader(source, new SourceSpan(4, 3)), InvalidSpanException);
  }

  @TestMethod
  public readsThroughEndOfFile(): void {
    const reader = new SourceReader(new Source("ab"));

    Assert.areEqual("a", reader.readCodeUnit());
    Assert.areEqual(1, reader.currentOffset);
    Assert.areEqual("b", reader.readCodeUnit());
    Assert.isTrue(reader.isAtEnd);
    Assert.areEqual("\0", reader.peekCodeUnit());
    Assert.areEqual("\0", reader.readCodeUnit());
    Assert.areEqual(2, reader.currentOffset);
  }

  @TestMethod
  public peeksAtBasicMultilingualPlaneCodePointsWithoutMoving(): void {
    const reader = new SourceReader(new Source("A"));

    Assert.areEqual(0x41, reader.peekCodePoint());
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public peeksAtSupplementaryCodePointsWithoutMoving(): void {
    const reader = new SourceReader(new Source("\uD83D\uDE00"));

    Assert.areEqual(0x1F600, reader.peekCodePoint());
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public readsCodePointsUsingTheirUtf16Widths(): void {
    const reader = new SourceReader(new Source("A\uD83D\uDE00B"));

    Assert.areEqual(0x41, reader.readCodePoint());
    Assert.areEqual(1, reader.currentOffset);
    Assert.areEqual(0x1F600, reader.readCodePoint());
    Assert.areEqual(3, reader.currentOffset);
    Assert.areEqual(0x42, reader.readCodePoint());
    Assert.areEqual(4, reader.currentOffset);
  }

  @TestMethod
  public readsIsolatedSurrogatesAsSingleCodeUnits(): void {
    const reader = new SourceReader(new Source("\uD83DA\uDE00"));

    Assert.areEqual(0xD83D, reader.readCodePoint());
    Assert.areEqual(1, reader.currentOffset);
    Assert.areEqual(0x41, reader.readCodePoint());
    Assert.areEqual(2, reader.currentOffset);
    Assert.areEqual(0xDE00, reader.readCodePoint());
    Assert.areEqual(3, reader.currentOffset);
  }

  @TestMethod
  public doesNotCombineASurrogatePairAcrossTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("\uD83D\uDE00"), new SourceSpan(0, 1));

    Assert.areEqual(0xD83D, reader.peekCodePoint());
    Assert.areEqual(0xD83D, reader.readCodePoint());
    Assert.areEqual(1, reader.currentOffset);
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public returnsTheEndOfInputCodePointAtEndOfFileWithoutMoving(): void {
    const reader = new SourceReader(new Source(String.empty));

    Assert.areEqual(0, reader.peekCodePoint());
    Assert.areEqual(0, reader.readCodePoint());
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public distinguishesNullCharactersFromEndOfFileByPosition(): void {
    const reader = new SourceReader(new Source("\0"));

    Assert.isFalse(reader.isAtEnd);
    Assert.areEqual(0, reader.peekCodePoint());
    Assert.areEqual("\0", reader.readCodeUnit());
    Assert.isTrue(reader.isAtEnd);
    Assert.areEqual("\0", reader.readCodeUnit());
    Assert.areEqual(1, reader.currentOffset);
  }

  @TestMethod
  public peeksAtRelativeOffsetsWithoutMoving(): void {
    const reader = new SourceReader(new Source("abc"));

    Assert.areEqual("b", reader.peekCodeUnit(1));
    Assert.areEqual("\0", reader.peekCodeUnit(-1));
    Assert.areEqual("\0", reader.peekCodeUnit(3));
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public peeksOnlyInsideTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("xabcx"), new SourceSpan(1, 3));

    Assert.areEqual("\0", reader.peekCodeUnit(-1));
    Assert.areEqual("c", reader.peekCodeUnit(2));
    Assert.areEqual("\0", reader.peekCodeUnit(3));
    reader.advance(2);
    Assert.areEqual("a", reader.peekCodeUnit(-2));
  }

  @TestMethod
  public advancesWithoutPassingEndOfFile(): void {
    const reader = new SourceReader(new Source("abcd"));

    reader.advance();
    Assert.areEqual(1, reader.currentOffset);
    reader.advance(2);
    Assert.areEqual(3, reader.currentOffset);
    reader.advance(0);
    Assert.areEqual(3, reader.currentOffset);
    reader.advance(10);
    Assert.areEqual(4, reader.currentOffset);
  }

  @TestMethod
  public advancesWithoutPassingTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("xabcx"), new SourceSpan(1, 3));

    reader.advance(10);
    Assert.areEqual(4, reader.currentOffset);
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public seeksToOffsetsInsideTheSource(): void {
    const reader = new SourceReader(new Source("abc"));

    reader.seek(2);
    Assert.areEqual(2, reader.currentOffset);
    reader.seek(3);
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public seeksInsideTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("xabcx"), new SourceSpan(1, 3));

    reader.seek(3);
    Assert.areEqual(3, reader.currentOffset);
    reader.seek(4);
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public matchesWithoutAllocatingOrMoving(): void {
    const reader = new SourceReader(new Source("abcdef"));

    Assert.isTrue(reader.startsWith("abc"));
    Assert.isTrue(reader.startsWith(String.empty));
    Assert.isFalse(reader.startsWith("abd"));
    reader.seek(4);
    Assert.isFalse(reader.startsWith("cde"));
    Assert.areEqual(4, reader.currentOffset);
  }

  @TestMethod
  public matchesUtf16CodeUnitsWithoutCrossingTheReaderBoundary(): void {
    const reader = new SourceReader(new Source("x\uD83D\uDE00y"), new SourceSpan(1, 2));

    Assert.isTrue(reader.startsWith("\uD83D\uDE00"));
    Assert.isTrue(reader.startsWith("\uD83D"));
    Assert.isFalse(reader.startsWith("\uD83D\uDE00y"));
    Assert.areEqual(1, reader.currentOffset);

    reader.seek(2);
    Assert.isTrue(reader.startsWith("\uDE00"));
    Assert.isFalse(reader.startsWith("\uDE00y"));
    Assert.areEqual(2, reader.currentOffset);

    reader.seek(3);
    Assert.isTrue(reader.startsWith(String.empty));
    Assert.isFalse(reader.startsWith("y"));
    Assert.areEqual(3, reader.currentOffset);
  }

  @TestMethod
  public matchesOnlyInsideTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("xabcx"), new SourceSpan(1, 3));

    Assert.isTrue(reader.startsWith("abc"));
    Assert.isFalse(reader.startsWith("abcx"));
    Assert.areEqual(1, reader.currentOffset);
  }

  @TestMethod
  public readsWhileThePredicateMatches(): void {
    const reader = new SourceReader(new Source("abc 123"));

    Assert.areEqual("abc", reader.readWhile(t => t !== " ").toString());
    Assert.areEqual(3, reader.currentOffset);
    reader.advance();
    Assert.areEqual("123", reader.readWhile(() => true).toString());
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  public readsUntilThePredicateMatches(): void {
    const reader = new SourceReader(new Source("abc 123"));

    Assert.areEqual("abc", reader.readUntil(t => t === " ").toString());
    Assert.areEqual(3, reader.currentOffset);
    reader.advance();
    Assert.areEqual("123", reader.readUntil(() => false).toString());
    Assert.isTrue(reader.isAtEnd);
  }

  @TestMethod
  @TestData(1, 0)
  @TestData(1, 1)
  @TestData(1, 2)
  @TestData(1, 3)
  @TestData(2, 2)
  public repeatedReadsRespectBothReaderBounds(startOffset: number, length: number): void {
    const content = "x\uD801\uDC00\0z";
    const span = new SourceSpan(startOffset, length);
    const unitReader = new SourceReader(new Source(content), span);
    const pointReader = new SourceReader(new Source(content), span);
    const expected = content.slice(startOffset, startOffset + length);

    for (let index = 0; index < expected.length; index++) {
      Assert.areEqual(expected.charAt(index), unitReader.readCodeUnit());
      Assert.areEqual(startOffset + index + 1, unitReader.currentOffset);
    }

    let expectedOffset = startOffset;
    for (const character of expected) {
      Assert.areEqual(character.codePointAt(0), pointReader.readCodePoint());
      expectedOffset += character.length;
      Assert.areEqual(expectedOffset, pointReader.currentOffset);
    }

    for (let index = 0; index < 3; index++) {
      Assert.areEqual("\0", unitReader.readCodeUnit());
      Assert.areEqual(0, pointReader.readCodePoint());
      Assert.areEqual(span.endOffset, unitReader.currentOffset);
      Assert.areEqual(span.endOffset, pointReader.currentOffset);
    }
  }

  @TestMethod
  @TestData(0)
  @TestData(1)
  @TestData(3)
  public predicateScansStopAtTheReaderBoundary(length: number): void {
    const source = new Source("xabcx");
    const span = new SourceSpan(1, length);
    const whileReader = new SourceReader(source, span);
    const untilReader = new SourceReader(source, span);
    const whileCalls: string[] = [];
    const untilCalls: string[] = [];

    Assert.areEqual(source.content.slice(1, 1 + length), whileReader.readWhile(t => {
      whileCalls.push(t);
      return true;
    }).toString());
    Assert.areEqual(source.content.slice(1, 1 + length), untilReader.readUntil(t => {
      untilCalls.push(t);
      return false;
    }).toString());
    Assert.areEqual(length, whileCalls.length);
    Assert.areEqual(length, untilCalls.length);
    Assert.areEqual(span.endOffset, whileReader.currentOffset);
    Assert.areEqual(span.endOffset, untilReader.currentOffset);
    Assert.areEqual(String.empty, whileReader.readWhile(() => Assert.fail("Predicate called at end")).toString());
    Assert.areEqual(String.empty, untilReader.readUntil(() => Assert.fail("Predicate called at end")).toString());
  }

  @TestMethod
  @TestData("a", 1)
  @TestData("c", 3)
  public predicateFailuresPreserveCompletedProgress(character: string, expectedOffset: number): void {
    const source = new Source("xabcx");
    const span = new SourceSpan(1, 3);
    const whileReader = new SourceReader(source, span);
    const untilReader = new SourceReader(source, span);
    const failure = new ArgumentOutOfRangeException("character");

    Assert.areEqual(failure, Assert.throws(() => whileReader.readWhile(t => {
      if (t === character)
        throw failure;

      return true;
    }), ArgumentOutOfRangeException));
    Assert.areEqual(failure, Assert.throws(() => untilReader.readUntil(t => {
      if (t === character)
        throw failure;

      return false;
    }), ArgumentOutOfRangeException));
    Assert.areEqual(expectedOffset, whileReader.currentOffset);
    Assert.areEqual(expectedOffset, untilReader.currentOffset);
    Assert.areEqual(character, whileReader.peekCodeUnit());
    Assert.areEqual(character, untilReader.peekCodeUnit());
  }

  @TestMethod
  public peeksWhileThePredicateMatchesWithoutMoving(): void {
    const reader = new SourceReader(new Source("aaabbb"));

    Assert.areEqual("aaa", reader.peekWhile(t => t === "a").toString());
    Assert.areEqual(0, reader.currentOffset);
    Assert.areEqual("aaabbb", reader.peekWhile(() => true).toString());
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public createsOffsetOnlySpansWithoutMoving(): void {
    const reader = new SourceReader(new Source("sample"));
    const span = reader.createSpan(1, 3);

    Assert.areEqual(1, span.startOffset);
    Assert.areEqual(3, span.length);
    Assert.areEqual(0, reader.currentOffset);
  }

  @TestMethod
  public createsSpansFromBoundarySpans(): void {
    const reader = new SourceReader(new Source("sample"));
    const span = reader.createSpan(new SourceSpan(1, 2), new SourceSpan(4, 1));

    Assert.areEqual(1, span.startOffset);
    Assert.areEqual(4, span.length);
  }

  @TestMethod
  public createsAbsoluteSpansInsideTheBoundedSourceRegion(): void {
    const reader = new SourceReader(new Source("prefixbodysuffix"), new SourceSpan(6, 4));
    const span = reader.createSpan(7, 2);

    Assert.areEqual(7, span.startOffset);
    Assert.areEqual(2, span.length);
  }
}
