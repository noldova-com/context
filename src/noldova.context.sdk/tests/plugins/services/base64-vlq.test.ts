/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Base64Vlq } from "@noldova/context.sdk/plugins/services/base64-vlq.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class Base64VlqTests {
  @TestMethod
  public decodesEachLinesMappings(): void {
    const lines = Base64Vlq.decode("A,CAAC;AAEA,KAAKA;");

    Assert.areEqual("0 0 0 0 0 1,1 0 0 1 0 4;0 0 2 1 0 4,5 0 2 6 0 5;",
      lines.select(line => line.select(t => [t.column, t.sourceIndex, t.line, t.character, t.nameIndex, t.fieldCount].join(" ")).toArray().join(",")).toArray().join(";"));
  }

  @TestMethod
  @TestData("AAAA;AACA,EAAE")
  @TestData("A,CAAC;;AAEA,KAAKA")
  @TestData("AAAA,C,EAAE")
  @TestData("gBAAiB,SACb")
  public encodesWhatItDecodes(mappings: string): void {
    Assert.areEqual(mappings, Base64Vlq.encode(Base64Vlq.decode(mappings)));
  }
}
