/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptOpenBraceNode,
  TypeScriptParameterNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptNameReservation } from "@noldova/context.parsers.typescript/enums/typescript-name-reservation.js";
import { TypeScriptDeferredRecords } from "@noldova/context.parsers.typescript/models/typescript-deferred-records.js";
import { TypeScriptRegionSet } from "@noldova/context.parsers.typescript/models/typescript-region-set.js";
import { TypeScriptReservedBindingName } from "@noldova/context.parsers.typescript/models/typescript-reserved-binding-name.js";
import { TypeScriptWrittenAwait } from "@noldova/context.parsers.typescript/models/typescript-written-await.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDeferredRecordsTests {
  @TestMethod
  public releasesEveryRecordWrittenAfterItsMark(): void {
    const records = new TypeScriptDeferredRecords();
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    records.writtenAwaits.push(new TypeScriptWrittenAwait(nameNode, false, true));
    records.uncheckedSpans.push(nameNode.span);
    records.commentDirectiveOffsets.push(0);
    const mark = records.mark();
    records.hasImportMeta = true;
    records.writtenAwaits.push(new TypeScriptWrittenAwait(nameNode, true, false));
    records.writtenGlobalExports.push(nameNode);
    records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.Strict, false, false, true));
    records.writtenTypePredicates.push(nameNode);
    records.writtenObjectLiterals.push(
      new TypeScriptObjectLiteralExpressionNode(new TypeScriptOpenBraceNode(new SourceSpan(0, 1)), [], [], new SourceSpan(0, 1)));
    records.patternLiterals.push(nameNode);
    records.misplacedParameterProperties.push(new TypeScriptParameterNode([], nameNode.span, nameNode));
    records.uncheckedSpans.push(nameNode.span);
    records.commentDirectiveOffsets.push(1);

    records.release(mark);

    Assert.isFalse(records.hasImportMeta);
    Assert.areEqual(1, records.writtenAwaits.length);
    Assert.areEqual(false, records.writtenAwaits[0]?.isForAwait);
    Assert.areEqual(0, records.writtenGlobalExports.length);
    Assert.areEqual(0, records.reservedBindingNames.length);
    Assert.areEqual(0, records.writtenTypePredicates.length);
    Assert.areEqual(0, records.writtenObjectLiterals.length);
    Assert.areEqual(0, records.patternLiterals.length);
    Assert.areEqual(0, records.misplacedParameterProperties.length);
    Assert.areEqual(1, records.uncheckedSpans.length);
    Assert.areEqual(1, records.commentDirectiveOffsets.length);
  }

  @TestMethod
  public recordsAReservedNameOnce(): void {
    const records = new TypeScriptDeferredRecords();
    const nameNode = new TypeScriptIdentifierNode("eval", new SourceSpan(0, 4));
    const first = new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.EvalOrArguments, false, false, true);
    records.recordReservedBindingName(first);
    records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.EvalOrArguments, true, true, false));

    Assert.areEqual(1, records.reservedBindingNames.length);
    Assert.areEqual(first, records.reservedBindingNames[0]);
  }

  @TestMethod
  public recordsANameAgainOnceTheReadThatRecordedItIsReleased(): void {
    const records = new TypeScriptDeferredRecords();
    const nameNode = new TypeScriptIdentifierNode("eval", new SourceSpan(0, 4));
    const mark = records.mark();
    records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.EvalOrArguments, false, false, true));
    records.release(mark);
    const second = new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.EvalOrArguments, true, true, false);
    records.recordReservedBindingName(second);

    Assert.areEqual(1, records.reservedBindingNames.length);
    Assert.areEqual(second, records.reservedBindingNames[0]);
  }

  @TestMethod
  public restoresTheImportMetaFlagTheMarkSaw(): void {
    const records = new TypeScriptDeferredRecords();
    records.hasImportMeta = true;
    const mark = records.mark();
    records.hasImportMeta = false;

    records.release(mark);

    Assert.isTrue(records.hasImportMeta);
  }

  @TestMethod
  public restoresTheAwaitNameCountTheMarkSaw(): void {
    const records = new TypeScriptDeferredRecords();
    records.awaitNameCount = 1;
    const mark = records.mark();
    records.awaitNameCount = 3;

    records.release(mark);

    Assert.areEqual(1, records.awaitNameCount);
  }

  @TestMethod
  public readsARecordedNameAsANestedBinding(): void {
    const records = new TypeScriptDeferredRecords();
    const nameNode = new TypeScriptIdentifierNode("await", new SourceSpan(0, 5));
    const otherNode = new TypeScriptIdentifierNode("await", new SourceSpan(6, 5));
    records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.Await, true, true, true));

    records.readReservedNameAsBinding(otherNode);
    records.readReservedNameAsBinding(nameNode);

    Assert.areEqual(1, records.reservedBindingNames.length);
    Assert.areEqual(nameNode, records.reservedBindingNames[0]?.nameNode);
    Assert.isTrue(records.reservedBindingNames[0]!.isAwaitContext);
    Assert.isFalse(records.reservedBindingNames[0]!.isSourceTopLevel);
  }

  @TestMethod
  public replacesEveryRecordARegionReadsAgain(): void {
    const records = new TypeScriptDeferredRecords();
    const outsideNode = new TypeScriptIdentifierNode("eval", new SourceSpan(0, 4));
    const insideNode = new TypeScriptIdentifierNode("eval", new SourceSpan(10, 4));
    const regionNode = new TypeScriptIdentifierNode("eval", new SourceSpan(12, 4));
    const regionRecords = new TypeScriptDeferredRecords();
    for (const [target, node] of [[records, outsideNode], [records, insideNode], [regionRecords, regionNode]] as const) {
      target.recordReservedBindingName(new TypeScriptReservedBindingName(node, TypeScriptNameReservation.EvalOrArguments, false, false, true));
      target.writtenAwaits.push(new TypeScriptWrittenAwait(node, false, true));
      target.writtenGlobalExports.push(node);
      target.writtenTypePredicates.push(node);
      target.writtenObjectLiterals.push(
        new TypeScriptObjectLiteralExpressionNode(new TypeScriptOpenBraceNode(node.span), [], [], node.span));
      target.patternLiterals.push(node);
      target.misplacedParameterProperties.push(new TypeScriptParameterNode([], node.span, node));
      target.uncheckedSpans.push(node.span);
      target.commentDirectiveOffsets.push(node.span.startOffset);
    }

    records.replaceRegions(new TypeScriptRegionSet([new SourceSpan(10, 10)]), [regionRecords]);

    Assert.areEqual("0,12", records.reservedBindingNames.map(t => t.nameNode.span.startOffset).join(","));
    Assert.areEqual("0,12", records.writtenAwaits.map(t => t.keywordNode.span.startOffset).join(","));
    Assert.areEqual("0,12", records.writtenGlobalExports.map(t => t.span.startOffset).join(","));
    Assert.areEqual("0,12", records.writtenTypePredicates.map(t => t.span.startOffset).join(","));
    Assert.areEqual("0,12", records.writtenObjectLiterals.map(t => t.span.startOffset).join(","));
    Assert.areEqual("0,12", records.patternLiterals.map(t => t.span.startOffset).join(","));
    Assert.areEqual("0,12", records.misplacedParameterProperties.map(t => t.span.startOffset).join(","));
    Assert.areEqual("0,12", records.uncheckedSpans.map(t => t.startOffset).join(","));
    Assert.areEqual("0,12", records.commentDirectiveOffsets.join(","));
    records.recordReservedBindingName(new TypeScriptReservedBindingName(insideNode, TypeScriptNameReservation.EvalOrArguments, false, false, true));
    records.recordReservedBindingName(new TypeScriptReservedBindingName(regionNode, TypeScriptNameReservation.EvalOrArguments, false, false, true));
    Assert.areEqual("0,12,10", records.reservedBindingNames.map(t => t.nameNode.span.startOffset).join(","));
  }
}
