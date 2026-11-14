/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TypeScriptSpellingDistanceRow {
  private readonly distances: Map<number, number> = new Map();
  private readonly outsideDistance: number;

  public constructor(outsideDistance: number) {
    this.outsideDistance = outsideDistance;
  }

  public read(column: number): number {
    return this.distances.get(column) ?? this.outsideDistance;
  }

  public write(column: number, distance: number): void {
    this.distances.set(column, distance);
  }
}
