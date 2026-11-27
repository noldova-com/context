/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class SourceMapping {
  public readonly column: number;
  public readonly sourceIndex: number;
  public readonly line: number;
  public readonly character: number;
  public readonly nameIndex: number;
  public readonly fieldCount: number;

  public constructor(column: number, sourceIndex: number, line: number, character: number, nameIndex: number, fieldCount: number) {
    this.column = column;
    this.sourceIndex = sourceIndex;
    this.line = line;
    this.character = character;
    this.nameIndex = nameIndex;
    this.fieldCount = fieldCount;
  }

  public get hasSource(): boolean {
    return this.fieldCount >= 4;
  }

  public withSource(sourceIndex: number, line: number, character: number): SourceMapping {
    return new SourceMapping(this.column, sourceIndex, line, character, this.nameIndex, this.fieldCount);
  }
}
