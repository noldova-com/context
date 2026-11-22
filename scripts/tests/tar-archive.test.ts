/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { gunzipSync, gzipSync } from "node:zlib";

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ExtractionCase } from "./fixtures/extraction-case.fixture.js";
import { ExtractionRun } from "./fixtures/extraction-run.fixture.js";
import { TarEntry } from "./fixtures/tar-entry.fixture.js";

@TestClass
export class TarArchiveTests {
  private static readonly LIBRARY_TEXT: string = "library";
  private static readonly CUT_HEADER_BYTES: number = 1124;
  private static readonly CASES: readonly ExtractionCase[] = [
    ExtractionCase.of("extracts", [
      TarEntry.folder("lib/"),
      TarEntry.file("lib/libpq.so.5", TarArchiveTests.LIBRARY_TEXT),
      TarEntry.hardLink("bin/libpq", "lib/libpq.so.5")
    ]),
    ExtractionCase.of("absolute-posix", [TarEntry.symbolicLink("lib/link", "/etc")]),
    ExtractionCase.of("absolute-drive", [TarEntry.symbolicLink("lib/link", "C:\\Windows")]),
    ExtractionCase.of("absolute-share", [TarEntry.symbolicLink("lib/link", "\\\\server\\share")]),
    ExtractionCase.of("climbs-out", [TarEntry.symbolicLink("lib/link", "../../outside")]),
    ExtractionCase.of("climbs-after-a-name", [TarEntry.folder("a/b/"), TarEntry.symbolicLink("a/t", "b/../..")]),
    ExtractionCase.of("folder-itself", [TarEntry.symbolicLink("lib/link", "..")]),
    ExtractionCase.withFolderLink("climbs-from-real-path", [TarEntry.symbolicLink("top/sub/up/link", "../..")], "top/sub/up", "out/top"),
    ExtractionCase.withFolderLink("folder-really-outside", [TarEntry.file("lib/libpq.so.5", TarArchiveTests.LIBRARY_TEXT)], "lib", "outside"),
    ExtractionCase.of("hard-link-absolute", [TarEntry.hardLink("bin/libpq", "/etc/passwd")]),
    ExtractionCase.of("hard-link-climbs-out", [TarEntry.hardLink("bin/libpq", "../outside")]),
    ExtractionCase.withFolderLink("hard-link-really-outside", [TarEntry.hardLink("bin/libpq", "lib/libpq.so.5")], "lib", "outside", "libpq.so.5"),
    ExtractionCase.of("hard-link-missing", [TarEntry.folder("lib/"), TarEntry.hardLink("bin/libpq", "lib/missing")]),
    ExtractionCase.of("hard-link-folder", [TarEntry.folder("lib/"), TarEntry.hardLink("bin/libpq", "lib/")]),
    ExtractionCase.of("type-3", [TarEntry.ofType("dev/tty", "3")]),
    ExtractionCase.of("type-4", [TarEntry.ofType("dev/disk", "4")]),
    ExtractionCase.of("type-6", [TarEntry.ofType("run/fifo", "6")]),
    ExtractionCase.of("type-S", [TarEntry.ofType("lib/sparse", "S")]),
    ExtractionCase.of("size-9", [TarEntry.withSizeField("lib/libpq.so.5", "9")]),
    ExtractionCase.of("size-12x", [TarEntry.withSizeField("lib/libpq.so.5", "12x")]),
    ExtractionCase.of("ends-inside", [TarEntry.withSizeField("lib/libpq.so.5", "3720")]),
    ExtractionCase.ofArchive("ends-inside-a-header", gzipSync(gunzipSync(TarEntry.archive([
      TarEntry.file("lib/libpq.so.5", TarArchiveTests.LIBRARY_TEXT),
      TarEntry.file("lib/libpq.so.6", TarArchiveTests.LIBRARY_TEXT)
    ])).subarray(0, TarArchiveTests.CUT_HEADER_BYTES)))
  ];

  private static run: Promise<ExtractionRun> | undefined;

  @TestMethod
  public async extractsFilesFoldersAndHardLinksThatReadThroughAsync(): Promise<void> {
    const result = (await TarArchiveTests.runAsync()).resultOf("extracts");

    Assert.areEqual(ExtractionRun.EXTRACTED, result.outcome);
    Assert.areEqual(`bin/,bin/libpq=${TarArchiveTests.LIBRARY_TEXT},lib/,lib/libpq.so.5=${TarArchiveTests.LIBRARY_TEXT}`, result.outEntries.join());
  }

