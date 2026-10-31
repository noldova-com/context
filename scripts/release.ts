/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This script runs the steps of the organization's shared npm release workflow.
 * It uses only Node.js's own modules, so the publish and tag jobs install nothing.
 *
 * @example
 * npm run release -- source <version> <commit> - checks that the commit is on main and that scripts/config.ts holds the version there.
 * npm run release -- check <folder> <version> <commit> - checks that the folder holds exactly the packages' archives at the version, built from the commit.
 * npm run release -- publish <folder> <version> <commit> - publishes the archives that the registry doesn't hold yet, then waits until the registry serves each one.
 * npm run release -- tag <version> <commit> - tags the commit with the version through GitHub's API.
 */

import { type BinaryToTextEncoding, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delayAsync } from "node:timers/promises";

import ArchiveReader from "./archive.reader.ts";
import CommandFailedException from "./command-failed.exception.ts";
import Config from "./config.ts";
import GitHubAPI from "./github-api.ts";
import JsonObjectReader from "./json-object.reader.ts";
import type ProcessResult from "./process-result.ts";
import ReleaseArchive from "./release-archive.ts";
import Script from "./script.ts";

export class Release extends Script {
  private static readonly USAGE: string = "Usage: npm run release -- source <version> <commit> | check <folder> <version> <commit> | publish <folder> <version> <commit> | tag <version> <commit>";
  private static readonly SOURCE_COMMAND: string = "source";
  private static readonly CHECK_COMMAND: string = "check";
  private static readonly PUBLISH_COMMAND: string = "publish";
  private static readonly TAG_COMMAND: string = "tag";
  private static readonly VERSION_PATTERN: RegExp = /^0\.0\.([1-9]\d*)$/;
  private static readonly PUBLISHED_VERSION_PATTERN: RegExp = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  private static readonly COMMIT_PATTERN: RegExp = /^[0-9a-f]{40}$/;
  private static readonly CONFIG_VERSION_PATTERN: RegExp = /VERSION: string = "([^"]*)";/;
  private static readonly CONFIG_FILE_PATH: string = "scripts/config.ts";
  private static readonly GIT_COMMAND: string = "git";
  private static readonly MAIN_BRANCH: string = "origin/main";
  private static readonly MAIN_REFERENCE: string = "refs/remotes/origin/main";
  private static readonly HEAD_REFERENCE: string = "HEAD";
  private static readonly MANIFEST_ENTRY_NAME: string = "package/package.json";
  private static readonly DEPENDENCIES_FIELD: string = "dependencies";
  private static readonly NAME_FIELD: string = "name";
  private static readonly VERSION_FIELD: string = "version";
  private static readonly PRIVATE_FIELD: string = "private";
  private static readonly ACCESS_LEVELS: readonly string[] = ["restricted", "public"];
  private static readonly NOT_FOUND_CODE: string = "E404";
  private static readonly PREFER_ONLINE_OPTION: string = "--prefer-online";
  private static readonly PUBLISHED_WAIT_MILLISECONDS: number = 600_000;
  private static readonly PUBLISHED_RETRY_MILLISECONDS: number = 10_000;
  private static readonly INTEGRITY_ALGORITHM: string = "sha512";
  private static readonly INTEGRITY_ENCODING: BinaryToTextEncoding = "base64";
  private static readonly VERSION_SEPARATOR: string = ".";
  private static readonly SCOPE_SEPARATOR: string = "/";
  private static readonly TAG_PREFIX: string = "v";
  private static readonly TAG_OBJECT_TYPE: string = "tag";
  private static readonly FOUND_STATUS: number = 200;
  private static readonly CREATED_STATUS: number = 201;
  private static readonly NOT_FOUND_STATUS: number = 404;
  private static readonly READ_METHOD: string = "GET";
  private static readonly CREATE_METHOD: string = "POST";
  private static readonly REGISTRY_URL_VARIABLE: string = "RELEASE_REGISTRY_URL";
  private static readonly SCOPE_VARIABLE: string = "RELEASE_SCOPE";
  private static readonly ACCESS_VARIABLE: string = "RELEASE_ACCESS";
  private static readonly API_URL_VARIABLE: string = "GITHUB_API_URL";
  private static readonly REPOSITORY_VARIABLE: string = "GITHUB_REPOSITORY";
  private static readonly TOKEN_VARIABLE: string = "GITHUB_TOKEN";

  private readonly archiveReader: ArchiveReader = new ArchiveReader();

  public override async runAsync(): Promise<void> {
    const [command, ...values] = process.argv.slice(2);

    if (command === Release.SOURCE_COMMAND && values.length === 2)
      await this.checkSourceAsync(Release.validateVersion(values[0]), Release.validateCommit(values[1]));
    else if (command === Release.CHECK_COMMAND && values.length === 3)
      await this.checkArchivesAsync(values[0] ?? "", Release.validateVersion(values[1]), Release.validateCommit(values[2]));
    else if (command === Release.PUBLISH_COMMAND && values.length === 3)
      await this.publishAsync(values[0] ?? "", Release.validateVersion(values[1]), Release.validateCommit(values[2]));
    else if (command === Release.TAG_COMMAND && values.length === 2)
      await this.tagAsync(Release.validateVersion(values[0]), Release.validateCommit(values[1]));
    else
      throw new CommandFailedException(Release.USAGE);
  }

  private async checkSourceAsync(version: string, commit: string): Promise<void> {
    const branches = await this.readGitAsync(["branch", "--remotes", "--contains", commit, "--list", Release.MAIN_BRANCH, "--format=%(refname)"]);
    if (branches.trim() !== Release.MAIN_REFERENCE)
      throw new CommandFailedException(Release.commitNotOnMain(commit));

    const config = await this.readGitAsync(["show", `${commit}:${Release.CONFIG_FILE_PATH}`]);
    const found = Release.CONFIG_VERSION_PATTERN.exec(config)?.[1];
    if (found !== version)
      throw new CommandFailedException(Release.versionNotAtCommit(commit, found, version));

    await this.writeLogAsync(Release.sourceChecked(commit, version));
  }

  private async checkArchivesAsync(folder: string, version: string, commit: string): Promise<void> {
    await this.checkHeadAsync(commit);
    for (const archive of await this.listArchivesAsync(folder, version))
      await this.writeLogAsync(Release.archiveChecked(archive, version, commit));
  }

  private async publishAsync(folder: string, version: string, commit: string): Promise<void> {
    await this.checkHeadAsync(commit);
    const archives = await this.listArchivesAsync(folder, version);
    const registryURL = Release.readVariable(Release.REGISTRY_URL_VARIABLE);
    const access = Release.readVariable(Release.ACCESS_VARIABLE);
    if (!Release.ACCESS_LEVELS.includes(access))
      throw new CommandFailedException(Release.unknownAccess(access));

    const pending: ReleaseArchive[] = [];
    for (const archive of archives)
      if (await this.isUnpublishedAsync(archive, version, registryURL))
        pending.push(archive);

    const published: ReleaseArchive[] = [];
    try {
      for (const archive of pending) {
        await this.executeNPMCommandAsync(["publish", archive.filePath, "--access", access, "--registry", registryURL], process.cwd(), true);
        published.push(archive);
      }
    }
    catch (error) {
      // The publish failure is logged first, so it reaches the log even if the confirmation below fails or outlasts the job. The archives
      // published before it are still confirmed, so a rerun finds them on the registry and skips them instead of publishing them again,
      // which npm refuses.
      await this.writeLogAsync(error instanceof Error ? error.message : String(error));
      try {
        await this.confirmPublishedAsync(published, version, registryURL);
      }
      catch (confirmationError) {
        if (!(confirmationError instanceof CommandFailedException))
          throw confirmationError;

        await this.writeLogAsync(confirmationError.message);
      }

      throw error;
    }

    await this.confirmPublishedAsync(published, version, registryURL);
  }

  // The waits run after every publish, so they overlap: the job waits about as long as the slowest version, not their sum.
  private async confirmPublishedAsync(archives: readonly ReleaseArchive[], version: string, registryURL: string): Promise<void> {
    const deadline = Date.now() + Release.PUBLISHED_WAIT_MILLISECONDS;
    for (const archive of archives) {
      await this.waitUntilPublishedAsync(archive, version, registryURL, deadline);
      await this.writeLogAsync(Release.published(archive.packageInfo.packageName, version));
    }
  }

  private async isUnpublishedAsync(archive: ReleaseArchive, version: string, registryURL: string): Promise<boolean> {
    const name = archive.packageInfo.packageName;
    const published = await this.viewAsync(`${name}@${version}`, "dist.integrity", registryURL);
    if (published !== undefined) {
      if (published !== await Release.readIntegrityAsync(archive))
        throw new CommandFailedException(Release.publishedOtherwise(name, version));

      await this.writeLogAsync(Release.alreadyPublished(name, version));
      return false;
    }

    const latest = await this.viewAsync(name, "dist-tags.latest", registryURL);
    if (latest === undefined)
      return true;
    if (typeof latest !== "string" || !Release.PUBLISHED_VERSION_PATTERN.test(latest))
      throw new CommandFailedException(Release.unreadableLatest(name, latest));
    if (!Release.isNewer(version, latest))
      throw new CommandFailedException(Release.notNewer(name, version, latest));

    return true;
  }

  // npm can exit before the registry serves the version it published, and a new package's first version has taken over a minute to
  // appear, so a version counts as published only once the registry answers with this archive's integrity.
  private async waitUntilPublishedAsync(archive: ReleaseArchive, version: string, registryURL: string, deadline: number): Promise<void> {
    const name = archive.packageInfo.packageName;
    let published = await this.tryViewIntegrityAsync(`${name}@${version}`, registryURL);
    while ((published === undefined || published instanceof CommandFailedException) && Date.now() < deadline) {
      await delayAsync(Release.PUBLISHED_RETRY_MILLISECONDS);
      published = await this.tryViewIntegrityAsync(`${name}@${version}`, registryURL);
    }

    if (published instanceof CommandFailedException)
      throw new CommandFailedException(Release.notPublishedAfterError(name, version, Release.PUBLISHED_WAIT_MILLISECONDS, published.message));
    if (published === undefined)
      throw new CommandFailedException(Release.notPublished(name, version, Release.PUBLISHED_WAIT_MILLISECONDS));
    if (published !== await Release.readIntegrityAsync(archive))
      throw new CommandFailedException(Release.publishedOtherwise(name, version));
  }

  // A failed read, such as a registry timeout, means only "not yet" while the wait lasts, so it comes back as the exception instead of
  // ending the wait.
  private async tryViewIntegrityAsync(specifier: string, registryURL: string): Promise<unknown> {
    try {
      return await this.viewAsync(specifier, "dist.integrity", registryURL);
    }
    catch (error) {
      if (!(error instanceof CommandFailedException))
        throw error;

      return error;
    }
  }

  // npm caches registry answers, and an answer cached before a publish lacks its version, so every read asks the registry.
  private async viewAsync(specifier: string, field: string, registryURL: string): Promise<unknown> {
    const result = await this.readNPMCommandAsync(["view", specifier, field, "--json", Release.PREFER_ONLINE_OPTION, "--registry", registryURL], process.cwd());
    if (!result.isSuccessful) {
      if (result.output.includes(Release.NOT_FOUND_CODE) || result.errorOutput.includes(Release.NOT_FOUND_CODE))
        return undefined;

      throw new CommandFailedException(Release.unreadableRegistry(specifier, result));
    }

    const output = result.output.trim();
    return output.length === 0 ? undefined : JSON.parse(output);
  }

  private async tagAsync(version: string, commit: string): Promise<void> {
    const api = new GitHubAPI(Release.readVariable(Release.API_URL_VARIABLE), Release.readVariable(Release.TOKEN_VARIABLE));
    const repository = Release.readVariable(Release.REPOSITORY_VARIABLE);
    const tag = `${Release.TAG_PREFIX}${version}`;

    const response = await api.requestAsync(Release.READ_METHOD, `repos/${repository}/git/ref/tags/${tag}`);
    if (response.status === Release.NOT_FOUND_STATUS) {
      const created = await api.requestAsync(Release.CREATE_METHOD, `repos/${repository}/git/refs`, { ref: `refs/tags/${tag}`, sha: commit });
      if (created.status !== Release.CREATED_STATUS)
        throw new CommandFailedException(Release.tagNotCreated(tag, created.status, await created.text()));

      await this.writeLogAsync(Release.tagged(commit, tag));
      return;
    }

    let target = await Release.readTargetAsync(response, tag);
    if (target.string("type") === Release.TAG_OBJECT_TYPE)
      target = await Release.readTargetAsync(await api.requestAsync(Release.READ_METHOD, `repos/${repository}/git/tags/${target.string("sha")}`), tag);

    const tagged = target.string("sha");
    if (tagged !== commit)
      throw new CommandFailedException(Release.tagElsewhere(tag, tagged, commit));

    await this.writeLogAsync(Release.alreadyTagged(tag, commit));
  }

  private async listArchivesAsync(folder: string, version: string): Promise<readonly ReleaseArchive[]> {
    const directory = path.resolve(folder);
    if (!await this.pathExistsAsync(directory))
      throw new CommandFailedException(Release.folderMissing(folder));

    const scope = Release.readVariable(Release.SCOPE_VARIABLE);
    const archives = Config.PACKAGES_INFO.map(t => new ReleaseArchive(t, path.join(directory, t.archiveName(version))));
    const expected = archives.map(t => path.basename(t.filePath));
    const found = (await fs.readdir(directory)).sort();
    const findings = [
      ...expected.filter(t => !found.includes(t)).map(t => Release.archiveMissing(folder, t)),
      ...found.filter(t => !expected.includes(t)).map(t => Release.archiveUnexpected(folder, t, version))
    ];

    for (const archive of archives.filter(t => found.includes(path.basename(t.filePath))))
      findings.push(...await this.checkManifestAsync(archive, version, scope));

    if (findings.length > 0)
      throw new CommandFailedException(findings.join("\n"));

    return archives;
  }

  private async checkManifestAsync(archive: ReleaseArchive, version: string, scope: string): Promise<readonly string[]> {
    const archiveName = path.basename(archive.filePath);
    const content = await this.archiveReader.readFileAsync(archive.filePath, Release.MANIFEST_ENTRY_NAME);
    if (content === undefined)
      return [Release.manifestMissing(archiveName)];

    const manifest = JsonObjectReader.parse(content.toString(Release.TEXT_ENCODING), `${archiveName} ${Release.MANIFEST_ENTRY_NAME}`);
    const findings: string[] = [];
    const name = manifest.string(Release.NAME_FIELD);
    if (name !== archive.packageInfo.packageName)
      findings.push(Release.fieldDiffers(archiveName, Release.NAME_FIELD, name, archive.packageInfo.packageName));
    if (!name.startsWith(`${scope}${Release.SCOPE_SEPARATOR}`))
      findings.push(Release.outsideScope(archiveName, name, scope));

    const foundVersion = manifest.string(Release.VERSION_FIELD);
    if (foundVersion !== version)
      findings.push(Release.fieldDiffers(archiveName, Release.VERSION_FIELD, foundVersion, version));
    if (manifest.optionalBoolean(Release.PRIVATE_FIELD) === true)
      findings.push(Release.markedPrivate(archiveName));

    if (manifest.names.includes(Release.DEPENDENCIES_FIELD)) {
      const dependencies = manifest.object(Release.DEPENDENCIES_FIELD);
      for (const dependency of dependencies.names.filter(t => Config.PACKAGES_INFO.some(u => u.packageName === t))) {
        const range = dependencies.string(dependency);
        if (range !== version)
          findings.push(Release.dependencyDiffers(archiveName, dependency, range, version));
      }
    }

    return findings;
  }

  private async checkHeadAsync(commit: string): Promise<void> {
    const head = (await this.readGitAsync(["rev-parse", Release.HEAD_REFERENCE])).trim();
    if (head !== commit)
      throw new CommandFailedException(Release.headDiffers(head, commit));
  }

  private async readGitAsync(arguments_: readonly string[]): Promise<string> {
    const result = await this.readProcessAsync(Release.GIT_COMMAND, arguments_, process.cwd());
    if (!result.isSuccessful)
      throw new CommandFailedException(Release.gitFailed(arguments_, result));

    return result.output;
  }

  private static async readIntegrityAsync(archive: ReleaseArchive): Promise<string> {
    const hash = createHash(Release.INTEGRITY_ALGORITHM).update(await fs.readFile(archive.filePath)).digest(Release.INTEGRITY_ENCODING);
    return `${Release.INTEGRITY_ALGORITHM}-${hash}`;
  }

  private static async readTargetAsync(response: Response, tag: string): Promise<JsonObjectReader> {
    if (response.status !== Release.FOUND_STATUS)
      throw new CommandFailedException(Release.tagUnreadable(tag, response.status, await response.text()));

    return JsonObjectReader.parse(await response.text(), tag).object("object");
  }

  private static validateVersion(version: string | undefined): string {
    if (version === undefined || !Release.VERSION_PATTERN.test(version))
      throw new CommandFailedException(Release.unknownVersion(version));

    return version;
  }

  private static validateCommit(commit: string | undefined): string {
    if (commit === undefined || !Release.COMMIT_PATTERN.test(commit))
      throw new CommandFailedException(Release.unknownCommit(commit));

    return commit;
  }

  private static readVariable(name: string): string {
    const value = process.env[name];
    if (value === undefined || value.length === 0)
      throw new CommandFailedException(Release.variableMissing(name));

    return value;
  }

  private static isNewer(version: string, latest: string): boolean {
    const newer = version.split(Release.VERSION_SEPARATOR).map(t => Number(t));
    const older = latest.split(Release.VERSION_SEPARATOR).map(t => Number(t));
    const index = newer.findIndex((t, position) => t !== older[position]);

    return index >= 0 && (newer[index] ?? 0) > (older[index] ?? 0);
  }

  private static unknownVersion(version: string | undefined): string {
    return `The version "${version}" is not of the form 0.0.<n>, which every CONTEXT package uses until the first public release.`;
  }

  private static unknownCommit(commit: string | undefined): string {
    return `The commit "${commit}" is not a full 40-character commit hash.`;
  }

  private static variableMissing(name: string): string {
    return `${name} is not set; the shared npm release workflow sets it.`;
  }

  private static commitNotOnMain(commit: string): string {
    return `${commit} is not on main, so it cannot be released.`;
  }

  private static versionNotAtCommit(commit: string, found: string | undefined, version: string): string {
    return `${Release.CONFIG_FILE_PATH} at ${commit} holds the version ${found === undefined ? "nothing" : `"${found}"`}, not "${version}"; the version changes in a pull request before its release.`;
  }

  private static sourceChecked(commit: string, version: string): string {
    return `${commit} is on main, and ${Release.CONFIG_FILE_PATH} there holds ${version}.`;
  }

  private static headDiffers(head: string, commit: string): string {
    return `The checkout is at ${head}, not at ${commit}, the commit to release.`;
  }

  private static archiveChecked(archive: ReleaseArchive, version: string, commit: string): string {
    return `${path.basename(archive.filePath)}: ${archive.packageInfo.packageName}@${version} from ${commit}`;
  }

  private static folderMissing(folder: string): string {
    return `There is no folder ${folder} with the archives to release.`;
  }

  private static archiveMissing(folder: string, archiveName: string): string {
    return `${folder} lacks ${archiveName}.`;
  }

  private static archiveUnexpected(folder: string, fileName: string, version: string): string {
    return `${folder} holds ${fileName}, which is not a package's archive at ${version}.`;
  }

  private static manifestMissing(archiveName: string): string {
    return `${archiveName} has no ${Release.MANIFEST_ENTRY_NAME}.`;
  }

  private static fieldDiffers(archiveName: string, field: string, found: string, expected: string): string {
    return `${archiveName}: its ${field} is "${found}", not "${expected}".`;
  }

  private static outsideScope(archiveName: string, name: string, scope: string): string {
    return `${archiveName}: ${name} is outside the scope ${scope}.`;
  }

  private static markedPrivate(archiveName: string): string {
    return `${archiveName}: is marked private, so npm would refuse to publish it.`;
  }

  private static dependencyDiffers(archiveName: string, dependency: string, range: string, version: string): string {
    return `${archiveName}: its dependency ${dependency} is "${range}", not exactly "${version}".`;
  }

  private static unknownAccess(access: string): string {
    return `The access "${access}" is not one of ${Release.ACCESS_LEVELS.join(" or ")}.`;
  }

  private static unreadableRegistry(specifier: string, result: ProcessResult): string {
    return `npm view ${specifier} failed with exit code ${result.exitCode}, so what is published is unknown:\n${result.errorOutput.trimEnd()}`;
  }

  private static publishedOtherwise(name: string, version: string): string {
    return `${name}@${version} is already published from another archive; a version is published once, so this release needs a new version.`;
  }

  private static alreadyPublished(name: string, version: string): string {
    return `${name}@${version} is already published from this archive, so publishing skips it.`;
  }

  private static unreadableLatest(name: string, latest: unknown): string {
    return `${name}'s latest version is ${JSON.stringify(latest)}, which is not of the form major.minor.patch, so whether this version is newer is unknown.`;
  }

  private static notNewer(name: string, version: string, latest: string): string {
    return `${name}@${version} is not newer than ${latest}, its latest published version.`;
  }

  private static notPublished(name: string, version: string, waitMilliseconds: number): string {
    return `${name}@${version} was not on the registry ${waitMilliseconds / 1_000} seconds after the last publish; check the registry before releasing again.`;
  }

  private static notPublishedAfterError(name: string, version: string, waitMilliseconds: number, lastError: string): string {
    return `${name}@${version} was not on the registry ${waitMilliseconds / 1_000} seconds after the last publish, and the last read failed: ${lastError}`;
  }

  private static published(name: string, version: string): string {
    return `${name}@${version} published.`;
  }

  private static tagUnreadable(tag: string, status: number, text: string): string {
    return `GitHub answered ${status} when reading the tag ${tag}: ${text}`;
  }

  private static tagNotCreated(tag: string, status: number, text: string): string {
    return `GitHub answered ${status} when creating the tag ${tag}: ${text}`;
  }

  private static tagElsewhere(tag: string, tagged: string, commit: string): string {
    return `The tag ${tag} already points at ${tagged}, not at ${commit}; a version is used once, so this release needs a new version.`;
  }

  private static tagged(commit: string, tag: string): string {
    return `Tagged ${commit} as ${tag}.`;
  }

  private static alreadyTagged(tag: string, commit: string): string {
    return `${tag} already points at ${commit}; there is nothing to tag.`;
  }

  private static gitFailed(arguments_: readonly string[], result: ProcessResult): string {
    return `git ${arguments_.join(" ")} failed with exit code ${result.exitCode}:\n${result.errorOutput.trimEnd()}`;
  }
}

const release = new Release();
await release.runAsEntryPointAsync();
