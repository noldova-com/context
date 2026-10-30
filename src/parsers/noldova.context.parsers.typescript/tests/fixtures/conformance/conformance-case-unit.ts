/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { createHash } from "node:crypto";

import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";

export class ConformanceCaseUnit {
  private static readonly DECLARATION_PATTERN: RegExp = /\.d\.(?:ts|mts|cts|[^\\/]+\.ts)$/iu;
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly SOURCE_PATTERN: RegExp = /\.(?:ts|mts|cts)$/iu;

  public readonly name: string;
  public readonly content: string;
  public readonly sha256: string;

  public constructor(name: string, content: string) {
    this.name = name;
    this.content = content;
    this.sha256 = createHash(ConformanceCaseUnit.HASH_ALGORITHM).update(content).digest("hex");
  }

  public get isSource(): boolean {
    return ConformanceCaseUnit.SOURCE_PATTERN.test(this.name);
  }

  public get kind(): TypeScriptSourceKind {
    return ConformanceCaseUnit.DECLARATION_PATTERN.test(this.name) ? TypeScriptSourceKind.Declaration : TypeScriptSourceKind.Code;
  }
}
