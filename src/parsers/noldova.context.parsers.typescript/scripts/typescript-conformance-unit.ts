/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type BinaryToTextEncoding, createHash } from "node:crypto";

import TypeScriptConformanceUnitKind from "./typescript-conformance-unit-kind.ts";

export default class TypeScriptConformanceUnit {
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: BinaryToTextEncoding = "hex";

  public readonly name: string;
  public readonly content: string;
  public readonly kind: TypeScriptConformanceUnitKind;
  public readonly sha256: string;

  public constructor(name: string, content: string) {
    this.name = name;
    this.content = content;
    this.kind = TypeScriptConformanceUnitKind.of(name);
    this.sha256 = createHash(TypeScriptConformanceUnit.HASH_ALGORITHM).update(content).digest(TypeScriptConformanceUnit.HASH_ENCODING);
  }
}
