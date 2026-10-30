/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type BinaryToTextEncoding, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import TypeScriptConformanceUnit from "./typescript-conformance-unit.ts";

export default class TypeScriptConformanceCase {
  public static readonly SPLITTING_VERSION: number = 3;

  private static readonly BYTE_ORDER_MARK: string = String.fromCharCode(0xFEFF);
  private static readonly CURRENT_DIRECTORY_PREFIX: string = "./";
  private static readonly DIRECTIVE_PATTERN: RegExp = /^\/\/\s*@(\w+)\s*:\s*([^\r\n]*)/u;
  private static readonly DRIVE_LETTER_PATTERN: RegExp = /^([A-Za-z]):\/?/u;
  private static readonly FILENAME_DIRECTIVE: string = "filename";
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: BinaryToTextEncoding = "hex";
  private static readonly LIBRARY_DIRECTIVE: string = "lib";
  private static readonly LIBRARY_SEPARATOR: string = ",";
  private static readonly LINE_BREAK_PATTERN: RegExp = /\r?\n/u;
  private static readonly LINE_FEED: string = "\n";
  private static readonly NO_IMPLICIT_REFERENCES_DIRECTIVE: string = "noimplicitreferences";
  private static readonly OTHER_REASON: string = "Other";
  private static readonly REASON_SEPARATOR: string = "+";
  private static readonly REFERENCE_PATTERN: RegExp = /reference\spath/u;
  private static readonly REQUIRE_CALL: string = "require(";
  private static readonly SEPARATOR: string = "/";
  private static readonly UTF16_BIG_ENDIAN_MARK: readonly number[] = [0xFE, 0xFF];
  private static readonly UTF16_ENCODING: BufferEncoding = "utf16le";
  private static readonly UTF16_LITTLE_ENDIAN_MARK: readonly number[] = [0xFF, 0xFE];
  private static readonly WINDOWS_SEPARATOR: string = "\\";

  public readonly path: string;
  public readonly sha256: string;
  public readonly units: readonly TypeScriptConformanceUnit[];
  public readonly libraries: readonly string[] | undefined;
  public readonly hasDiscardedPreamble: boolean;
  public readonly hasRepeatedUnitName: boolean;
  private readonly noImplicitReferences: boolean;

  private constructor(casePath: string, sha256: string, units: readonly TypeScriptConformanceUnit[], libraries: readonly string[] | undefined,
    hasDiscardedPreamble: boolean, hasRepeatedUnitName: boolean, noImplicitReferences: boolean) {
    this.path = casePath;
    this.sha256 = sha256;
    this.units = units;
    this.libraries = libraries;
    this.hasDiscardedPreamble = hasDiscardedPreamble;
    this.hasRepeatedUnitName = hasRepeatedUnitName;
    this.noImplicitReferences = noImplicitReferences;
  }

  public get rootUnits(): readonly TypeScriptConformanceUnit[] {
    const lastUnit = this.units.at(-1)!;
    const isExplicit = this.noImplicitReferences || lastUnit.content.includes(TypeScriptConformanceCase.REQUIRE_CALL)
      || TypeScriptConformanceCase.REFERENCE_PATTERN.test(lastUnit.content);

    return isExplicit ? [lastUnit] : this.units;
  }

  public get isApplicable(): boolean {
    return this.units.some(t => t.kind.isSource) && !this.units.some(t => t.kind.isExcluded);
  }

  public get inapplicabilityReason(): string {
    const excludedKinds = [...new Set(this.units.filter(t => t.kind.isExcluded).map(t => t.kind.name))].sort();

    return excludedKinds.length === 0 ? TypeScriptConformanceCase.OTHER_REASON : excludedKinds.join(TypeScriptConformanceCase.REASON_SEPARATOR);
  }

  public static read(casesDirectory: string, casePath: string): TypeScriptConformanceCase {
    const bytes = readFileSync(path.join(casesDirectory, casePath));
    const sha256 = createHash(TypeScriptConformanceCase.HASH_ALGORITHM).update(bytes).digest(TypeScriptConformanceCase.HASH_ENCODING);

    return TypeScriptConformanceCase.split(casePath, sha256, TypeScriptConformanceCase.decode(bytes));
  }

