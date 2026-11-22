/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export default class TypeScriptExpectedProcessRow {
  private static readonly FIELD_COUNT: number = 3;
  private static readonly SPACES: RegExp = /\s+/u;

  public readonly processId: number;
  public readonly parentId: number;
  public readonly bytes: number;

  private constructor(processId: number, parentId: number, bytes: number) {
    this.processId = processId;
    this.parentId = parentId;
    this.bytes = bytes;
  }

  public static parse(line: string, bytesPerUnit: number): TypeScriptExpectedProcessRow | undefined {
    const fields = line.trim().split(TypeScriptExpectedProcessRow.SPACES).map(Number);
    const [processId, parentId, units] = fields;
    if (fields.length !== TypeScriptExpectedProcessRow.FIELD_COUNT || Object.isUndefined(processId) || Object.isUndefined(parentId) || Object.isUndefined(units) || !fields.every(Number.isSafeInteger))
      return undefined;

    return new TypeScriptExpectedProcessRow(processId, parentId, units * bytesPerUnit);
  }
}