  @TestData("absolute-posix")
  @TestData("absolute-drive")
  @TestData("absolute-share")
  @TestMethod
  public async refusesASymbolicLinkWithAnAbsoluteTargetAsync(key: string): Promise<void> {
    await TarArchiveTests.assertRefusedAsync(key, TarArchiveTests.unsafeEntry("lib/link"));
  }

  @TestMethod
  public async refusesASymbolicLinkThatClimbsOutOfTheFolderAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("climbs-out", TarArchiveTests.unsafeEntry("lib/link"));
  }

  @TestMethod
  public async refusesASymbolicLinkThatClimbsAfterANameAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("climbs-after-a-name", TarArchiveTests.unsafeEntry("a/t"));
  }

  @TestMethod
  public async refusesASymbolicLinkToTheFolderItselfAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("folder-itself", TarArchiveTests.unsafeEntry("lib/link"));
  }

  @TestMethod
  public async refusesASymbolicLinkThatClimbsOutFromTheRealPathOfItsFolderAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("climbs-from-real-path", TarArchiveTests.unsafeEntry("top/sub/up/link"));
  }

  @TestMethod
  public async refusesAnEntryWhoseFolderIsReallyOutsideAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("folder-really-outside", TarArchiveTests.unsafeEntry("lib/libpq.so.5"));
  }

  @TestData("hard-link-absolute")
  @TestData("hard-link-climbs-out")
  @TestMethod
  public async refusesAHardLinkToATargetOutsideTheFolderAsync(key: string): Promise<void> {
    await TarArchiveTests.assertRefusedAsync(key, TarArchiveTests.unsafeEntry("bin/libpq"));
  }

  @TestMethod
  public async refusesAHardLinkWhoseTargetIsReallyOutsideTheFolderAsync(): Promise<void> {
    const key = "hard-link-really-outside";

    await TarArchiveTests.assertRefusedAsync(key, TarArchiveTests.unsafeEntry("bin/libpq"), ["libpq.so.5"]);
    Assert.areEqual("bin/,lib@", (await TarArchiveTests.runAsync()).resultOf(key).outEntries.join());
  }

  @TestData("hard-link-missing", "lib/missing")
  @TestData("hard-link-folder", "lib/")
  @TestMethod
  public async refusesAHardLinkWhoseTargetIsNotAnExtractedFileAsync(key: string, target: string): Promise<void> {
    await TarArchiveTests.assertRefusedAsync(key, `The archive holds the hard link "bin/libpq", whose target "${target}" is not a file extracted before it.`);
  }

  @TestData("type-3", "dev/tty", "3")
  @TestData("type-4", "dev/disk", "4")
  @TestData("type-6", "run/fifo", "6")
  @TestData("type-S", "lib/sparse", "S")
  @TestMethod
  public async refusesAnEntryOfAnotherTypeAsync(key: string, name: string, type: string): Promise<void> {
    await TarArchiveTests.assertRefusedAsync(key, `The archive holds the entry "${name}" of type "${type}", which the extraction does not support.`);
  }

  @TestData("size-9")
  @TestData("size-12x")
  @TestMethod
  public async refusesAnEntryWhoseSizeIsNotOctalAsync(key: string): Promise<void> {
    await TarArchiveTests.assertRefusedAsync(key, "The archive holds the entry \"lib/libpq.so.5\", whose header has a number that is not octal.");
  }

  @TestMethod
  public async refusesAnArchiveThatEndsInsideAnEntryAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("ends-inside", "The archive ends inside the entry \"lib/libpq.so.5\".");
  }

  @TestMethod
  public async refusesAnArchiveThatEndsInsideAHeaderAsync(): Promise<void> {
    await TarArchiveTests.assertRefusedAsync("ends-inside-a-header", "The archive ends inside an entry's header.");
  }

  private static runAsync(): Promise<ExtractionRun> {
    TarArchiveTests.run ??= ExtractionRun.runAsync(TarArchiveTests.CASES);
    return TarArchiveTests.run;
  }

  private static async assertRefusedAsync(key: string, message: string, outsideFileNames: readonly string[] = []): Promise<void> {
    const result = (await TarArchiveTests.runAsync()).resultOf(key);

    Assert.areEqual(message, result.outcome);
    Assert.areEqual([ExtractionRun.ARCHIVE_FILE_NAME, ExtractionRun.FOLDER_NAME, ExtractionRun.OUTSIDE_FOLDER_NAME].join(), result.folderEntries.join());
    Assert.areEqual(outsideFileNames.join(), result.outsideEntries.join());
  }

  private static unsafeEntry(name: string): string {
    return `The archive holds the entry "${name}", which points outside its folder.`;
  }
}
