/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { OctalEscapeService } from "@noldova/context.text";

@TestClass
export class OctalEscapeServiceTests {
  @TestMethod
  public decodesAnEscapedSpace(): void {
    Assert.areEqual("a b", OctalEscapeService.decode("a\\040b"));
  }

  @TestMethod
  public decodesAnEscapedTab(): void {
    Assert.areEqual("a\tb", OctalEscapeService.decode("a\\011b"));
  }

  @TestMethod
  public decodesAnEscapedNewline(): void {
    Assert.areEqual("a\nb", OctalEscapeService.decode("a\\012b"));
  }

  @TestMethod
  public decodesAnEscapedBackslash(): void {
    Assert.areEqual("a\\b", OctalEscapeService.decode("a\\134b"));
  }

  @TestMethod
  public keepsTheDigitsAfterAnEscapedBackslash(): void {
    Assert.areEqual("/mnt/a\\040b", OctalEscapeService.decode("/mnt/a\\134040b"));
  }

  @TestMethod
  public keepsADigitAfterAnEscape(): void {
    Assert.areEqual("a\n3", OctalEscapeService.decode("a\\0123"));
  }

  @TestMethod
  public decodesTheEscapeAfterABackslashWithoutDigits(): void {
    Assert.areEqual("a\\ b", OctalEscapeService.decode("a\\\\040b"));
  }

  @TestMethod
  public keepsASurrogatePairBesideAnEscape(): void {
    Assert.areEqual("\u{1F600} \u{1F600}", OctalEscapeService.decode("\u{1F600}\\040\u{1F600}"));
  }

  @TestMethod
  public decodesAMountPointWithSpaces(): void {
    Assert.areEqual("/run/media/user/My Disk 2", OctalEscapeService.decode("/run/media/user/My\\040Disk\\0402"));
  }

  @TestMethod
  public decodesTheLowestAndHighestEscapes(): void {
    Assert.areEqual("\u0000ÿ", OctalEscapeService.decode("\\000\\377"));
  }

  @TestMethod
  public leavesAnEscapePastOneByteAsItIs(): void {
    Assert.areEqual("\\400 \\777", OctalEscapeService.decode("\\400 \\777"));
  }

  @TestMethod
  public leavesOtherBackslashesAsTheyAre(): void {
    Assert.areEqual("\\n \\08 \\04 \\x41 a\\", OctalEscapeService.decode("\\n \\08 \\04 \\x41 a\\"));
  }

  @TestMethod
  public returnsTextWithoutEscapesUnchanged(): void {
    Assert.areEqual("/home/user", OctalEscapeService.decode("/home/user"));
    Assert.areEqual(String.empty, OctalEscapeService.decode(String.empty));
  }
}
