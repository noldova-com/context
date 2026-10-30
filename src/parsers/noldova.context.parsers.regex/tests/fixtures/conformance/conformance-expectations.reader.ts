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

import { ExpectationsManifest } from "./expectations-manifest.js";
import { ExpectedCaseRecord } from "./expected-case-record.js";
import { JsonObject } from "./json-object.js";

export class ConformanceExpectationsReader {
  public static readonly CONFORMANCE_DIRECTORY: string = "src/parsers/noldova.context.parsers.regex/tests/conformance";
  private static readonly CASES_DIRECTORY: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, "cases");
  private static readonly PATTERNS_NAME: string = "expected/patterns.jsonl";
  private static readonly PATTERNS_PATH: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, ConformanceExpectationsReader.PATTERNS_NAME);
  private static readonly MANIFEST_PATH: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, "expected/MANIFEST.json");
  private static readonly CASE_EXTENSION: string = ".js";
  private static readonly LINE_FEED: string = "\n";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  private static instance: ConformanceExpectationsReader | undefined;

  public readonly manifest: ExpectationsManifest;
  public readonly records: ReadonlyMap<string, ExpectedCaseRecord>;
  public readonly applicableRecords: ReadonlyMap<string, ExpectedCaseRecord>;

  private constructor(manifest: ExpectationsManifest, records: ReadonlyMap<string, ExpectedCaseRecord>) {
    this.manifest = manifest;
    this.records = records;
    this.applicableRecords = new Map([...records].filter(([, record]) => record.isApplicable));
  }

  public static load(): ConformanceExpectationsReader {
    if (ConformanceExpectationsReader.instance !== undefined)
      return ConformanceExpectationsReader.instance;

    const manifest = ExpectationsManifest.parse(readFileSync(ConformanceExpectationsReader.MANIFEST_PATH, ConformanceExpectationsReader.TEXT_ENCODING));
    const records = new Map<string, ExpectedCaseRecord>();
    const lines = readFileSync(ConformanceExpectationsReader.PATTERNS_PATH, ConformanceExpectationsReader.TEXT_ENCODING)
      .split(ConformanceExpectationsReader.LINE_FEED);
    for (const [index, line] of lines.entries())
      if (line.length !== 0) {
        const record = ExpectedCaseRecord.from(JsonObject.parse(line, `${ConformanceExpectationsReader.PATTERNS_NAME}:${index + 1}`));
        records.set(record.path, record);
      }

    ConformanceExpectationsReader.instance = new ConformanceExpectationsReader(manifest, records);

    return ConformanceExpectationsReader.instance;
  }

  public casePath(record: ExpectedCaseRecord): string {
    return path.join(ConformanceExpectationsReader.CASES_DIRECTORY, record.path);
  }

  public listCases(): readonly string[] {
    return readdirSync(ConformanceExpectationsReader.CASES_DIRECTORY, { recursive: true, withFileTypes: true })
      .filter(t => t.isFile() && t.name.endsWith(ConformanceExpectationsReader.CASE_EXTENSION))
      .map(t => path.relative(ConformanceExpectationsReader.CASES_DIRECTORY, path.join(t.parentPath, t.name)).split(path.sep).join(path.posix.sep))
      .sort();
  }
}
