/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ProcessRow {
  public readonly processId: number;
  public readonly parentId: number;
  public readonly created: string | undefined;

  public constructor(processId: number, parentId: number, created: string | undefined) {
    this.processId = processId;
    this.parentId = parentId;
    this.created = created;
  }

  public static parse(line: string): ProcessRow | undefined {
    const fields = line.trim().split(/\s+/u);
    if (fields.length < 2 || fields.length > 3)
      return undefined;

    return new ProcessRow(Number(fields[0]), Number(fields[1]), fields[2]);
  }
}
