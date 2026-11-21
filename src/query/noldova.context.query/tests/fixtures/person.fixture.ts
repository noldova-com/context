/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Person {
  public readonly name: string;
  public readonly age: number;

  public constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public get initial(): string {
    return this.name.charAt(0);
  }

  public describe(prefix: string): string {
    return `${prefix} ${this.name}`;
  }
}
