/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { TypeScriptJumpTarget } from "@noldova/context.parsers.typescript/models/typescript-jump-target.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptJumpTargetTests {
  @TestMethod
  public keepsItsLabelAndWhetherItIsAnIteration(): void {
    const labelNode = new TypeScriptIdentifierNode("outer", new SourceSpan(0, 5));
    const target = new TypeScriptJumpTarget(labelNode, true);

    Assert.areEqual(labelNode, target.labelNode);
    Assert.isTrue(target.isIteration);
  }

  @TestMethod
  public namesAnUnlabeledIterationAndSwitch(): void {
    Assert.isUndefined(TypeScriptJumpTarget.ofIteration.labelNode);
    Assert.isTrue(TypeScriptJumpTarget.ofIteration.isIteration);
    Assert.isUndefined(TypeScriptJumpTarget.ofSwitch.labelNode);
    Assert.isFalse(TypeScriptJumpTarget.ofSwitch.isIteration);
  }
}
