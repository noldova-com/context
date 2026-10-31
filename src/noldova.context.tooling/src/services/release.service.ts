/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { type BinaryToTextEncoding, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { CommandFailedException } from "../exceptions/command-failed.exception.ts";
import type { IReleaseHost } from "../interfaces/i-release-host.ts";
import type { PackageInfo } from "../models/package-info.ts";
import { ReleaseArchive } from "../models/release-archive.ts";
import { Resources } from "../resources.ts";
import { ArchiveReader } from "./archive.reader.ts";
import { GitHubAPI } from "./github-api.ts";

export class ReleaseService {
  public static readonly publishedWaitMilliseconds: number = 600_000;
  public static readonly publishedRetryMilliseconds: number = 10_000;

  private static readonly SOURCE_COMMAND: string = "source";
  private static readonly CHECK_COMMAND: string = "check";
  private static readonly PUBLISH_COMMAND: string = "publish";
  private static readonly TAG_COMMAND: string = "tag";
  private static readonly VERSION_PATTERN: RegExp = /^0\.0\.([1-9]\d*)$/;
  private static readonly PUBLISHED_VERSION_PATTERN: RegExp = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  private static readonly COMMIT_PATTERN: RegExp = /^[0-9a-f]{40}$/;
  private static readonly CONFIG_VERSION_PATTERN: RegExp = /VERSION: string = "([^"]*)";/;
  private static readonly CONFIG_FILE_PATH: string = "scripts/config.ts";
  private static readonly MAIN_BRANCH: string = "origin/main";
  private static readonly MAIN_REFERENCE: string = "refs/remotes/origin/main";
  private static readonly HEAD_REFERENCE: string = "HEAD";
  private static readonly MANIFEST_ENTRY_NAME: string = "package/package.json";
  private static readonly DEPENDENCIES_FIELD: string = "dependencies";
  private static readonly NAME_FIELD: string = "name";
  private static readonly VERSION_FIELD: string = "version";
  private static readonly PRIVATE_FIELD: string = "private";
  private static readonly OBJECT_FIELD: string = "object";
  private static readonly TYPE_FIELD: string = "type";
  private static readonly SHA_FIELD: string = "sha";
  private static readonly ACCESS_LEVELS: readonly string[] = ["restricted", "public"];
  private static readonly NOT_FOUND_CODE: string = "E404";
  private static readonly PREFER_ONLINE_OPTION: string = "--prefer-online";
  private static readonly INTEGRITY_FIELD: string = "dist.integrity";
  private static readonly LATEST_FIELD: string = "dist-tags.latest";
  private static readonly INTEGRITY_ALGORITHM: string = "sha512";
  private static readonly INTEGRITY_ENCODING: BinaryToTextEncoding = "base64";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";
  private static readonly VERSION_SEPARATOR: string = ".";
  private static readonly SCOPE_SEPARATOR: string = "/";
  private static readonly FINDING_SEPARATOR: string = "\n";
  private static readonly TAG_PREFIX: string = "v";
  private static readonly TAG_OBJECT_TYPE: string = "tag";
  private static readonly FOUND_STATUS: number = 200;
  private static readonly CREATED_STATUS: number = 201;
  private static readonly NOT_FOUND_STATUS: number = 404;
  private static readonly MILLISECONDS_PER_SECOND: number = 1_000;
  private static readonly READ_METHOD: string = "GET";
  private static readonly CREATE_METHOD: string = "POST";
  private static readonly REGISTRY_URL_VARIABLE: string = "RELEASE_REGISTRY_URL";
  private static readonly SCOPE_VARIABLE: string = "RELEASE_SCOPE";
  private static readonly ACCESS_VARIABLE: string = "RELEASE_ACCESS";
  private static readonly API_URL_VARIABLE: string = "GITHUB_API_URL";
  private static readonly REPOSITORY_VARIABLE: string = "GITHUB_REPOSITORY";
  private static readonly TOKEN_VARIABLE: string = "GITHUB_TOKEN";

  private readonly host: IReleaseHost;
  private readonly packagesInfo: readonly PackageInfo[];
  private readonly archiveReader: ArchiveReader = new ArchiveReader();

  public constructor(host: IReleaseHost, packagesInfo: readonly PackageInfo[]) {
    this.host = host;
    this.packagesInfo = packagesInfo;
  }

  public async runAsync(arguments_: readonly string[]): Promise<void> {
    const [command, ...values] = arguments_;

    if (command === ReleaseService.SOURCE_COMMAND && values.length === 2) {
      const [version, commit] = values as [string, string];
      await this.checkSourceAsync(ReleaseService.validateVersion(version), ReleaseService.validateCommit(commit));
    }
    else if (command === ReleaseService.CHECK_COMMAND && values.length === 3) {
      const [folder, version, commit] = values as [string, string, string];
      await this.checkArchivesAsync(folder, ReleaseService.validateVersion(version), ReleaseService.validateCommit(commit));
    }
    else if (command === ReleaseService.PUBLISH_COMMAND && values.length === 3) {
      const [folder, version, commit] = values as [string, string, string];
      await this.publishAsync(folder, ReleaseService.validateVersion(version), ReleaseService.validateCommit(commit));
    }
    else if (command === ReleaseService.TAG_COMMAND && values.length === 2) {
      const [version, commit] = values as [string, string];
      await this.tagAsync(ReleaseService.validateVersion(version), ReleaseService.validateCommit(commit));
    }
    else
      throw new CommandFailedException(Resources.releaseUsage);
  }

  private async checkSourceAsync(version: string, commit: string): Promise<void> {
    const branches = await this.readGitAsync(["branch", "--remotes", "--contains", commit, "--list", ReleaseService.MAIN_BRANCH, "--format=%(refname)"]);
    if (branches.trim() !== ReleaseService.MAIN_REFERENCE)
      throw new CommandFailedException(Resources.formatCommitNotOnMain(commit));

    const config = await this.readGitAsync(["show", `${commit}:${ReleaseService.CONFIG_FILE_PATH}`]);
    const found = ReleaseService.CONFIG_VERSION_PATTERN.exec(config);
    if (found === null)
      throw new CommandFailedException(Resources.formatNoVersionAtCommit(ReleaseService.CONFIG_FILE_PATH, commit, version));
    if (found[1] !== version)
      throw new CommandFailedException(Resources.formatOtherVersionAtCommit(ReleaseService.CONFIG_FILE_PATH, commit, `${found[1]}`, version));

    await this.host.writeLogAsync(Resources.formatSourceChecked(commit, ReleaseService.CONFIG_FILE_PATH, version));
  }

  private async checkArchivesAsync(folder: string, version: string, commit: string): Promise<void> {
    await this.checkHeadAsync(commit);
    for (const archive of await this.listArchivesAsync(folder, version))
      await this.host.writeLogAsync(Resources.formatArchiveChecked(path.basename(archive.filePath), archive.packageInfo.packageName, version, commit));
  }

  private async publishAsync(folder: string, version: string, commit: string): Promise<void> {
    await this.checkHeadAsync(commit);
    const archives = await this.listArchivesAsync(folder, version);
    const registryURL = this.readVariable(ReleaseService.REGISTRY_URL_VARIABLE);
    const access = this.readVariable(ReleaseService.ACCESS_VARIABLE);
    if (!ReleaseService.ACCESS_LEVELS.includes(access))
      throw new CommandFailedException(Resources.formatUnknownAccess(access, ReleaseService.ACCESS_LEVELS));

    const pending: ReleaseArchive[] = [];
    for (const archive of archives)
      if (await this.isUnpublishedAsync(archive, version, registryURL))
        pending.push(archive);

    const published: ReleaseArchive[] = [];
    try {
      for (const archive of pending) {
        await this.host.runNPMAsync(["publish", archive.filePath, "--access", access, "--registry", registryURL]);
        published.push(archive);
      }
    }
    catch (error) {
      if (!(error instanceof CommandFailedException))
        throw error;

      await this.host.writeLogAsync(error.message);
      try {
        await this.confirmPublishedAsync(published, version, registryURL);
      }
      catch (confirmationError) {
        if (!(confirmationError instanceof CommandFailedException))
          throw confirmationError;

        await this.host.writeLogAsync(confirmationError.message);
      }

      throw error;
    }

    await this.confirmPublishedAsync(published, version, registryURL);
  }

  private async confirmPublishedAsync(archives: readonly ReleaseArchive[], version: string, registryURL: string): Promise<void> {
    const deadline = this.host.now() + ReleaseService.publishedWaitMilliseconds;
    for (const archive of archives) {
      await this.waitUntilPublishedAsync(archive, version, registryURL, deadline);
      await this.host.writeLogAsync(Resources.formatPublished(archive.packageInfo.packageName, version));
    }
  }

  private async isUnpublishedAsync(archive: ReleaseArchive, version: string, registryURL: string): Promise<boolean> {
    const name = archive.packageInfo.packageName;
    const published = await this.viewAsync(`${name}@${version}`, ReleaseService.INTEGRITY_FIELD, registryURL);
    if (published !== undefined) {
      if (published !== await ReleaseService.readIntegrityAsync(archive))
        throw new CommandFailedException(Resources.formatPublishedOtherwise(name, version));

      await this.host.writeLogAsync(Resources.formatAlreadyPublished(name, version));
      return false;
    }

    const latest = await this.viewAsync(name, ReleaseService.LATEST_FIELD, registryURL);
    if (latest === undefined)
      return true;
    if (typeof latest !== "string" || !ReleaseService.PUBLISHED_VERSION_PATTERN.test(latest))
      throw new CommandFailedException(Resources.formatUnreadableLatest(name, JSON.stringify(latest)));
    if (!ReleaseService.isNewer(version, latest))
      throw new CommandFailedException(Resources.formatNotNewer(name, version, latest));

    return true;
  }

  private async waitUntilPublishedAsync(archive: ReleaseArchive, version: string, registryURL: string, deadline: number): Promise<void> {
    const name = archive.packageInfo.packageName;
    const waitSeconds = ReleaseService.publishedWaitMilliseconds / ReleaseService.MILLISECONDS_PER_SECOND;
    let published = await this.tryViewIntegrityAsync(`${name}@${version}`, registryURL);
    while ((published === undefined || published instanceof CommandFailedException) && this.host.now() < deadline) {
      await this.host.delayAsync(ReleaseService.publishedRetryMilliseconds);
      published = await this.tryViewIntegrityAsync(`${name}@${version}`, registryURL);
    }

    if (published instanceof CommandFailedException)
      throw new CommandFailedException(Resources.formatNotPublishedAfterError(name, version, waitSeconds, published.message));
    if (published === undefined)
      throw new CommandFailedException(Resources.formatNotPublished(name, version, waitSeconds));
    if (published !== await ReleaseService.readIntegrityAsync(archive))
      throw new CommandFailedException(Resources.formatPublishedOtherwise(name, version));
  }

  private async tryViewIntegrityAsync(specifier: string, registryURL: string): Promise<unknown> {
    try {
      return await this.viewAsync(specifier, ReleaseService.INTEGRITY_FIELD, registryURL);
    }
    catch (error) {
      if (!(error instanceof CommandFailedException))
        throw error;

      return error;
    }
  }

  private async viewAsync(specifier: string, field: string, registryURL: string): Promise<unknown> {
    const result = await this.host.readNPMAsync(["view", specifier, field, "--json", ReleaseService.PREFER_ONLINE_OPTION, "--registry", registryURL]);
    if (!result.isSuccessful) {
      if (result.output.includes(ReleaseService.NOT_FOUND_CODE) || result.errorOutput.includes(ReleaseService.NOT_FOUND_CODE))
        return undefined;

      throw new CommandFailedException(Resources.formatUnreadableRegistry(specifier, result.exitCode, result.errorOutput.trimEnd()));
    }

    const output = result.output.trim();
    if (output.length === 0)
      return undefined;

    return ReleaseService.parseJson(output, specifier);
  }

  private async tagAsync(version: string, commit: string): Promise<void> {
    const api = new GitHubAPI(this.host, this.readVariable(ReleaseService.API_URL_VARIABLE), this.readVariable(ReleaseService.TOKEN_VARIABLE));
    const repository = this.readVariable(ReleaseService.REPOSITORY_VARIABLE);
    const tag = `${ReleaseService.TAG_PREFIX}${version}`;

    const response = await api.requestAsync(ReleaseService.READ_METHOD, `repos/${repository}/git/ref/tags/${tag}`);
    if (response.status === ReleaseService.NOT_FOUND_STATUS) {
      const created = await api.requestAsync(ReleaseService.CREATE_METHOD, `repos/${repository}/git/refs`, { ref: `refs/tags/${tag}`, sha: commit });
      if (created.status !== ReleaseService.CREATED_STATUS)
        throw new CommandFailedException(Resources.formatTagNotCreated(tag, created.status, await created.text()));

      await this.host.writeLogAsync(Resources.formatTagged(commit, tag));
      return;
    }

    let target = await ReleaseService.readTargetAsync(response, tag);
    if (ReleaseService.readString(target, ReleaseService.TYPE_FIELD, tag) === ReleaseService.TAG_OBJECT_TYPE) {
      const tagObject = await api.requestAsync(ReleaseService.READ_METHOD, `repos/${repository}/git/tags/${ReleaseService.readString(target, ReleaseService.SHA_FIELD, tag)}`);
      target = await ReleaseService.readTargetAsync(tagObject, tag);
    }

    const tagged = ReleaseService.readString(target, ReleaseService.SHA_FIELD, tag);
    if (tagged !== commit)
      throw new CommandFailedException(Resources.formatTagElsewhere(tag, tagged, commit));

    await this.host.writeLogAsync(Resources.formatAlreadyTagged(tag, commit));
  }

  private async listArchivesAsync(folder: string, version: string): Promise<readonly ReleaseArchive[]> {
    const directory = path.resolve(folder);
    let found: string[];
    try {
      found = (await fs.readdir(directory)).sort();
    }
    catch (error) {
      throw new CommandFailedException(Resources.formatFolderMissing(folder), { cause: error });
    }

    const scope = this.readVariable(ReleaseService.SCOPE_VARIABLE);
    const archives = this.packagesInfo.filter(t => t.isPublished).map(t => new ReleaseArchive(t, path.join(directory, t.archiveName(version))));
    const expected = archives.map(t => path.basename(t.filePath));
    const unpublished = this.packagesInfo.filter(t => !t.isPublished).map(t => t.archiveName(version));
    const findings = [
      ...expected.filter(t => !found.includes(t)).map(t => Resources.formatArchiveMissing(folder, t)),
      ...found.filter(t => !expected.includes(t) && !unpublished.includes(t)).map(t => Resources.formatArchiveUnexpected(folder, t, version))
    ];

    for (const archive of archives.filter(t => found.includes(path.basename(t.filePath))))
      findings.push(...await this.checkManifestAsync(archive, version, scope));

    if (findings.length > 0)
      throw new CommandFailedException(findings.join(ReleaseService.FINDING_SEPARATOR));

    return archives;
  }

  private async checkManifestAsync(archive: ReleaseArchive, version: string, scope: string): Promise<readonly string[]> {
    const archiveName = path.basename(archive.filePath);
    const content = await this.archiveReader.readFileAsync(archive.filePath, ReleaseService.MANIFEST_ENTRY_NAME);
    if (content === undefined)
      return [Resources.formatManifestMissing(archiveName, ReleaseService.MANIFEST_ENTRY_NAME)];

    const identity = `${archiveName} ${ReleaseService.MANIFEST_ENTRY_NAME}`;
    const manifest = ReleaseService.readObject(ReleaseService.parseJson(content.toString(ReleaseService.TEXT_ENCODING), identity), identity);
    const findings: string[] = [];
    const name = ReleaseService.readString(manifest, ReleaseService.NAME_FIELD, identity);
    if (name !== archive.packageInfo.packageName)
      findings.push(Resources.formatFieldDiffers(archiveName, ReleaseService.NAME_FIELD, name, archive.packageInfo.packageName));
    if (!name.startsWith(`${scope}${ReleaseService.SCOPE_SEPARATOR}`))
      findings.push(Resources.formatOutsideScope(archiveName, name, scope));

    const foundVersion = ReleaseService.readString(manifest, ReleaseService.VERSION_FIELD, identity);
    if (foundVersion !== version)
      findings.push(Resources.formatFieldDiffers(archiveName, ReleaseService.VERSION_FIELD, foundVersion, version));
    if (manifest[ReleaseService.PRIVATE_FIELD] === true)
      findings.push(Resources.formatMarkedPrivate(archiveName));

    if (Object.hasOwn(manifest, ReleaseService.DEPENDENCIES_FIELD)) {
      const dependencies = ReleaseService.readObject(manifest[ReleaseService.DEPENDENCIES_FIELD], `${identity} ${ReleaseService.DEPENDENCIES_FIELD}`);
      for (const dependency of Object.keys(dependencies).filter(t => this.packagesInfo.some(u => u.packageName === t))) {
        const range = ReleaseService.readString(dependencies, dependency, `${identity} ${ReleaseService.DEPENDENCIES_FIELD}`);
        if (range !== version)
          findings.push(Resources.formatDependencyDiffers(archiveName, dependency, range, version));
      }
    }

    return findings;
  }

  private async checkHeadAsync(commit: string): Promise<void> {
    const head = (await this.readGitAsync(["rev-parse", ReleaseService.HEAD_REFERENCE])).trim();
    if (head !== commit)
      throw new CommandFailedException(Resources.formatHeadDiffers(head, commit));
  }

  private async readGitAsync(arguments_: readonly string[]): Promise<string> {
    const result = await this.host.readGitAsync(arguments_);
    if (!result.isSuccessful)
      throw new CommandFailedException(Resources.formatGitFailed(arguments_.join(" "), result.exitCode, result.errorOutput.trimEnd()));

    return result.output;
  }

  private readVariable(name: string): string {
    const value = this.host.environment[name];
    if (value === undefined || value.length === 0)
      throw new CommandFailedException(Resources.formatVariableMissing(name));

    return value;
  }

  private static async readIntegrityAsync(archive: ReleaseArchive): Promise<string> {
    const hash = createHash(ReleaseService.INTEGRITY_ALGORITHM).update(await fs.readFile(archive.filePath)).digest(ReleaseService.INTEGRITY_ENCODING);
    return `${ReleaseService.INTEGRITY_ALGORITHM}-${hash}`;
  }

  private static async readTargetAsync(response: Response, tag: string): Promise<Readonly<Record<string, unknown>>> {
    const text = await response.text();
    if (response.status !== ReleaseService.FOUND_STATUS)
      throw new CommandFailedException(Resources.formatTagUnreadable(tag, response.status, text));

    const reference = ReleaseService.readObject(ReleaseService.parseJson(text, tag), tag);
    return ReleaseService.readObject(reference[ReleaseService.OBJECT_FIELD], `${tag} ${ReleaseService.OBJECT_FIELD}`);
  }

  private static parseJson(text: string, identity: string): unknown {
    try {
      return JSON.parse(text);
    }
    catch (error) {
      throw new CommandFailedException(Resources.formatNotJson(identity), { cause: error });
    }
  }

  private static readObject(value: unknown, identity: string): Readonly<Record<string, unknown>> {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new CommandFailedException(Resources.formatNotObject(identity));

    return value as Readonly<Record<string, unknown>>;
  }

  private static readString(value: Readonly<Record<string, unknown>>, field: string, identity: string): string {
    const found = value[field];
    if (typeof found !== "string")
      throw new CommandFailedException(Resources.formatNotString(identity, field));

    return found;
  }

  private static validateVersion(version: string): string {
    if (!ReleaseService.VERSION_PATTERN.test(version))
      throw new CommandFailedException(Resources.formatUnknownVersion(version));

    return version;
  }

  private static validateCommit(commit: string): string {
    if (!ReleaseService.COMMIT_PATTERN.test(commit))
      throw new CommandFailedException(Resources.formatUnknownCommit(commit));

    return commit;
  }

  private static isNewer(version: string, latest: string): boolean {
    const newer = version.split(ReleaseService.VERSION_SEPARATOR).map(t => Number(t));
    const older = latest.split(ReleaseService.VERSION_SEPARATOR).map(t => Number(t));
    const index = newer.findIndex((t, position) => t !== older[position]);

    return index >= 0 && newer[index]! > older[index]!;
  }
}
