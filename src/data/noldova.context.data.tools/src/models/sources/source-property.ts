/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class SourceProperty {
  public readonly name: string;
  public readonly typeNode: Node | undefined;
  public readonly isOptional: boolean;

  public constructor(name: string, typeNode: Node | undefined, isOptional: boolean) {
    this.name = name;
    this.typeNode = typeNode;
    this.isOptional = isOptional;
  }
}
