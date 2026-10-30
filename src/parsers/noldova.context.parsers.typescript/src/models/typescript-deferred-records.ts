/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptParameterNode } from "./nodes/declarations/typescript-parameter.node.js";
import type { TypeScriptObjectLiteralExpressionNode } from "./nodes/expressions/typescript-object-literal-expression.node.js";
import { TypeScriptRecordMark } from "./typescript-record-mark.js";
import type { TypeScriptRegionSet } from "./typescript-region-set.js";
import { TypeScriptReservedBindingName } from "./typescript-reserved-binding-name.js";
import type { TypeScriptWrittenAwait } from "./typescript-written-await.js";

export class TypeScriptDeferredRecords {
  private readonly reservedNames: TypeScriptReservedBindingName[] = [];
  private readonly reservedNameNodes: Set<Node> = new Set();

  public hasImportMeta: boolean = false;
  public awaitNameCount: number = 0;
  public readonly writtenAwaits: TypeScriptWrittenAwait[] = [];
  public readonly writtenGlobalExports: Node[] = [];
  public readonly writtenTypePredicates: Node[] = [];
  public readonly writtenObjectLiterals: TypeScriptObjectLiteralExpressionNode[] = [];
  public readonly patternLiterals: Node[] = [];
  public readonly misplacedParameterProperties: TypeScriptParameterNode[] = [];
  public readonly uncheckedSpans: SourceSpan[] = [];
  public readonly commentDirectiveOffsets: number[] = [];

  public get reservedBindingNames(): readonly TypeScriptReservedBindingName[] {
    return this.reservedNames;
  }

  public recordReservedBindingName(reservedName: TypeScriptReservedBindingName): void {
    if (this.reservedNameNodes.has(reservedName.nameNode))
      return;

    this.reservedNames.push(reservedName);
    this.reservedNameNodes.add(reservedName.nameNode);
  }

  public readReservedNameAsBinding(nameNode: Node): void {
    const index = this.reservedNames.findLastIndex(t => t.nameNode === nameNode);
    if (index < 0)
      return;

    const reservedName = this.reservedNames[index]!;
    this.reservedNames[index] = new TypeScriptReservedBindingName(nameNode, reservedName.reservation, reservedName.hasEnclosingClass,
      reservedName.isAwaitContext, false);
  }

  public mark(): TypeScriptRecordMark {
    return new TypeScriptRecordMark(this.hasImportMeta, this.awaitNameCount, this.writtenAwaits.length, this.writtenGlobalExports.length,
      this.reservedNames.length, this.writtenTypePredicates.length, this.writtenObjectLiterals.length, this.patternLiterals.length,
      this.misplacedParameterProperties.length, this.uncheckedSpans.length, this.commentDirectiveOffsets.length);
  }

  public release(mark: TypeScriptRecordMark): void {
    this.hasImportMeta = mark.hasImportMeta;
    this.awaitNameCount = mark.awaitNameCount;
    this.writtenAwaits.length = mark.writtenAwaitCount;
    this.writtenGlobalExports.length = mark.writtenGlobalExportCount;
    for (let index = mark.reservedBindingNameCount; index < this.reservedNames.length; index++)
      this.reservedNameNodes.delete(this.reservedNames[index]!.nameNode);
    this.reservedNames.length = mark.reservedBindingNameCount;
    this.writtenTypePredicates.length = mark.writtenTypePredicateCount;
    this.writtenObjectLiterals.length = mark.writtenObjectLiteralCount;
    this.patternLiterals.length = mark.patternLiteralCount;
    this.misplacedParameterProperties.length = mark.misplacedParameterPropertyCount;
    this.uncheckedSpans.length = mark.uncheckedSpanCount;
    this.commentDirectiveOffsets.length = mark.commentDirectiveOffsetCount;
  }

  public replaceRegions(regions: TypeScriptRegionSet, regionRecords: readonly TypeScriptDeferredRecords[]): void {
    TypeScriptDeferredRecords.replace(this.reservedNames, regions, regionRecords.map(t => t.reservedNames), t => t.nameNode.span.startOffset);
    this.reservedNameNodes.clear();
    for (const reservedName of this.reservedNames)
      this.reservedNameNodes.add(reservedName.nameNode);
    TypeScriptDeferredRecords.replace(this.writtenAwaits, regions, regionRecords.map(t => t.writtenAwaits), t => t.keywordNode.span.startOffset);
    TypeScriptDeferredRecords.replace(this.writtenGlobalExports, regions, regionRecords.map(t => t.writtenGlobalExports), t => t.span.startOffset);
    TypeScriptDeferredRecords.replace(this.writtenTypePredicates, regions, regionRecords.map(t => t.writtenTypePredicates), t => t.span.startOffset);
    TypeScriptDeferredRecords.replace(this.writtenObjectLiterals, regions, regionRecords.map(t => t.writtenObjectLiterals), t => t.span.startOffset);
    TypeScriptDeferredRecords.replace(this.patternLiterals, regions, regionRecords.map(t => t.patternLiterals), t => t.span.startOffset);
    TypeScriptDeferredRecords.replace(this.misplacedParameterProperties, regions, regionRecords.map(t => t.misplacedParameterProperties),
      t => t.span.startOffset);
    TypeScriptDeferredRecords.replace(this.uncheckedSpans, regions, regionRecords.map(t => t.uncheckedSpans), t => t.startOffset);
    TypeScriptDeferredRecords.replace(this.commentDirectiveOffsets, regions, regionRecords.map(t => t.commentDirectiveOffsets), t => t);
  }

  private static replace<TRecord>(records: TRecord[], regions: TypeScriptRegionSet, regionRecords: readonly (readonly TRecord[])[],
    getOffset: (record: TRecord) => number): void {
    let keptCount = 0;
    for (const record of records)
      if (!regions.contains(getOffset(record)))
        records[keptCount++] = record;
    records.length = keptCount;
    for (const regionList of regionRecords)
      for (const record of regionList)
        records.push(record);
  }
}
