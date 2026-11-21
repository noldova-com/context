/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Person {
  public readonly id: number;
  public readonly name: string;

  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}
