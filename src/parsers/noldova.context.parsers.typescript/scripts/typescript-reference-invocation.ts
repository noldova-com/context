/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type BinaryToTextEncoding, createHash } from "node:crypto";

export default class TypeScriptReferenceInvocation {
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: BinaryToTextEncoding = "hex";

  public static readonly COMPILER_OPTIONS: Readonly<Record<string, boolean | string | readonly string[]>> = {
    noEmit: true,
    target: "esnext",
    module: "esnext",
    moduleResolution: "bundler",
    strict: true,
    allowUnreachableCode: false,
    allowUnusedLabels: false,
    exactOptionalPropertyTypes: true,
    forceConsistentCasingInFileNames: true,
    noErrorTruncation: true,
    noFallthroughCasesInSwitch: true,
    noImplicitOverride: true,
    noImplicitReturns: true,
    noPropertyAccessFromIndexSignature: true,
    noUncheckedIndexedAccess: true,
    noUncheckedSideEffectImports: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    skipLibCheck: false,
    types: [],
  };

  private static serialize(): string {
    return JSON.stringify(TypeScriptReferenceInvocation.COMPILER_OPTIONS);
  }

  public static hash(): string {
    return createHash(TypeScriptReferenceInvocation.HASH_ALGORITHM)
      .update(TypeScriptReferenceInvocation.serialize())
      .digest(TypeScriptReferenceInvocation.HASH_ENCODING);
  }
}
