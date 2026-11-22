/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { gzipSync } from "node:zlib";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ExtractionCase } from "./fixtures/extraction-case.fixture.js";
import { ExtractionRun } from "./fixtures/extraction-run.fixture.js";

@TestClass
export class TarArchiveLimitTests {
  private static readonly KEY: string = "past-the-limit";
  private static readonly LIMIT_BYTES: number = 1024 * 1024 * 1024;
  private static readonly ZERO_CHUNK_BYTES: number = 64 * 1024 * 1024;

  @TestMethod
  public async refusesAnArchiveThatUnpacksPastTheLimitAsync(): Promise<void> {
    const chunk = gzipSync(Buffer.alloc(TarArchiveLimitTests.ZERO_CHUNK_BYTES));
    const chunks = Array.from({ length: TarArchiveLimitTests.LIMIT_BYTES / TarArchiveLimitTests.ZERO_CHUNK_BYTES }, () => chunk);
    const run = await ExtractionRun.runAsync([ExtractionCase.ofArchive(TarArchiveLimitTests.KEY, Buffer.concat([...chunks, gzipSync(Buffer.alloc(1))]))]);
    const result = run.resultOf(TarArchiveLimitTests.KEY);

    Assert.areEqual(`The archive unpacks to more than ${TarArchiveLimitTests.LIMIT_BYTES} bytes.`, result.outcome);
    Assert.areEqual(0, result.outEntries.length);
  }
}
