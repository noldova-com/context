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

import { Assert } from "@noldova/context.testing";

import { ApplicableCaseRecord } from "./applicable-case-record.js";
import { ConformanceCaseSplitter } from "./conformance-case-splitter.js";
import type { ConformanceCaseUnit } from "./conformance-case-unit.js";
import { ExpectationsManifest } from "./expectations-manifest.js";
import type { ExpectedCaseRecord } from "./expected-case-record.js";
import { InapplicableCaseRecord } from "./inapplicable-case-record.js";
import { JsonObject } from "./json-object.js";

export class ConformanceExpectationsReader {
  public static readonly CONFORMANCE_DIRECTORY: string = "src/parsers/noldova.context.parsers.typescript/tests/conformance";
  private static readonly APPLICABLE: string = "applicable";
  private static readonly CASES_DIRECTORY: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, "cases");
  private static readonly DIAGNOSTICS_NAME: string = "expected/diagnostics.jsonl";
  private static readonly DIAGNOSTICS_PATH: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, ConformanceExpectationsReader.DIAGNOSTICS_NAME);
  private static readonly LINE_FEED: string = "\n";
  private static readonly MANIFEST_PATH: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, "expected/MANIFEST.json");
  private static readonly SEPARATOR: string = "/";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  private static instance: ConformanceExpectationsReader | undefined;

  public readonly manifest: ExpectationsManifest;
  public readonly records: ReadonlyMap<string, ExpectedCaseRecord>;
  public readonly applicableRecords: ReadonlyMap<string, ApplicableCaseRecord>;
  public readonly inapplicableRecords: ReadonlyMap<string, InapplicableCaseRecord>;

  private constructor(manifest: ExpectationsManifest, applicableRecords: ReadonlyMap<string, ApplicableCaseRecord>,
    inapplicableRecords: ReadonlyMap<string, InapplicableCaseRecord>, records: ReadonlyMap<string, ExpectedCaseRecord>) {
    this.manifest = manifest;
    this.applicableRecords = applicableRecords;
    this.inapplicableRecords = inapplicableRecords;
    this.records = records;
  }

  public static load(): ConformanceExpectationsReader {
    if (ConformanceExpectationsReader.instance !== undefined)
      return ConformanceExpectationsReader.instance;

    const manifest = ExpectationsManifest.parse(readFileSync(ConformanceExpectationsReader.MANIFEST_PATH, ConformanceExpectationsReader.TEXT_ENCODING));
    const records = new Map<string, ExpectedCaseRecord>();
    const applicableRecords = new Map<string, ApplicableCaseRecord>();
    const inapplicableRecords = new Map<string, InapplicableCaseRecord>();
    const lines = readFileSync(ConformanceExpectationsReader.DIAGNOSTICS_PATH, ConformanceExpectationsReader.TEXT_ENCODING).split(ConformanceExpectationsReader.LINE_FEED);
    for (const [index, line] of lines.entries()) {
      if (line.length === 0)
        continue;

      const object = JsonObject.parse(line, `${ConformanceExpectationsReader.DIAGNOSTICS_NAME}:${index + 1}`);
      if (object.string("applicability") === ConformanceExpectationsReader.APPLICABLE) {
        const record = ApplicableCaseRecord.from(object);
        applicableRecords.set(record.path, record);
        records.set(record.path, record);
      }
      else {
        const record = InapplicableCaseRecord.from(object);
        inapplicableRecords.set(record.path, record);
        records.set(record.path, record);
      }
    }

    ConformanceExpectationsReader.instance = new ConformanceExpectationsReader(manifest, applicableRecords, inapplicableRecords, records);

    return ConformanceExpectationsReader.instance;
  }

  public casePath(record: ExpectedCaseRecord): string {
    return path.join(ConformanceExpectationsReader.CASES_DIRECTORY, record.path);
  }

  public listCases(): readonly string[] {
    return readdirSync(ConformanceExpectationsReader.CASES_DIRECTORY, { recursive: true, withFileTypes: true })
      .filter(t => t.isFile())
      .map(t => path.relative(ConformanceExpectationsReader.CASES_DIRECTORY, path.join(t.parentPath, t.name)).split(path.sep)
        .join(ConformanceExpectationsReader.SEPARATOR))
      .sort();
  }

  public readUnits(record: ApplicableCaseRecord): readonly ConformanceCaseUnit[] {
    const units = ConformanceCaseSplitter.read(this.casePath(record));
    Assert.areEqual(record.files.length, units.length, `${record.path}: the runner split a different number of units than the reference compiled.`);
    for (const [index, file] of record.files.entries()) {
      Assert.areEqual(file.name, units[index]!.name, `${record.path}: unit ${index} is named differently than the reference named it.`);
      Assert.areEqual(file.sha256, units[index]!.sha256, `${record.path}: unit "${file.name}" differs from what the reference compiled.`);
    }

    return units;
  }
}
