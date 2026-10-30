/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { TypeScriptRecursionLimitException } from "@noldova/context.parsers.typescript/exceptions/typescript-recursion-limit.exception.js";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptParserContextTests {
  @TestMethod
  public separatesClassBodyRecoveryFromOrdinaryArrowRejections(): void {
    const context = new TypeScriptParserContext(new Source("value"));
    const flags = context.contextFlags;
    const normalArrows = context.getRejectedArrowOffsets(flags);
    const sharedArrows = context.getSharedRejectedArrowOffsets(flags);
    normalArrows.add(0);
    sharedArrows.add(0);
    context.isClassBodyContext = true;
    Assert.areEqual(0, context.getRejectedArrowOffsets(flags).size);
    Assert.areEqual(0, context.getSharedRejectedArrowOffsets(flags).size);
    Assert.areEqual(flags, context.contextFlags);
    context.isClassBodyContext = false;
    Assert.areEqual(normalArrows, context.getRejectedArrowOffsets(flags));
    Assert.areEqual(sharedArrows, context.getSharedRejectedArrowOffsets(flags));
  }

  @TestMethod
  public separatesDecoratorExpressionRecognitionFromOrdinaryExpressions(): void {
    const context = new TypeScriptParserContext(new Source("value"));
    Assert.isFalse(context.isDecoratorContext);
    context.contextFlags = TypeScriptContextFlags.Decorator | TypeScriptContextFlags.Await;
    Assert.isTrue(context.isDecoratorContext);
    Assert.isTrue(context.isAwaitContext);
    Assert.isFalse(context.isYieldContext);
    context.contextFlags = TypeScriptContextFlags.TopLevelAwait;
    Assert.isTrue(context.isAwaitContext);
    Assert.isFalse(context.isDecoratorContext);
  }

  @TestMethod
  public disallowsInOnlyWhereItsFlagIsSet(): void {
    const context = new TypeScriptParserContext(new Source("value"));
    Assert.isFalse(context.isDisallowInContext);
    context.contextFlags = TypeScriptContextFlags.DisallowIn | TypeScriptContextFlags.Await;
    Assert.isTrue(context.isDisallowInContext);
    Assert.isTrue(context.isAwaitContext);
  }

  @TestMethod
  public separatesArrowRejectionsAcrossSwitchRecoveryContexts(): void {
    const context = new TypeScriptParserContext(new Source(" "));
    const normalArrows = context.getRejectedArrowOffsets(context.contextFlags);
    normalArrows.add(0);

    context.enterList(TypeScriptListKind.SwitchClauseStatements);
    const switchArrows = context.getRejectedArrowOffsets(context.contextFlags);
    Assert.areEqual(0, switchArrows.size);
    switchArrows.add(1);

    context.leaveList();
    Assert.areEqual(normalArrows, context.getRejectedArrowOffsets(context.contextFlags));
    Assert.isFalse(normalArrows.has(1));
    context.clearRecognitionCaches();
    Assert.areEqual(0, normalArrows.size);
    Assert.areEqual(0, switchArrows.size);
  }

  @TestMethod
  public keepsArrowRejectionsSpecificToTheirGrammarContext(): void {
    const context = new TypeScriptParserContext(new Source("value"));
    const normalOffsets = context.getRejectedArrowOffsets(context.contextFlags);
    normalOffsets.add(0);
    Assert.isFalse(context.isAwaitContext);
    Assert.isFalse(context.isYieldContext);

    context.contextFlags = TypeScriptContextFlags.Await;
    Assert.isTrue(context.isAwaitContext);
    Assert.isFalse(context.isYieldContext);
    Assert.areEqual(0, context.getRejectedArrowOffsets(context.contextFlags).size);
    context.getRejectedArrowOffsets(context.contextFlags).add(1);

    context.contextFlags = TypeScriptContextFlags.Yield;
    Assert.isFalse(context.isAwaitContext);
    Assert.isTrue(context.isYieldContext);
    Assert.areEqual(0, context.getRejectedArrowOffsets(context.contextFlags).size);
    context.getRejectedArrowOffsets(context.contextFlags).add(2);

    context.contextFlags = TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield;
    Assert.isTrue(context.isAwaitContext);
    Assert.isTrue(context.isYieldContext);
    Assert.areEqual(0, context.getRejectedArrowOffsets(context.contextFlags).size);
    context.clearRecognitionCaches();
    for (const flags of [TypeScriptContextFlags.None, TypeScriptContextFlags.Await, TypeScriptContextFlags.Yield]) {
      context.contextFlags = flags;
      Assert.areEqual(0, context.getRejectedArrowOffsets(context.contextFlags).size);
    }
    Assert.areEqual(0, normalOffsets.size);
  }

  @TestMethod
  public boundsRecursionWithoutCountingARejectedEntry(): void {
    const context = new TypeScriptParserContext(new Source("value"));
    const span = new SourceSpan(0, 5);
    for (let depth = 0; depth < 512; depth++)
      context.enterRecursion(span);

    const failure = Assert.throws(() => context.enterRecursion(span), TypeScriptRecursionLimitException);
    Assert.areEqual(span, failure.span);

    context.leaveRecursion();
    context.enterRecursion(span);
    for (let depth = 0; depth < 512; depth++)
      context.leaveRecursion();

    for (let depth = 0; depth < 512; depth++)
      context.enterRecursion(span);
    for (let depth = 0; depth < 512; depth++)
      context.leaveRecursion();
  }

  @TestMethod
  public ownsIndependentRecognitionCachesForEachSession(): void {
    const source = new Source("value < other");
    const first = new TypeScriptParserContext(source);
    const second = new TypeScriptParserContext(source);
    first.getRejectedArrowOffsets(first.contextFlags).add(0);
    first.unclosedTypeArgumentOffsets.add(6);

    Assert.areEqual(0, second.getRejectedArrowOffsets(second.contextFlags).size);
    Assert.areEqual(0, second.unclosedTypeArgumentOffsets.size);
    Assert.isTrue(first.getRejectedArrowOffsets(first.contextFlags).has(0));
    Assert.isTrue(first.unclosedTypeArgumentOffsets.has(6));
    Assert.areEqual(source, first.source);
  }

  @TestMethod
  public clearsRecognitionCachesWithoutReplacingTheirCollections(): void {
    const context = new TypeScriptParserContext(new Source("value < other"));
    const arrows = context.getRejectedArrowOffsets(context.contextFlags);
    const typeArguments = context.unclosedTypeArgumentOffsets;
    arrows.add(0);
    typeArguments.add(6);

    context.clearRecognitionCaches();

    Assert.areEqual(arrows, context.getRejectedArrowOffsets(context.contextFlags));
    Assert.areEqual(typeArguments, context.unclosedTypeArgumentOffsets);
    Assert.areEqual(0, arrows.size);
    Assert.areEqual(0, typeArguments.size);
  }

  @TestMethod
  public scopesRecoveryBoundariesAndReusesIdenticalActiveKinds(): void {
    const braceParser = TypeScriptParserFixture.create("}");
    const bracketParser = TypeScriptParserFixture.create("]");
    const context = braceParser.context;
    const rootCache = context.getRejectedArrowOffsets(context.contextFlags);
    Assert.isFalse(context.isListBoundary(braceParser));
    context.enterList(TypeScriptListKind.EnumMembers);
    const braceCache = context.getRejectedArrowOffsets(context.contextFlags);
    Assert.areNotEqual(rootCache, braceCache);
    Assert.isTrue(context.isListBoundary(braceParser));
    context.enterList(TypeScriptListKind.TupleElementTypes);
    const nestedCache = context.getRejectedArrowOffsets(context.contextFlags);
    Assert.areNotEqual(braceCache, nestedCache);
    Assert.isTrue(context.isListBoundary(braceParser));
    context.enterList(TypeScriptListKind.EnumMembers);
    Assert.areEqual(nestedCache, context.getRejectedArrowOffsets(context.contextFlags));
    context.leaveList();
    context.leaveList();
    Assert.areEqual(braceCache, context.getRejectedArrowOffsets(context.contextFlags));
    context.leaveList();
    Assert.areEqual(rootCache, context.getRejectedArrowOffsets(context.contextFlags));
    context.enterList(TypeScriptListKind.EnumMembers);
    Assert.areEqual(braceCache, context.getRejectedArrowOffsets(context.contextFlags));
    context.leaveList();
    context.clearRecognitionCaches();
    context.enterList(TypeScriptListKind.EnumMembers);
    Assert.areNotEqual(braceCache, context.getRejectedArrowOffsets(context.contextFlags));
    context.leaveList();

    const bracketContext = bracketParser.context;
    Assert.isFalse(bracketContext.isListBoundary(bracketParser));
    bracketContext.enterList(TypeScriptListKind.EnumMembers);
    Assert.isFalse(bracketContext.isListBoundary(bracketParser));
    bracketContext.hasReadListBoundary = false;
    bracketContext.enterList(TypeScriptListKind.TupleElementTypes);
    Assert.isTrue(bracketContext.isListBoundary(bracketParser));
    Assert.isTrue(bracketContext.hasReadListBoundary);
    bracketContext.leaveList();
    bracketContext.leaveList();
  }
}