  private static decode(bytes: Buffer): string {
    if (TypeScriptConformanceCase.startsWith(bytes, TypeScriptConformanceCase.UTF16_LITTLE_ENDIAN_MARK))
      return bytes.subarray(TypeScriptConformanceCase.UTF16_LITTLE_ENDIAN_MARK.length).toString(TypeScriptConformanceCase.UTF16_ENCODING);

    if (TypeScriptConformanceCase.startsWith(bytes, TypeScriptConformanceCase.UTF16_BIG_ENDIAN_MARK))
      return Buffer.from(bytes.subarray(TypeScriptConformanceCase.UTF16_BIG_ENDIAN_MARK.length)).swap16().toString(TypeScriptConformanceCase.UTF16_ENCODING);

    const text = bytes.toString();

    return text.startsWith(TypeScriptConformanceCase.BYTE_ORDER_MARK) ? text.slice(TypeScriptConformanceCase.BYTE_ORDER_MARK.length) : text;
  }

  private static startsWith(bytes: Buffer, mark: readonly number[]): boolean {
    return mark.every((t, index) => bytes[index] === t);
  }

  private static split(casePath: string, sha256: string, content: string): TypeScriptConformanceCase {
    const units: TypeScriptConformanceUnit[] = [];
    let unitName: string | undefined;
    let unitLines: string[] = [];
    let libraries: readonly string[] | undefined;
    let hasDiscardedPreamble = false;
    let hasRepeatedUnitName = false;
    let noImplicitReferences = false;

    const flush = (): void => {
      while (unitLines[0] === "")
        unitLines.shift();

      const unit = new TypeScriptConformanceUnit(unitName ?? path.basename(casePath), unitLines.join(TypeScriptConformanceCase.LINE_FEED));
      if (units.some(t => t.name === unit.name))
        hasRepeatedUnitName = true;
      units.push(unit);
    };

    for (const line of content.split(TypeScriptConformanceCase.LINE_BREAK_PATTERN)) {
      const directive = TypeScriptConformanceCase.DIRECTIVE_PATTERN.exec(line);
      if (directive === null) {
        unitLines.push(line);
        continue;
      }

      const name = directive[1]!.toLowerCase();
      const value = directive[2]!.trim();
      if (name === TypeScriptConformanceCase.FILENAME_DIRECTIVE) {
        if (unitName === undefined)
          hasDiscardedPreamble = unitLines.some(t => t.trim().length !== 0);
        else
          flush();

        unitName = TypeScriptConformanceCase.normalizeUnitName(value);
        unitLines = [];
      }
      else if (name === TypeScriptConformanceCase.LIBRARY_DIRECTIVE)
        libraries = value.split(TypeScriptConformanceCase.LIBRARY_SEPARATOR).map(t => t.trim()).filter(t => t.length !== 0);
      else if (name === TypeScriptConformanceCase.NO_IMPLICIT_REFERENCES_DIRECTIVE)
        noImplicitReferences = value.length !== 0;
    }

    flush();

    return new TypeScriptConformanceCase(casePath, sha256, units, libraries, hasDiscardedPreamble, hasRepeatedUnitName, noImplicitReferences);
  }

  private static normalizeUnitName(value: string): string {
    let name = value.replaceAll(TypeScriptConformanceCase.WINDOWS_SEPARATOR, TypeScriptConformanceCase.SEPARATOR);
    name = name.replace(TypeScriptConformanceCase.DRIVE_LETTER_PATTERN, `$1${TypeScriptConformanceCase.SEPARATOR}`);
    while (name.startsWith(TypeScriptConformanceCase.CURRENT_DIRECTORY_PREFIX) || name.startsWith(TypeScriptConformanceCase.SEPARATOR))
      name = name.startsWith(TypeScriptConformanceCase.CURRENT_DIRECTORY_PREFIX)
        ? name.slice(TypeScriptConformanceCase.CURRENT_DIRECTORY_PREFIX.length)
        : name.slice(TypeScriptConformanceCase.SEPARATOR.length);

    return name;
  }
}
