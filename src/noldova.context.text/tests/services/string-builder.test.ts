/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { StringBuilder } from "@noldova/context.text";

@TestClass
export class StringBuilderTests {
  @TestMethod
  public startsEmpty(): void {
    const builder = new StringBuilder();

    Assert.areEqual(0, builder.length);
    Assert.areEqual(String.empty, builder.toString());
  }

  @TestMethod
  public appendsAndChainsStrings(): void {
    const builder = new StringBuilder();

    const result = builder.append("hello").append(" ").append("world");

    Assert.areEqual(builder, result);
    Assert.areEqual(11, builder.length);
    Assert.areEqual("hello world", builder.toString());
  }

  @TestMethod
  public preservesUtf16ContentAndLength(): void {
    const builder = new StringBuilder();

    builder.append("世界").append("😀");

    Assert.areEqual(4, builder.length);
    Assert.areEqual("世界😀", builder.toString());
  }

  @TestMethod
  public ignoresEmptyAppends(): void {
    const builder = new StringBuilder();

    builder.append(String.empty);

    Assert.areEqual(0, builder.length);
    Assert.areEqual(String.empty, builder.toString());
  }

  @TestMethod
  public clearsAndCanBeReused(): void {
    const builder = new StringBuilder();
    builder.append("before");

    builder.clear();
    builder.append("after");

    Assert.areEqual(5, builder.length);
    Assert.areEqual("after", builder.toString());
  }

  @TestMethod
  public materializesWithoutConsumingOrChangingEarlierStrings(): void {
    const builder = new StringBuilder();
    builder.append("first");

    const first = builder.toString();
    Assert.areEqual(first, builder.toString());
    Assert.areEqual(5, builder.length);

    builder.append(" second");
    Assert.areEqual("first second", builder.toString());
    Assert.areEqual("first", first);

    builder.clear();
    Assert.areEqual(0, builder.length);
    Assert.areEqual(String.empty, builder.toString());
    Assert.areEqual("first", first);
  }

  @TestMethod
  public preservesNewlinesAcrossFragmentBoundaries(): void {
    const builder = new StringBuilder();
    builder.append("a\r").append("\nb\rc\nd\u2028e\u2029");

    Assert.areEqual("a\r\nb\rc\nd\u2028e\u2029", builder.toString());
    Assert.areEqual(11, builder.length);
  }

  @TestMethod
  public preservesSplitSurrogatesAndUnpairedCodeUnits(): void {
    const builder = new StringBuilder();
    builder.append("\uD83D").append("\uDE00").append("\uD800");

    Assert.areEqual("😀\uD800", builder.toString());
    Assert.areEqual(3, builder.length);
  }

  @TestMethod
  public canClearAnAlreadyEmptyBuilder(): void {
    const builder = new StringBuilder();
    builder.clear();
    builder.clear();

    Assert.areEqual(0, builder.length);
    Assert.areEqual(String.empty, builder.toString());
    Assert.areEqual(builder, builder.append(String.empty));
    Assert.areEqual("reused", builder.append("reused").toString());
  }
}
