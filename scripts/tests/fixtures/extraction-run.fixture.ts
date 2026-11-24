/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import "@noldova/context.core";
import { Assert } from "@noldova/context.testing";

import type { ExtractionCase } from "./extraction-case.fixture.js";
import { ExtractionResult } from "./extraction-result.fixture.js";
import { ScriptRunner } from "./script-runner.fixture.js";

export class ExtractionRun {
  public static readonly ARCHIVE_FILE_NAME: string = "archive.tar.gz";
  public static readonly EXTRACTED: string = "extracted";
  public static readonly FOLDER_NAME: string = "out";
  public static readonly OUTSIDE_FOLDER_NAME: string = "outside";
  private static readonly DIRECTORY_PREFIX: string = "noldova-tar-archive-";
  private static readonly DRIVER: string = `
    import { lstatSync, readdirSync, readFileSync } from "node:fs";
    import path from "node:path";
    const [scriptsUrl, directory, ...keys] = process.argv.slice(1);
    const { default: CommandFailedException } = await import(new URL("command-failed.exception.ts", scriptsUrl).href);
    const { default: TarArchive } = await import(new URL("tar-archive.ts", scriptsUrl).href);
    const listEntries = (folder, prefix) => readdirSync(folder).sort().flatMap(name => {
      const entry = path.join(folder, name);
      const status = lstatSync(entry);
      if (status.isSymbolicLink())
        return [prefix + name + "@"];
      if (status.isDirectory())
        return [prefix + name + "/", ...listEntries(entry, prefix + name + "/")];
      return [prefix + name + "=" + readFileSync(entry, "utf8")];
    });
    for (const key of keys) {
      const folder = path.join(directory, key);
      let outcome = "${ExtractionRun.EXTRACTED}";
      try {
        await TarArchive.extractAsync(readFileSync(path.join(folder, "${ExtractionRun.ARCHIVE_FILE_NAME}")), path.join(folder, "${ExtractionRun.FOLDER_NAME}"));
      }
      catch (exception) {
        if (!(exception instanceof CommandFailedException))
          throw exception;
        outcome = exception.message;
      }
      console.log(JSON.stringify({ key, outcome, folder: readdirSync(folder).sort(), outside: readdirSync(path.join(folder, "${ExtractionRun.OUTSIDE_FOLDER_NAME}")).sort(),
        out: listEntries(path.join(folder, "${ExtractionRun.FOLDER_NAME}"), "") }));
    }
  `;
  private static readonly FOLDER_LINK_TYPE: "junction" = "junction";
  private static readonly LINE_SEPARATOR: string = "\n";
  private static readonly REMOVAL_RETRIES: number = 5;

  private readonly results: ReadonlyMap<string, ExtractionResult>;

  private constructor(results: ReadonlyMap<string, ExtractionResult>) {
    this.results = results;
  }

  public static async runAsync(cases: readonly ExtractionCase[]): Promise<ExtractionRun> {
    const directory = await mkdtemp(path.join(tmpdir(), ExtractionRun.DIRECTORY_PREFIX));
    try {
      for (const extractionCase of cases)
        await ExtractionRun.prepareAsync(path.join(directory, extractionCase.key), extractionCase);

      const output = await ScriptRunner.runAsync(ExtractionRun.DRIVER, ScriptRunner.SCRIPTS_FOLDER, [directory, ...cases.map(t => t.key)]);
      const results = new Map<string, ExtractionResult>();
      for (const result of output.split(ExtractionRun.LINE_SEPARATOR).map(t => ExtractionResult.parse(t)))
        results.set(result.key, result);

      return new ExtractionRun(results);
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: ExtractionRun.REMOVAL_RETRIES });
    }
  }

  public resultOf(key: string): ExtractionResult {
    const result = this.results.get(key);
    Assert.isDefined(result, key);
    return result;
  }

  private static async prepareAsync(folder: string, extractionCase: ExtractionCase): Promise<void> {
    const out = path.join(folder, ExtractionRun.FOLDER_NAME);
    const outside = path.join(folder, ExtractionRun.OUTSIDE_FOLDER_NAME);
    await mkdir(out, { recursive: true });
    await mkdir(outside);
    await writeFile(path.join(folder, ExtractionRun.ARCHIVE_FILE_NAME), extractionCase.archive);
    if (!Object.isUndefined(extractionCase.outsideFileName))
      await writeFile(path.join(outside, extractionCase.outsideFileName), extractionCase.key);

    if (!Object.isUndefined(extractionCase.linkPath) && !Object.isUndefined(extractionCase.linkTarget)) {
      const link = path.join(out, extractionCase.linkPath);
      const target = path.join(folder, extractionCase.linkTarget);
      await mkdir(path.dirname(link), { recursive: true });
      await mkdir(target, { recursive: true });
      await symlink(target, link, ExtractionRun.FOLDER_LINK_TYPE);
    }
  }
}
