/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { CommandFailedException, PackageInfo, ProcessResult, ReleaseService } from "@noldova/context.tooling";

import { PackageArchiveFixture } from "../fixtures/package-archive.fixture.js";
import { ReleaseHostFixture } from "../fixtures/release-host.fixture.js";

@TestClass
export class ReleaseServiceTests {
  private static readonly VERSION: string = ReleaseHostFixture.VERSION;
  private static readonly COMMIT: string = ReleaseHostFixture.COMMIT;
  private static readonly CORE_PACKAGE: PackageInfo = new PackageInfo("noldova.context.core", "noldova.context.core", "@noldova/context.core", true);
  private static readonly JSON_PACKAGE: PackageInfo = new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true);
  private static readonly TOOLING_PACKAGE: PackageInfo = new PackageInfo("noldova.context.tooling", "noldova.context.tooling", "@noldova/context.tooling", false);
  private static readonly PACKAGES: readonly PackageInfo[] = [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE, ReleaseServiceTests.TOOLING_PACKAGE];
  private static readonly CORE_ONLY: readonly PackageInfo[] = [ReleaseServiceTests.CORE_PACKAGE];
  private static readonly CORE_ARCHIVE: string = "noldova-context.core-0.0.4.tgz";
  private static readonly JSON_ARCHIVE: string = "noldova-context.json-0.0.4.tgz";
  private static readonly CORE_SPECIFIER: string = "@noldova/context.core@0.0.4";
  private static readonly JSON_SPECIFIER: string = "@noldova/context.json@0.0.4";
  private static readonly CORE_NAME: string = "@noldova/context.core";
  private static readonly INTEGRITY_FIELD: string = "dist.integrity";
  private static readonly LATEST_FIELD: string = "dist-tags.latest";
  private static readonly WAIT_RETRIES: number = 60;
  private static readonly PUBLISH_FAILED: string = "npm publish failed with exit code 1.";
  private static readonly CONFIG: string = "export default class Config {\n  public static readonly VERSION: string = \"0.0.4\";\n}\n";
  private static readonly MAIN_BRANCH: string = "refs/remotes/origin/main\n";

  @TestMethod
  public exposesTheWaitAndRetryTimes(): void {
    Assert.areEqual(600_000, ReleaseService.publishedWaitMilliseconds);
    Assert.areEqual(10_000, ReleaseService.publishedRetryMilliseconds);
  }

  @TestMethod
  @TestData([])
  @TestData(["source", "0.0.4"])
  @TestData(["check", "_packages", "0.0.4"])
  @TestData(["publish", "_packages", "0.0.4"])
  @TestData(["tag", "0.0.4", "0123456789abcdef0123456789abcdef01234567", "extra"])
  @TestData(["release", "0.0.4", "0123456789abcdef0123456789abcdef01234567"])
  public async rejectsArgumentsThatNameNoStepAsync(arguments_: string[]): Promise<void> {
    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), arguments_), CommandFailedException);

    Assert.areEqual("Usage: npm run release -- source <version> <commit> | check <folder> <version> <commit> | publish <folder> <version> <commit> | tag <version> <commit>", exception.message);
  }

  @TestMethod
  @TestData(["source", "0.0.0", "0123456789abcdef0123456789abcdef01234567"], "0.0.0")
  @TestData(["check", "_packages", "1.0.0", "0123456789abcdef0123456789abcdef01234567"], "1.0.0")
  @TestData(["publish", "_packages", "0.0.04", "0123456789abcdef0123456789abcdef01234567"], "0.0.04")
  @TestData(["tag", "0.0.4-beta", "0123456789abcdef0123456789abcdef01234567"], "0.0.4-beta")
  public async rejectsAVersionNotOfTheFormZeroZeroNAsync(arguments_: string[], version: string): Promise<void> {
    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), arguments_), CommandFailedException);

    Assert.areEqual(`The version "${version}" is not of the form 0.0.<n>, which every CONTEXT package uses until the first public release.`, exception.message);
  }

  @TestMethod
  @TestData(["source", "0.0.4", "0123456"], "0123456")
  @TestData(["check", "_packages", "0.0.4", "0123456789ABCDEF0123456789ABCDEF01234567"], "0123456789ABCDEF0123456789ABCDEF01234567")
  @TestData(["publish", "_packages", "0.0.4", "main"], "main")
  @TestData(["tag", "0.0.4", ""], "")
  public async rejectsACommitThatIsNotAFullHashAsync(arguments_: string[], commit: string): Promise<void> {
    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), arguments_), CommandFailedException);

    Assert.areEqual(`The commit "${commit}" is not a full 40-character commit hash.`, exception.message);
  }

  @TestMethod
  public async checksTheSourceOnMainAtTheVersionAsync(): Promise<void> {
    const host = ReleaseServiceTests.createSourceHost(ReleaseServiceTests.MAIN_BRANCH, ReleaseServiceTests.CONFIG);

    await ReleaseServiceTests.runAsync(host, ["source", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

    Assert.areEqual([
      `branch --remotes --contains ${ReleaseServiceTests.COMMIT} --list origin/main --format=%(refname)`,
      `show ${ReleaseServiceTests.COMMIT}:scripts/config.ts`
    ].join("\n"), host.gitCalls.join("\n"));
    Assert.areEqual(`${ReleaseServiceTests.COMMIT} is on main, and scripts/config.ts there holds 0.0.4.`, host.logs.join("\n"));
  }

  @TestMethod
  public async rejectsACommitThatIsNotOnMainAsync(): Promise<void> {
    const host = ReleaseServiceTests.createSourceHost("", ReleaseServiceTests.CONFIG);

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["source", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(`${ReleaseServiceTests.COMMIT} is not on main, so it cannot be released.`, exception.message);
  }

  @TestMethod
  public async reportsAFailedGitCommandAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.gitResults.set("branch", new ProcessResult(129, "", "error: malformed object name\n"));

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["source", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(`git branch --remotes --contains ${ReleaseServiceTests.COMMIT} --list origin/main --format=%(refname) failed with exit code 129:\nerror: malformed object name`, exception.message);
  }

  @TestMethod
  @TestData("export default class Config { }\n", "holds no version, not \"0.0.4\"")
  @TestData("export default class Config {\n  public static readonly VERSION: string = \"0.0.3\";\n}\n", "holds the version \"0.0.3\", not \"0.0.4\"")
  public async rejectsAConfigWithoutTheVersionAsync(config: string, finding: string): Promise<void> {
    const host = ReleaseServiceTests.createSourceHost(ReleaseServiceTests.MAIN_BRANCH, config);

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["source", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(`scripts/config.ts at ${ReleaseServiceTests.COMMIT} ${finding}; the version changes in a pull request before its release.`, exception.message);
  }

  @TestMethod
  public async checksThePublishedArchivesAndLeavesTheUnpublishedOutAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.PACKAGES);
      const host = new ReleaseHostFixture();

      await ReleaseServiceTests.runAsync(host, ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

      Assert.areEqual("rev-parse HEAD", host.gitCalls.join("\n"));
      Assert.areEqual([
        `${ReleaseServiceTests.CORE_ARCHIVE}: @noldova/context.core@0.0.4 from ${ReleaseServiceTests.COMMIT}`,
        `${ReleaseServiceTests.JSON_ARCHIVE}: @noldova/context.json@0.0.4 from ${ReleaseServiceTests.COMMIT}`
      ].join("\n"), host.logs.join("\n"));
    });
  }

  @TestMethod
  public async needsNoArchiveOfAnUnpublishedPackageAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE]);
      const host = new ReleaseHostFixture();

      await ReleaseServiceTests.runAsync(host, ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

      Assert.areEqual(2, host.logs.length);
    });
  }

  @TestMethod
  public async rejectsACheckoutAtAnotherCommitAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.gitResults.set("rev-parse", new ProcessResult(0, `${ReleaseHostFixture.OTHER_COMMIT}\n`, ""));

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["check", "_packages", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(`The checkout is at ${ReleaseHostFixture.OTHER_COMMIT}, not at ${ReleaseServiceTests.COMMIT}, the commit to release.`, exception.message);
  }

  @TestMethod
  public async rejectsAMissingFolderAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      const missing = join(folder, "missing");

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), ["check", missing, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual(`There is no folder ${missing} with the archives to release.`, exception.message);
      Assert.isInstanceOf(exception.cause, Error);
    });
  }

  @TestMethod
  public async rejectsAMissingOrEmptyVariableAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      const host = new ReleaseHostFixture();
      delete host.environment["RELEASE_SCOPE"];
      const missing = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);
      host.environment["RELEASE_SCOPE"] = "";
      const empty = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual("RELEASE_SCOPE is not set; the shared npm release workflow sets it.", missing.message);
      Assert.areEqual("RELEASE_SCOPE is not set; the shared npm release workflow sets it.", empty.message);
    });
  }

  @TestMethod
  public async reportsEveryMissingAndUnexpectedArchiveAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      await writeFile(join(folder, "noldova-context.json-0.0.3.tgz"), "");
      await writeFile(join(folder, "notes.txt"), "");

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual([
        `${folder} lacks ${ReleaseServiceTests.JSON_ARCHIVE}.`,
        `${folder} holds noldova-context.json-0.0.3.tgz, which is not a published package's archive at 0.0.4.`,
        `${folder} holds notes.txt, which is not a published package's archive at 0.0.4.`
      ].join("\n"), exception.message);
    });
  }

  @TestMethod
  public async reportsEveryManifestFindingAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      await PackageArchiveFixture.writePackageArchiveAsync(folder, ReleaseServiceTests.JSON_ARCHIVE, {
        name: "@other/context.json",
        version: "0.0.3",
        private: true,
        dependencies: { "@noldova/context.core": "^0.0.4", "left-pad": "1.0.0" }
      });

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual([
        `${ReleaseServiceTests.JSON_ARCHIVE}: its name is "@other/context.json", not "@noldova/context.json".`,
        `${ReleaseServiceTests.JSON_ARCHIVE}: @other/context.json is outside the scope @noldova.`,
        `${ReleaseServiceTests.JSON_ARCHIVE}: its version is "0.0.3", not "0.0.4".`,
        `${ReleaseServiceTests.JSON_ARCHIVE}: is marked private, so npm would refuse to publish it.`,
        `${ReleaseServiceTests.JSON_ARCHIVE}: its dependency @noldova/context.core is "^0.0.4", not exactly "0.0.4".`
      ].join("\n"), exception.message);
    });
  }

  @TestMethod
  public async reportsAnArchiveWithoutAManifestAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      await writeFile(join(folder, ReleaseServiceTests.JSON_ARCHIVE), PackageArchiveFixture.createArchive([{ name: "package/README.md", content: "# Read me" }]));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual(`${ReleaseServiceTests.JSON_ARCHIVE} has no package/package.json.`, exception.message);
    });
  }

  @TestMethod
  @TestData("{", " is not valid JSON.")
  @TestData("[]", " must be an object.")
  @TestData("{\"version\":\"0.0.4\"}", ": its name must be a string.")
  @TestData("{\"name\":\"@noldova/context.json\"}", ": its version must be a string.")
  @TestData("{\"name\":\"@noldova/context.json\",\"version\":\"0.0.4\",\"dependencies\":[]}", " dependencies must be an object.")
  @TestData("{\"name\":\"@noldova/context.json\",\"version\":\"0.0.4\",\"dependencies\":{\"@noldova/context.core\":4}}", " dependencies: its @noldova/context.core must be a string.")
  public async rejectsAManifestOfTheWrongShapeAsync(manifest: string, finding: string): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      await PackageArchiveFixture.writePackageArchiveAsync(folder, ReleaseServiceTests.JSON_ARCHIVE, manifest);

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(new ReleaseHostFixture(), ["check", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual(`${ReleaseServiceTests.JSON_ARCHIVE} package/package.json${finding}`, exception.message);
    });
  }

  @TestMethod
  public async publishesNewArchivesOnlyOfPublishedPackagesAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.PACKAGES);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE)));
      host.view(ReleaseServiceTests.JSON_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.JSON_ARCHIVE)));

      await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

      Assert.areEqual([
        `publish ${join(folder, ReleaseServiceTests.CORE_ARCHIVE)} --access public --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `publish ${join(folder, ReleaseServiceTests.JSON_ARCHIVE)} --access public --registry ${ReleaseHostFixture.REGISTRY_URL}`
      ].join("\n"), host.npmRuns.join("\n"));
      Assert.areEqual([
        `view ${ReleaseServiceTests.CORE_SPECIFIER} dist.integrity --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `view @noldova/context.core dist-tags.latest --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `view ${ReleaseServiceTests.JSON_SPECIFIER} dist.integrity --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `view @noldova/context.json dist-tags.latest --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `view ${ReleaseServiceTests.CORE_SPECIFIER} dist.integrity --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`,
        `view ${ReleaseServiceTests.JSON_SPECIFIER} dist.integrity --json --prefer-online --registry ${ReleaseHostFixture.REGISTRY_URL}`
      ].join("\n"), host.npmReads.join("\n"));
      Assert.areEqual("@noldova/context.core@0.0.4 published.\n@noldova/context.json@0.0.4 published.", host.logs.join("\n"));
      Assert.areEqual(0, host.delays.length);
    });
  }

  @TestMethod
  public async waitsForALateAnswerAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      const integrity = await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE);
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.NOT_FOUND, new ProcessResult(1, "", "npm error code ETIMEDOUT\n"), ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.answer(integrity));

      await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY);

      Assert.areEqual("10000,10000,10000", host.delays.join(","));
      Assert.areEqual("@noldova/context.core@0.0.4 published.", host.logs.join("\n"));
    });
  }

  @TestMethod
  public async waitsForEveryArchiveWithinOneDeadlineAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE]);
      const host = new ReleaseHostFixture();
      const integrity = await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE);
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ...Array<ProcessResult>(31).fill(ReleaseHostFixture.NOT_FOUND), ReleaseHostFixture.answer(integrity));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual("@noldova/context.json@0.0.4 was not on the registry 600 seconds after the last publish; check the registry before releasing again.", exception.message);
      Assert.areEqual(ReleaseServiceTests.WAIT_RETRIES, host.delays.length);
      Assert.areEqual("@noldova/context.core@0.0.4 published.", host.logs.join("\n"));
    });
  }

  @TestMethod
  public async reportsTheLastReadErrorWhenTheWaitEndsAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, new ProcessResult(1, "", "npm error code ETIMEDOUT\n"));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual(`${ReleaseServiceTests.CORE_SPECIFIER} was not on the registry 600 seconds after the last publish, and the last read failed: npm view ${ReleaseServiceTests.CORE_SPECIFIER} failed with exit code 1, so what is published is unknown:\nnpm error code ETIMEDOUT`, exception.message);
      Assert.areEqual(ReleaseServiceTests.WAIT_RETRIES, host.delays.length);
    });
  }

  @TestMethod
  public async rejectsAVersionServedFromAnotherArchiveAfterPublishingAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.answer("sha512-other"));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual(`${ReleaseServiceTests.CORE_SPECIFIER} is already published from another archive; a version is published once, so this release needs a new version.`, exception.message);
      Assert.areEqual(1, host.npmRuns.length);
    });
  }

  @TestMethod
  public async skipsAVersionPublishedFromThisArchiveAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE)));

      await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY);

      Assert.areEqual(0, host.npmRuns.length);
      Assert.areEqual(`${ReleaseServiceTests.CORE_SPECIFIER} is already published from this archive, so publishing skips it.`, host.logs.join("\n"));
    });
  }

  @TestMethod
  public async rejectsAVersionPublishedFromAnotherArchiveAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.answer("sha512-other"));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual(`${ReleaseServiceTests.CORE_SPECIFIER} is already published from another archive; a version is published once, so this release needs a new version.`, exception.message);
      Assert.areEqual(0, host.npmRuns.length);
    });
  }

  @TestMethod
  public async publishesAfterAnOlderLatestVersionAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, new ProcessResult(0, "\n", ""), ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE)));
      host.view(ReleaseServiceTests.CORE_NAME, ReleaseServiceTests.LATEST_FIELD, ReleaseHostFixture.answer("0.0.3"));

      await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY);

      Assert.areEqual(1, host.npmRuns.length);
      Assert.areEqual("@noldova/context.core@0.0.4 published.", host.logs.join("\n"));
    });
  }

  @TestMethod
  public async readsANotFoundAnswerFromTheOutputAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      const notFound = new ProcessResult(1, "{\"error\":{\"code\":\"E404\"}}\n", "");
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, notFound, ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE)));
      host.view(ReleaseServiceTests.CORE_NAME, ReleaseServiceTests.LATEST_FIELD, notFound);

      await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY);

      Assert.areEqual(1, host.npmRuns.length);
    });
  }

  @TestMethod
  @TestData("1.0", "@noldova/context.core's latest version is \"1.0\", which is not of the form major.minor.patch, so whether this version is newer is unknown.")
  @TestData(5, "@noldova/context.core's latest version is 5, which is not of the form major.minor.patch, so whether this version is newer is unknown.")
  @TestData("0.0.4", "@noldova/context.core@0.0.4 is not newer than 0.0.4, its latest published version.")
  @TestData("0.1.0", "@noldova/context.core@0.0.4 is not newer than 0.1.0, its latest published version.")
  public async rejectsAVersionNotNewerThanTheLatestAsync(latest: unknown, message: string): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_NAME, ReleaseServiceTests.LATEST_FIELD, ReleaseHostFixture.answer(latest));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual(message, exception.message);
      Assert.areEqual(0, host.npmRuns.length);
    });
  }

  @TestMethod
  @TestData(1, "", "npm error code E500\n", "npm view @noldova/context.core@0.0.4 failed with exit code 1, so what is published is unknown:\nnpm error code E500")
  @TestData(0, "not json\n", "", "@noldova/context.core@0.0.4 is not valid JSON.")
  public async rejectsAnUnreadableRegistryAnswerAsync(exitCode: number, output: string, errorOutput: string, message: string): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, new ProcessResult(exitCode, output, errorOutput));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual(message, exception.message);
    });
  }

  @TestMethod
  public async rejectsAnUnknownAccessOrAMissingRegistryAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.CORE_ONLY);
      const host = new ReleaseHostFixture();
      host.environment["RELEASE_ACCESS"] = "everyone";
      const access = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);
      delete host.environment["RELEASE_REGISTRY_URL"];
      const registry = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT], ReleaseServiceTests.CORE_ONLY), CommandFailedException);

      Assert.areEqual("The access \"everyone\" is not one of restricted or public.", access.message);
      Assert.areEqual("RELEASE_REGISTRY_URL is not set; the shared npm release workflow sets it.", registry.message);
      Assert.areEqual(0, host.npmReads.length);
    });
  }

  @TestMethod
  public async confirmsTheArchivesPublishedBeforeAFailureAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, ReleaseServiceTests.PACKAGES);
      const host = new ReleaseHostFixture();
      const failure = new CommandFailedException(ReleaseServiceTests.PUBLISH_FAILED);
      host.publishFailures.set(ReleaseServiceTests.JSON_ARCHIVE, failure);
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.NOT_FOUND, ReleaseHostFixture.answer(await ReleaseServiceTests.readIntegrityAsync(folder, ReleaseServiceTests.CORE_ARCHIVE)));

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual(failure, exception);
      Assert.areEqual(2, host.npmRuns.length);
      Assert.areEqual(`${ReleaseServiceTests.PUBLISH_FAILED}\n@noldova/context.core@0.0.4 published.`, host.logs.join("\n"));
    });
  }

  @TestMethod
  public async logsAFailedConfirmationAndRethrowsThePublishFailureAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE]);
      const host = new ReleaseHostFixture();
      const failure = new CommandFailedException(ReleaseServiceTests.PUBLISH_FAILED);
      host.publishFailures.set(ReleaseServiceTests.JSON_ARCHIVE, failure);

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

      Assert.areEqual(failure, exception);
      Assert.areEqual(ReleaseServiceTests.WAIT_RETRIES, host.delays.length);
      Assert.areEqual(`${ReleaseServiceTests.PUBLISH_FAILED}\n${ReleaseServiceTests.CORE_SPECIFIER} was not on the registry 600 seconds after the last publish; check the registry before releasing again.`, host.logs.join("\n"));
    });
  }

  @TestMethod
  public async rethrowsAnUnexpectedPublishErrorWithoutConfirmingAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE]);
      const host = new ReleaseHostFixture();
      const failure = new TypeError("spawn failed");
      host.publishFailures.set(ReleaseServiceTests.JSON_ARCHIVE, failure);

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), TypeError);

      Assert.areEqual(failure, exception);
      Assert.areEqual(4, host.npmReads.length);
      Assert.areEqual(0, host.logs.length);
    });
  }

  @TestMethod
  public async rethrowsAnUnexpectedConfirmationErrorAsync(): Promise<void> {
    await ReleaseServiceTests.withFolderAsync(async folder => {
      await ReleaseServiceTests.writeArchivesAsync(folder, [ReleaseServiceTests.CORE_PACKAGE, ReleaseServiceTests.JSON_PACKAGE]);
      const host = new ReleaseHostFixture();
      const failure = new TypeError("spawn failed");
      host.publishFailures.set(ReleaseServiceTests.JSON_ARCHIVE, new CommandFailedException(ReleaseServiceTests.PUBLISH_FAILED));
      host.view(ReleaseServiceTests.CORE_SPECIFIER, ReleaseServiceTests.INTEGRITY_FIELD, ReleaseHostFixture.NOT_FOUND, failure);

      const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["publish", folder, ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), TypeError);

      Assert.areEqual(failure, exception);
      Assert.areEqual(ReleaseServiceTests.PUBLISH_FAILED, host.logs.join("\n"));
    });
  }

  @TestMethod
  public async createsAMissingTagAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(new Response(null, { status: 404 }), new Response("{}", { status: 201 }));

    await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

    Assert.areEqual(`${ReleaseHostFixture.API_URL}/repos/owner/name/git/ref/tags/v0.0.4`, host.requests[0]!.address);
    Assert.areEqual(`${ReleaseHostFixture.API_URL}/repos/owner/name/git/refs`, host.requests[1]!.address);
    Assert.areEqual(`{"ref":"refs/tags/v0.0.4","sha":"${ReleaseServiceTests.COMMIT}"}`, host.requests[1]!.init.body);
    Assert.areEqual(`Tagged ${ReleaseServiceTests.COMMIT} as v0.0.4.`, host.logs.join("\n"));
  }

  @TestMethod
  public async reportsATagGitHubDidNotCreateAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(new Response(null, { status: 404 }), new Response("Reference already exists", { status: 422 }));

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual("GitHub answered 422 when creating the tag v0.0.4: Reference already exists", exception.message);
  }

  @TestMethod
  public async acceptsALightweightTagAtTheCommitAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(ReleaseServiceTests.createTagResponse("commit", ReleaseServiceTests.COMMIT));

    await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

    Assert.areEqual(1, host.requests.length);
    Assert.areEqual(`v0.0.4 already points at ${ReleaseServiceTests.COMMIT}; there is nothing to tag.`, host.logs.join("\n"));
  }

  @TestMethod
  public async followsAnAnnotatedTagToItsCommitAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(ReleaseServiceTests.createTagResponse("tag", "fedcba"), ReleaseServiceTests.createTagResponse("commit", ReleaseServiceTests.COMMIT));

    await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]);

    Assert.areEqual(`${ReleaseHostFixture.API_URL}/repos/owner/name/git/tags/fedcba`, host.requests[1]!.address);
    Assert.areEqual(`v0.0.4 already points at ${ReleaseServiceTests.COMMIT}; there is nothing to tag.`, host.logs.join("\n"));
  }

  @TestMethod
  public async rejectsATagAtAnotherCommitAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(ReleaseServiceTests.createTagResponse("commit", ReleaseHostFixture.OTHER_COMMIT));

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(`The tag v0.0.4 already points at ${ReleaseHostFixture.OTHER_COMMIT}, not at ${ReleaseServiceTests.COMMIT}; a version is used once, so this release needs a new version.`, exception.message);
  }

  @TestMethod
  @TestData(500, "unavailable", "GitHub answered 500 when reading the tag v0.0.4: unavailable")
  @TestData(200, "{", "v0.0.4 is not valid JSON.")
  @TestData(200, "[]", "v0.0.4 must be an object.")
  @TestData(200, "{\"object\":null}", "v0.0.4 object must be an object.")
  @TestData(200, "{\"object\":{\"sha\":\"fedcba\"}}", "v0.0.4: its type must be a string.")
  @TestData(200, "{\"object\":{\"type\":\"commit\"}}", "v0.0.4: its sha must be a string.")
  public async rejectsAnUnreadableTagAsync(status: number, body: string, message: string): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(new Response(body, { status }));

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual(message, exception.message);
  }

  @TestMethod
  public async rejectsAMissingGitHubVariableAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    delete host.environment["GITHUB_TOKEN"];

    const exception = await Assert.throwsAsync(async () => await ReleaseServiceTests.runAsync(host, ["tag", ReleaseServiceTests.VERSION, ReleaseServiceTests.COMMIT]), CommandFailedException);

    Assert.areEqual("GITHUB_TOKEN is not set; the shared npm release workflow sets it.", exception.message);
    Assert.areEqual(0, host.requests.length);
  }

  private static async runAsync(host: ReleaseHostFixture, arguments_: readonly string[], packagesInfo: readonly PackageInfo[] = ReleaseServiceTests.PACKAGES): Promise<void> {
    await new ReleaseService(host, packagesInfo).runAsync(arguments_);
  }

  private static createSourceHost(branches: string, config: string): ReleaseHostFixture {
    const host = new ReleaseHostFixture();
    host.gitResults.set("branch", new ProcessResult(0, branches, ""));
    host.gitResults.set("show", new ProcessResult(0, config, ""));

    return host;
  }

  private static createTagResponse(type: string, sha: string): Response {
    return new Response(JSON.stringify({ ref: "refs/tags/v0.0.4", object: { type, sha } }), { status: 200 });
  }

  private static async writeArchivesAsync(folder: string, packagesInfo: readonly PackageInfo[]): Promise<void> {
    for (const packageInfo of packagesInfo) {
      const manifest: Record<string, unknown> = { name: packageInfo.packageName, version: ReleaseServiceTests.VERSION };
      if (packageInfo === ReleaseServiceTests.JSON_PACKAGE)
        manifest["dependencies"] = { "@noldova/context.core": ReleaseServiceTests.VERSION, "left-pad": "^1.0.0" };
      if (!packageInfo.isPublished)
        manifest["private"] = true;

      await PackageArchiveFixture.writePackageArchiveAsync(folder, packageInfo.archiveName(ReleaseServiceTests.VERSION), manifest);
    }
  }

  private static async readIntegrityAsync(folder: string, archiveName: string): Promise<string> {
    return `sha512-${createHash("sha512").update(await readFile(join(folder, archiveName))).digest("base64")}`;
  }

  private static async withFolderAsync(action: (folder: string) => Promise<void>): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), "context-release-"));
    try {
      await action(folder);
    }
    finally {
      await rm(folder, { recursive: true, force: true });
    }
  }
}
