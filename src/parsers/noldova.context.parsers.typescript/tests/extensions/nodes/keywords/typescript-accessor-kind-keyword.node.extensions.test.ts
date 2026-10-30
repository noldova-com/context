/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAccessorKindKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAccessorKindKeywordNodeExtensionsTests {
  @TestData("get value", true)
  @TestData("set [key]", true)
  @TestData("get 1", true)
  @TestData("set\nvalue", true)
  @TestData("get()", false)
  @TestData("set;", false)
  @TestData("get = 1", false)
  @TestMethod
  public startsAnAccessorWhereAPropertyNameFollows(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptAccessorKindKeywordNode);
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(expected, node.startsTypeScriptAccessor(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
  }

  @TestData("get")
  @TestData("set")
  @TestMethod
  public startsAClassMemberAndATypeMember(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.isTrue(parser.currentNode.canStartTypeScriptClassMember(parser));
    Assert.isTrue(parser.currentNode.canStartTypeScriptTypeMember(parser));
  }

  @TestMethod
  public startsNoAccessorFromAnotherToken(): void {
    const parser = TypeScriptParserFixture.create("value name");

    Assert.isFalse(parser.currentNode.startsTypeScriptAccessor(parser));
  }
}
