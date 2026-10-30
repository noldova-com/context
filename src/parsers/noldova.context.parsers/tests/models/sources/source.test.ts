/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { InvalidSpanException, Source, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { ReadOnlyStringSpan } from "@noldova/context.text";

@TestClass
export class SourceTests {
  @TestMethod
  public carriesTheImmutableSource(): void {
    const source = new Source("content", "src/sample.ts");

    Assert.areEqual("content", source.content);
    Assert.areEqual("src/sample.ts", source.identity);
    Assert.areEqual(7, source.length);
  }

  @TestMethod
  public acceptsAnAnonymousSource(): void {
    Assert.isUndefined(new Source(String.empty).identity);
  }

  @TestMethod
  public constructorRejectsAWhitespaceIdentity(): void {
    const failure = Assert.throws(() => new Source(String.empty, " "), ArgumentException);

    Assert.areEqual("identity", failure.parameterName);
  }

  @TestMethod
  public returnsSpansFromOffsetsAndSpans(): void {
    const source = new Source("sample");

    const span = source.getSpan(1, 3);
    Assert.isInstanceOf(span, ReadOnlyStringSpan);
    Assert.areEqual("amp", span.toString());
    Assert.areEqual(String.empty, source.getSpan(3, 0).toString());
    Assert.areEqual("mpl", source.getSpan(new SourceSpan(2, 3)).toString());
  }

  @TestMethod
  public returnsTextFromOffsetsAndSpans(): void {
    const source = new Source("sample");

    Assert.areEqual("amp", source.getText(1, 3));
    Assert.areEqual(String.empty, source.getText(3, 0));
    Assert.areEqual("mpl", source.getText(new SourceSpan(2, 3)));
  }

  @TestMethod
  public rejectsInvalidSpans(): void {
    const source = new Source("sample");

    Assert.throws(() => source.getSpan(-1, 1), InvalidSpanException);
    Assert.throws(() => source.getSpan(2, -1), InvalidSpanException);
    Assert.throws(() => source.getSpan(0, 7), InvalidSpanException);
    Assert.throws(() => source.getSpan(0.5, 1), InvalidSpanException);
    Assert.throws(() => source.getText(-1, 1), InvalidSpanException);
    Assert.throws(() => source.getText(2, -1), InvalidSpanException);
    Assert.throws(() => source.getText(0, 7), InvalidSpanException);
    Assert.throws(() => source.getText(0.5, 1), InvalidSpanException);
    Assert.throws(() => source.getSpan(Number.MAX_SAFE_INTEGER, 1), InvalidSpanException);
  }

  @TestMethod
  @TestData(2, 2)
  @TestData(4, 0)
  @TestData(0, 4)
  public rejectsOutOfBoundsRangesConsistentlyAcrossOverloads(startOffset: number, length: number): void {
    const source = new Source("abc");
    const span = new SourceSpan(startOffset, length);
    const failures = [
      Assert.throws(() => source.getSpan(startOffset, length), InvalidSpanException),
      Assert.throws(() => source.getSpan(span), InvalidSpanException),
      Assert.throws(() => source.getText(startOffset, length), InvalidSpanException),
      Assert.throws(() => source.getText(span), InvalidSpanException)
    ];

    for (const failure of failures) {
      Assert.areEqual(startOffset, failure.startOffset);
      Assert.areEqual(length, failure.length);
      Assert.areEqual(3, failure.sourceLength);
    }
  }

  @TestMethod
  @TestData("")
  @TestData("abc")
  public acceptsAnEmptySpanAtTheSourceEndAcrossOverloads(content: string): void {
    const source = new Source(content);
    const span = new SourceSpan(content.length, 0);

    Assert.areEqual(String.empty, source.getSpan(content.length, 0).toString());
    Assert.areEqual(String.empty, source.getSpan(span).toString());
    Assert.areEqual(String.empty, source.getText(content.length, 0));
    Assert.areEqual(String.empty, source.getText(span));
  }

  @TestData("a\uD83D\uDE00b", 0, 4, "a\uD83D\uDE00b")
  @TestData("a\uD83D\uDE00b", 1, 2, "\uD83D\uDE00")
  @TestData("a\uD83D\uDE00b", 1, 1, "\uD83D")
  @TestData("a\uD83D\uDE00b", 2, 1, "\uDE00")
  @TestData("a\uD83D\uDE00b", 3, 1, "b")
  @TestData("\uD800a\uDC00", 0, 1, "\uD800")
  @TestData("a\0b", 1, 1, "\0")
  @TestData("\r\n", 1, 1, "\n")
  @TestData("", 0, 0, "")
  @TestData("abc", 3, 0, "")
  @TestMethod
  public preservesExactUtf16TextAcrossBothOverloads(content: string, startOffset: number, length: number, expected: string): void {
    const source = new Source(content);
    const span = new SourceSpan(startOffset, length);

    Assert.areEqual(expected, source.getText(startOffset, length));
    Assert.areEqual(expected, source.getText(span));
    Assert.areEqual(expected, source.getSpan(span).toString());
  }

  @TestData(Number.NaN, 0)
  @TestData(0, Number.NaN)
  @TestData(Number.POSITIVE_INFINITY, 0)
  @TestData(0, Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY, 0)
  @TestData(0, Number.NEGATIVE_INFINITY)
  @TestData(0, 0.5)
  @TestData(-1, 0)
  @TestData(0, -1)
  @TestData(Number.MAX_SAFE_INTEGER, 1)
  @TestData(Number.MAX_SAFE_INTEGER + 1, 0)
  @TestMethod
  public preservesInvalidTextRangeDetails(startOffset: number, length: number): void {
    const source = new Source("abc");

    const failure = Assert.throws(() => source.getText(startOffset, length), InvalidSpanException);

    Assert.areEqual(startOffset, failure.startOffset);
    Assert.areEqual(length, failure.length);
    Assert.areEqual(3, failure.sourceLength);
  }
}
