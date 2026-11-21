/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CodePointOrderService } from "@noldova/context.text";

@TestClass
export class CodePointOrderServiceTests {
  private static readonly grinning: string = String.fromCodePoint(0x1F600);
  private static readonly replacement: string = String.fromCodePoint(0xFFFD);

  @TestMethod
  public putsUppercaseAsciiBeforeLowercase(): void {
    Assert.areEqual(-1, CodePointOrderService.compare("Zebra", "apple"));
    Assert.areEqual(1, CodePointOrderService.compare("apple", "Zebra"));
    Assert.areEqual(-1, CodePointOrderService.compare("B", "a"));
  }

  @TestMethod
  public putsAScopedNameBeforeAPlainOne(): void {
    Assert.areEqual(-1, CodePointOrderService.compare("@noldova/context.text", "noldova"));
    Assert.areEqual(-1, CodePointOrderService.compare("@scope/z", "a"));
  }

  @TestMethod
  public putsAnAstralCharacterAfterTheReplacementCharacter(): void {
    Assert.areEqual(1, CodePointOrderService.compare(CodePointOrderServiceTests.grinning, CodePointOrderServiceTests.replacement));
    Assert.areEqual(-1, CodePointOrderService.compare(`a${CodePointOrderServiceTests.replacement}`, `a${CodePointOrderServiceTests.grinning}`));
    Assert.areEqual(1, CodePointOrderService.compare(CodePointOrderServiceTests.grinning, String.fromCodePoint(0xE000)));
  }

  @TestMethod
  public callsEqualStringsEqual(): void {
    Assert.areEqual(0, CodePointOrderService.compare("sample", "sample"));
    Assert.areEqual(0, CodePointOrderService.compare(String.empty, String.empty));
    Assert.areEqual(0, CodePointOrderService.compare(CodePointOrderServiceTests.grinning, CodePointOrderServiceTests.grinning));
  }

  @TestMethod
  public putsAStringBeforeTheLongerStringsItStarts(): void {
    Assert.areEqual(-1, CodePointOrderService.compare("sample", "sample-app"));
    Assert.areEqual(1, CodePointOrderService.compare("sample-app", "sample"));
    Assert.areEqual(-1, CodePointOrderService.compare(String.empty, "a"));
  }

  @TestMethod
  public ordersAstralCharactersThatShareALeadingSurrogate(): void {
    Assert.areEqual(-1, CodePointOrderService.compare(String.fromCodePoint(0x1F600), String.fromCodePoint(0x1F601)));
    Assert.areEqual(1, CodePointOrderService.compare(`x${String.fromCodePoint(0x1F601)}`, `x${String.fromCodePoint(0x1F600)}`));
  }

  @TestMethod
  public ordersALoneSurrogateByItsOwnValue(): void {
    const loneLeading = String.fromCharCode(0xD83D);
    const loneTrailing = String.fromCharCode(0xDC00);

    Assert.areEqual(-1, CodePointOrderService.compare(`${loneLeading}A`, CodePointOrderServiceTests.grinning));
    Assert.areEqual(1, CodePointOrderService.compare(CodePointOrderServiceTests.grinning, `${loneLeading}A`));
    Assert.areEqual(-1, CodePointOrderService.compare(`${loneLeading}A`, `${loneLeading}B`));
    Assert.areEqual(-1, CodePointOrderService.compare(loneTrailing, String.fromCodePoint(0xE000)));
    Assert.areEqual(1, CodePointOrderService.compare(loneTrailing, "z"));
  }

  @TestMethod
  public sortsAsTheStringsUtf8BytesDoAndUnlikeUtf16Units(): void {
    const privateUse = String.fromCodePoint(0xE000);
    const names = ["zebra", CodePointOrderServiceTests.grinning, "a", CodePointOrderServiceTests.replacement, "Zebra", "éclair", "eclair", "b", "@scope/a", "a-b", "a_b", "ab", "B", privateUse];

    const sorted = [...names].sort(CodePointOrderService.compare);

    Assert.areEqual(
      JSON.stringify(["@scope/a", "B", "Zebra", "a", "a-b", "a_b", "ab", "b", "eclair", "zebra", "éclair", privateUse, CodePointOrderServiceTests.replacement, CodePointOrderServiceTests.grinning]),
      JSON.stringify(sorted));
    Assert.areNotEqual(JSON.stringify([...names].sort()), JSON.stringify(sorted));
  }
}
