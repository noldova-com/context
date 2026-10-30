/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TypeScriptRecordMark {
  public readonly hasImportMeta: boolean;
  public readonly awaitNameCount: number;
  public readonly commentDirectiveOffsetCount: number;
  public readonly misplacedParameterPropertyCount: number;
  public readonly patternLiteralCount: number;
  public readonly reservedBindingNameCount: number;
  public readonly uncheckedSpanCount: number;
  public readonly writtenAwaitCount: number;
  public readonly writtenGlobalExportCount: number;
  public readonly writtenObjectLiteralCount: number;
  public readonly writtenTypePredicateCount: number;

  public constructor(
    hasImportMeta: boolean,
    awaitNameCount: number,
    writtenAwaitCount: number,
    writtenGlobalExportCount: number,
    reservedBindingNameCount: number,
    writtenTypePredicateCount: number,
    writtenObjectLiteralCount: number,
    patternLiteralCount: number,
    misplacedParameterPropertyCount: number,
    uncheckedSpanCount: number,
    commentDirectiveOffsetCount: number) {
    this.hasImportMeta = hasImportMeta;
    this.awaitNameCount = awaitNameCount;
    this.writtenAwaitCount = writtenAwaitCount;
    this.writtenGlobalExportCount = writtenGlobalExportCount;
    this.reservedBindingNameCount = reservedBindingNameCount;
    this.writtenTypePredicateCount = writtenTypePredicateCount;
    this.writtenObjectLiteralCount = writtenObjectLiteralCount;
    this.patternLiteralCount = patternLiteralCount;
    this.misplacedParameterPropertyCount = misplacedParameterPropertyCount;
    this.uncheckedSpanCount = uncheckedSpanCount;
    this.commentDirectiveOffsetCount = commentDirectiveOffsetCount;
  }
}
