/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptConstructorDeclarationNode,
  TypeScriptGetAccessorNode,
  TypeScriptIndexSignatureNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptPropertyDeclarationNode,
  TypeScriptSetAccessorNode,
  TypeScriptStaticBlockNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";

@TestClass
export class ClassMemberParserTests {
  @TestMethod
  public dispatchesEverySharedClassMember(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { constructor() {} get value() {} set value(next) {} [key: string]: Value; method() {} property: Value; static {} }");

    Assert.areEqual(7, bodyNode.children.length);
    Assert.isInstanceOf(bodyNode.children[0], TypeScriptConstructorDeclarationNode);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptGetAccessorNode);
    Assert.isInstanceOf(bodyNode.children[2], TypeScriptSetAccessorNode);
    Assert.isInstanceOf(bodyNode.children[3], TypeScriptIndexSignatureNode);
    Assert.isInstanceOf(bodyNode.children[4], TypeScriptMethodDeclarationNode);
    Assert.isInstanceOf(bodyNode.children[5], TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(bodyNode.children[6], TypeScriptStaticBlockNode);
  }
}
