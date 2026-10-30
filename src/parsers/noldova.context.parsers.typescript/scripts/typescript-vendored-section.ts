/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "node:path";

import type TypeScriptVendoredSelection from "./typescript-vendored-selection.ts";

export default class TypeScriptVendoredSection {
  public readonly upstreamRoots: readonly string[];
  public readonly localRoot: string;
  public readonly selection: TypeScriptVendoredSelection | undefined;

  public constructor(upstreamRoots: readonly string[], localRoot: string, selection?: TypeScriptVendoredSelection) {
    this.upstreamRoots = upstreamRoots;
    this.localRoot = localRoot;
    this.selection = selection;
  }

  public rootOf(upstreamPath: string): string | undefined {
    const root = this.upstreamRoots.find(t => upstreamPath.startsWith(`${t}${path.posix.sep}`));
    return root !== undefined && (this.selection === undefined || this.selection.selects(path.posix.basename(upstreamPath))) ? root : undefined;
  }

  public localPathOf(root: string, upstreamPath: string): string {
    const base = this.upstreamRoots.length === 1 ? root : path.posix.dirname(root);
    return path.posix.join(this.localRoot, upstreamPath.slice(base.length + 1));
  }
}
