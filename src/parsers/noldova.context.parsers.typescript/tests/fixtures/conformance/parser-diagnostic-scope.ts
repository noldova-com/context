/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export class ParserDiagnosticScope {
  private static readonly CATALOG_FILE_NAME: string = "typescript-diagnostic-templates.ts";
  private static readonly CODE_PATTERN: RegExp = /TypeScriptDiagnosticTemplates\.TS(\d+)/gu;
  private static readonly SOURCE_DIRECTORY: string = "src/parsers/noldova.context.parsers.typescript/src";
  private static readonly SOURCE_EXTENSION: string = ".ts";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  private static instance: ParserDiagnosticScope | undefined;

  private readonly codes: ReadonlySet<number>;

  private constructor(codes: ReadonlySet<number>) {
    this.codes = codes;
  }

  public static load(): ParserDiagnosticScope {
    if (ParserDiagnosticScope.instance !== undefined)
      return ParserDiagnosticScope.instance;

    const codes = new Set<number>();
    for (const entry of readdirSync(ParserDiagnosticScope.SOURCE_DIRECTORY, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(ParserDiagnosticScope.SOURCE_EXTENSION) || entry.name === ParserDiagnosticScope.CATALOG_FILE_NAME)
        continue;

      const content = readFileSync(path.join(entry.parentPath, entry.name), ParserDiagnosticScope.TEXT_ENCODING);
      for (const match of content.matchAll(ParserDiagnosticScope.CODE_PATTERN))
        codes.add(Number.parseInt(match[1]!, 10));
    }

    ParserDiagnosticScope.instance = new ParserDiagnosticScope(codes);

    return ParserDiagnosticScope.instance;
  }

  public has(code: number): boolean {
    return this.codes.has(code);
  }
}
