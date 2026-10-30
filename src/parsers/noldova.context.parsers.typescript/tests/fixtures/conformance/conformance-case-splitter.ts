/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFileSync } from "node:fs";
import path from "node:path";

import { ConformanceCaseUnit } from "./conformance-case-unit.js";

export class ConformanceCaseSplitter {
  private static readonly BYTE_ORDER_MARK: string = String.fromCharCode(0xFEFF);
  private static readonly CURRENT_DIRECTORY_PREFIX: string = "./";
  private static readonly DIRECTIVE_PATTERN: RegExp = /^\/\/\s*@(\w+)\s*:\s*([^\r\n]*)/u;
  private static readonly DRIVE_LETTER_PATTERN: RegExp = /^([A-Za-z]):\/?/u;
  private static readonly FILENAME_DIRECTIVE: string = "filename";
  private static readonly LINE_BREAK_PATTERN: RegExp = /\r?\n/u;
  private static readonly LINE_FEED: string = "\n";
  private static readonly SEPARATOR: string = "/";
  private static readonly UTF16_BIG_ENDIAN_MARK: readonly number[] = [0xFE, 0xFF];
  private static readonly UTF16_ENCODING: BufferEncoding = "utf16le";
  private static readonly UTF16_LITTLE_ENDIAN_MARK: readonly number[] = [0xFF, 0xFE];
  private static readonly WINDOWS_SEPARATOR: string = "\\";

  public static read(casePath: string): readonly ConformanceCaseUnit[] {
    return ConformanceCaseSplitter.split(path.basename(casePath), ConformanceCaseSplitter.decode(readFileSync(casePath)));
  }

  private static decode(bytes: Buffer): string {
    if (ConformanceCaseSplitter.startsWith(bytes, ConformanceCaseSplitter.UTF16_LITTLE_ENDIAN_MARK))
      return bytes.subarray(ConformanceCaseSplitter.UTF16_LITTLE_ENDIAN_MARK.length).toString(ConformanceCaseSplitter.UTF16_ENCODING);

    if (ConformanceCaseSplitter.startsWith(bytes, ConformanceCaseSplitter.UTF16_BIG_ENDIAN_MARK))
      return Buffer.from(bytes.subarray(ConformanceCaseSplitter.UTF16_BIG_ENDIAN_MARK.length)).swap16().toString(ConformanceCaseSplitter.UTF16_ENCODING);

    const text = bytes.toString();

    return text.startsWith(ConformanceCaseSplitter.BYTE_ORDER_MARK) ? text.slice(ConformanceCaseSplitter.BYTE_ORDER_MARK.length) : text;
  }

  private static startsWith(bytes: Buffer, mark: readonly number[]): boolean {
    return mark.every((t, index) => bytes[index] === t);
  }

  private static split(baseName: string, content: string): readonly ConformanceCaseUnit[] {
    const units: ConformanceCaseUnit[] = [];
    let unitName: string | undefined;
    let unitLines: string[] = [];

    const flush = (): void => {
      while (unitLines[0] === "")
        unitLines.shift();

      units.push(new ConformanceCaseUnit(unitName ?? baseName, unitLines.join(ConformanceCaseSplitter.LINE_FEED)));
    };

    for (const line of content.split(ConformanceCaseSplitter.LINE_BREAK_PATTERN)) {
      const directive = ConformanceCaseSplitter.DIRECTIVE_PATTERN.exec(line);
      if (directive === null) {
        unitLines.push(line);
        continue;
      }

      if (directive[1]!.toLowerCase() !== ConformanceCaseSplitter.FILENAME_DIRECTIVE)
        continue;

      if (unitName !== undefined)
        flush();

      unitName = ConformanceCaseSplitter.normalizeUnitName(directive[2]!.trim());
      unitLines = [];
    }

    flush();

    return units;
  }

  private static normalizeUnitName(value: string): string {
    let name = value.replaceAll(ConformanceCaseSplitter.WINDOWS_SEPARATOR, ConformanceCaseSplitter.SEPARATOR);
    name = name.replace(ConformanceCaseSplitter.DRIVE_LETTER_PATTERN, `$1${ConformanceCaseSplitter.SEPARATOR}`);
    while (name.startsWith(ConformanceCaseSplitter.CURRENT_DIRECTORY_PREFIX) || name.startsWith(ConformanceCaseSplitter.SEPARATOR))
      name = name.startsWith(ConformanceCaseSplitter.CURRENT_DIRECTORY_PREFIX)
        ? name.slice(ConformanceCaseSplitter.CURRENT_DIRECTORY_PREFIX.length)
        : name.slice(ConformanceCaseSplitter.SEPARATOR.length);

    return name;
  }
}
