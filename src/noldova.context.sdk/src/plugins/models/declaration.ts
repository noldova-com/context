/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { SourceFile } from "./source-file.js";

export class Declaration {
  public readonly name: string;
  public readonly source: SourceFile;
  public readonly node: Node;

  public constructor(name: string, source: SourceFile, node: Node) {
    this.name = name;
    this.source = source;
    this.node = node;
  }
}
