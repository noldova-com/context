/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { InvalidOffsetException, LineOutOfBoundsException, Source, SourceLineMap, SourcePosition } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import { LineFeedLineTerminator } from "../../fixtures/line-feed-line-terminator.fixture.js";

@TestClass
export class SourceLineMapTests {
  @TestMethod
  public representsAnEmptySourceAsOneLine(): void {
    const lineMap = this.create(String.empty);

    Assert.areEqual(1, lineMap.lineCount);
    Assert.areEqual(1, lineMap.lines.length);
    Assert.areEqual(0, lineMap.lines[0]?.startOffset);
    Assert.areEqual(0, lineMap.lines[0]?.endOffset);
    Assert.areEqual(0, lineMap.lines[0]?.lineBreakLength);
  }

  @TestMethod
  public recognizesEveryEcmaScriptLineTerminator(): void {
    const lineMap = this.create("a\r\nbb\nc\rd\u2028e\u2029");
    const lines = lineMap.lines;

    Assert.areEqual(6, lineMap.lineCount);
    Assert.areEqual(6, lines.length);
    Assert.areEqual(0, lines[0]?.lineIndex);
    Assert.areEqual(0, lines[0]?.startOffset);
    Assert.areEqual(1, lines[0]?.endOffset);
    Assert.areEqual(2, lines[0]?.lineBreakLength);
    Assert.areEqual(3, lines[1]?.startOffset);
    Assert.areEqual(5, lines[1]?.endOffset);
    Assert.areEqual(1, lines[1]?.lineBreakLength);
    Assert.areEqual(6, lines[2]?.startOffset);
    Assert.areEqual(7, lines[2]?.endOffset);
    Assert.areEqual(8, lines[3]?.startOffset);
    Assert.areEqual(9, lines[3]?.endOffset);
    Assert.areEqual(10, lines[4]?.startOffset);
    Assert.areEqual(11, lines[4]?.endOffset);
    Assert.areEqual(12, lines[5]?.startOffset);
    Assert.areEqual(12, lines[5]?.endOffset);
    Assert.areEqual(0, lines[5]?.lineBreakLength);
    Assert.areEqual(lines, lineMap.lines);
  }

  @TestMethod
  public usesTheHostSelectedLineTerminator(): void {
    const source = new Source("first\u2028second\nthird");
    const lineMap = new SourceLineMap(source, new LineFeedLineTerminator());

    Assert.areEqual(2, lineMap.lineCount);
    Assert.areEqual("first\u2028second", lineMap.getLineText(0));
    Assert.areEqual("third", lineMap.getLineText(1));
  }

  @TestMethod
  public returnsLineTextWithoutTerminators(): void {
    const lineMap = this.create("first\r\nsecond\n");

    Assert.areEqual("first", lineMap.getLineText(0));
    Assert.areEqual("second", lineMap.getLineText(1));
    Assert.areEqual(String.empty, lineMap.getLineText(2));
  }

  @TestMethod
  public returnsLineSpansWithoutTerminators(): void {
    const lineMap = this.create("first\r\nsecond\n");

    Assert.areEqual("first", lineMap.getLineSpan(0).toString());
    Assert.areEqual("second", lineMap.getLineSpan(1).toString());
    Assert.areEqual(String.empty, lineMap.getLineSpan(2).toString());
  }

  @TestMethod
  public rejectsInvalidLineIndexes(): void {
    const lineMap = this.create("sample");

    Assert.throws(() => lineMap.getLineSpan(-1), LineOutOfBoundsException);
    Assert.throws(() => lineMap.getLineSpan(1), LineOutOfBoundsException);
    Assert.throws(() => lineMap.getLineSpan(0.5), LineOutOfBoundsException);
    Assert.throws(() => lineMap.getLineText(-1), LineOutOfBoundsException);
    Assert.throws(() => lineMap.getLineText(1), LineOutOfBoundsException);
    Assert.throws(() => lineMap.getLineText(0.5), LineOutOfBoundsException);
  }

  @TestMethod
  public convertsEveryOffsetThroughUtf16Coordinates(): void {
    const source = new Source("a\r\nb\nc\rd\u2028e\u2029");
    const lineMap = new SourceLineMap(source, new EcmaScriptLineTerminator());

    for (let offset = 0; offset <= source.length; offset++) {
      const position = lineMap.getPosition(offset);
      Assert.areEqual(offset, lineMap.getOffset(position));
    }

    const carriageReturn = lineMap.getPosition(1);
    const lineFeed = lineMap.getPosition(2);
    Assert.areEqual(0, carriageReturn.lineIndex);
    Assert.areEqual(1, carriageReturn.characterIndex);
    Assert.areEqual(0, lineFeed.lineIndex);
    Assert.areEqual(2, lineFeed.characterIndex);
    Assert.areEqual(1, lineMap.getPosition(3).lineIndex);
    Assert.areEqual(0, lineMap.getPosition(3).characterIndex);
  }

  @TestMethod
  public rejectsInvalidOffsets(): void {
    const lineMap = this.create("sample");

    Assert.throws(() => lineMap.getPosition(-1), InvalidOffsetException);
    Assert.throws(() => lineMap.getPosition(7), InvalidOffsetException);
    Assert.throws(() => lineMap.getPosition(0.5), InvalidOffsetException);
  }

  @TestMethod
  public rejectsInvalidLineCharacters(): void {
    const lineMap = this.create("a\r\nb");

    Assert.throws(() => lineMap.getOffset(new SourcePosition(2, 0)), LineOutOfBoundsException);
    const failure = Assert.throws(() => lineMap.getOffset(new SourcePosition(0, 3)), ArgumentOutOfRangeException);

    Assert.areEqual("characterIndex", failure.parameterName);
    Assert.areEqual(3, failure.actualValue);
  }

  private create(content: string): SourceLineMap {
    return new SourceLineMap(new Source(content), new EcmaScriptLineTerminator());
  }
}
