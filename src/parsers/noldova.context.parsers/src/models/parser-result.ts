/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic } from "@noldova/context.diagnostics";

import type { Node } from "./nodes/node.js";

export class ParserResult<TNode extends Node> {
  public readonly diagnostics: readonly Diagnostic[];
  public readonly rootNode: TNode;

  public constructor(rootNode: TNode, diagnostics: readonly Diagnostic[]) {
    this.rootNode = rootNode;
    this.diagnostics = [...diagnostics];
  }
}
