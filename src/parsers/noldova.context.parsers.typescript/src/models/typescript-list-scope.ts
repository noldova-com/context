/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TypeScriptContextFlags } from "../enums/typescript-context-flags.js";
import type { TypeScriptListKind } from "../enums/typescript-list-kind.js";

export class TypeScriptListScope {
  public readonly parent: TypeScriptListScope | undefined;
  public readonly kind: TypeScriptListKind | undefined;
  public readonly nestedScopes: Map<TypeScriptListKind, TypeScriptListScope> = new Map();
  public readonly rejectedArrowOffsetsByContext: Map<TypeScriptContextFlags, Set<number>> = new Map();

  public constructor(parent?: TypeScriptListScope, kind?: TypeScriptListKind) {
    this.parent = parent;
    this.kind = kind;
  }
}
