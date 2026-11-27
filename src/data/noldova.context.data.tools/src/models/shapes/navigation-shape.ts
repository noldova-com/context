/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class NavigationShape {
  public readonly name: string;
  public readonly target: string;
  public readonly isCollection: boolean;

  public constructor(name: string, target: string, isCollection: boolean) {
    this.name = name;
    this.target = target;
    this.isCollection = isCollection;
  }
}
