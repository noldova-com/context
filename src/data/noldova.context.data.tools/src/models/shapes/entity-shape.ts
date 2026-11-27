/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NavigationShape } from "./navigation-shape.js";
import type { PropertyShape } from "./property-shape.js";

export class EntityShape {
  public readonly name: string;
  public readonly properties: readonly PropertyShape[];
  public readonly navigations: readonly NavigationShape[];

  public constructor(name: string, properties: readonly PropertyShape[], navigations: readonly NavigationShape[]) {
    this.name = name;
    this.properties = properties;
    this.navigations = navigations;
  }
}
