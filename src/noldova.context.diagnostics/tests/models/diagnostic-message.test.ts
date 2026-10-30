/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticMessage } from "@noldova/context.diagnostics";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticMessageTests {
  @TestMethod
  public carriesTheNode(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
    const message = new DiagnosticMessage(code, DiagnosticCategory.Error, "Cannot find name 'value'.", []);

    Assert.areEqual(code, message.code);
    Assert.areEqual(DiagnosticCategory.Error, message.category);
    Assert.areEqual("Cannot find name 'value'.", message.text);
    Assert.areEqual(0, message.children.length);
  }

  @TestMethod
  public preservesTheChildOrderOfAChain(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2322);
    const first = new DiagnosticMessage(code, DiagnosticCategory.Error, "Types of property 'value' are incompatible.", []);
    const second = new DiagnosticMessage(code, DiagnosticCategory.Error, "Type 'string' is not assignable to type 'number'.", []);
    const message = new DiagnosticMessage(code, DiagnosticCategory.Error, "Type 'A' is not assignable to type 'B'.", [first, second]);

    Assert.areEqual(2, message.children.length);
    Assert.areEqual<string | undefined>(first.text, message.children[0]?.text);
    Assert.areEqual<string | undefined>(second.text, message.children[1]?.text);
  }

  @TestMethod
  public copiesTheChildrenFromTheCaller(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.context, 1001);
    const child = new DiagnosticMessage(code, DiagnosticCategory.Message, "A child.", []);
    const children = [child];
    const message = new DiagnosticMessage(code, DiagnosticCategory.Message, "A parent.", children);

    children.length = 0;

    Assert.areEqual(1, message.children.length);
  }

  @TestMethod
  public preservesIndependentIdentitiesThroughoutANestedChain(): void {
    const parentCode = new DiagnosticCode(DiagnosticAuthority.typeScript, 2322);
    const childCode = new DiagnosticCode(DiagnosticAuthority.context, 1001);
    const nestedCode = new DiagnosticCode(DiagnosticAuthority.context, 1002);
    const nested = new DiagnosticMessage(nestedCode, DiagnosticCategory.Suggestion, "A nested detail.", []);
    const first = new DiagnosticMessage(childCode, DiagnosticCategory.Warning, "The first detail.", [nested]);
    const second = new DiagnosticMessage(nestedCode, DiagnosticCategory.Message, "The second detail.", []);
    const message = new DiagnosticMessage(parentCode, DiagnosticCategory.Error, "The primary message.", [first, second]);

    Assert.areEqual(parentCode, message.code);
    Assert.areEqual(DiagnosticCategory.Error, message.category);
    Assert.areEqual(2, message.children.length);

    const firstChild = message.children[0];
    const secondChild = message.children[1];
    Assert.isDefined(firstChild);
    Assert.isDefined(secondChild);
    Assert.areEqual(first, firstChild);
    Assert.areEqual(childCode, firstChild.code);
    Assert.areEqual(DiagnosticCategory.Warning, firstChild.category);
    Assert.areEqual(1, firstChild.children.length);
    Assert.areEqual(second, secondChild);
    Assert.areEqual(nestedCode, secondChild.code);
    Assert.areEqual(DiagnosticCategory.Message, secondChild.category);

    const nestedChild = firstChild.children[0];
    Assert.isDefined(nestedChild);
    Assert.areEqual(nested, nestedChild);
    Assert.areEqual(nestedCode, nestedChild.code);
    Assert.areEqual(DiagnosticCategory.Suggestion, nestedChild.category);
    Assert.areEqual("A nested detail.", nestedChild.text);
  }

  @TestMethod
  public rejectsWhitespaceText(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);

    Assert.throws(() => new DiagnosticMessage(code, DiagnosticCategory.Error, " ", []), ArgumentException);
  }
}
