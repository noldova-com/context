/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from "node:crypto";
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import Script from "../../../../scripts/script.ts";
import RegexConformanceLayout from "./regex-conformance-layout.ts";
import RegexConformanceProvenance from "./regex-conformance-provenance.ts";
import RegexExpectedPatternsGenerator from "./regex-expected-patterns-generator.ts";
import RegexVendoredFile from "./regex-vendored-file.ts";
import RegexVendoredRoot from "./regex-vendored-root.ts";

export default class RegexConformanceVendor extends Script {
  private static readonly COMMIT_PATTERN: RegExp = /^[0-9a-f]{40}$/u;
  private static readonly REPOSITORY: string = "tc39/test262";
  private static readonly REPOSITORY_URL: string = "https://github.com/tc39/test262.git";
  private static readonly GITHUB_API: string = "https://api.github.com/repos";
  private static readonly RAW_CONTENT: string = "https://raw.githubusercontent.com";
  private static readonly COMMITS_PATH: string = "git/commits";
  private static readonly TREES_PATH: string = "git/trees";
  private static readonly RECURSIVE_QUERY: string = "?recursive=1";
  private static readonly ACCEPT_HEADER: string = "Accept";
  private static readonly GITHUB_ACCEPT: string = "application/vnd.github+json";
  private static readonly USER_AGENT_HEADER: string = "User-Agent";
  private static readonly USER_AGENT: string = "Noldova-CONTEXT-vendor";
  private static readonly TREE_TYPE: string = "tree";
  private static readonly BLOB_TYPE: string = "blob";
  private static readonly BLOB_HASH_ALGORITHM: string = "sha1";
  private static readonly HASH_ENCODING: "hex" = "hex";
  private static readonly STAGING_DIRECTORY: string = "_build/regex-vendor";
  private static readonly DOWNLOAD_CONCURRENCY: number = 16;
  private static readonly LICENSE_PATH: string = "LICENSE";
  private static readonly ROOTS: readonly RegexVendoredRoot[] = [
    new RegexVendoredRoot("test/annexB/built-ins/RegExp", path.posix.join(RegexConformanceLayout.CASES, "annexB/built-ins/RegExp")),
    new RegexVendoredRoot("test/built-ins/RegExp", path.posix.join(RegexConformanceLayout.CASES, "built-ins/RegExp")),
    new RegexVendoredRoot("test/language/literals/regexp", path.posix.join(RegexConformanceLayout.CASES, "language/literals/regexp")),
  ];
  private static readonly COMMIT_REQUIRED: string = "Name the Test262 commit to vendor as 40 lowercase hexadecimal digits: npm run vendor:regex -- <commit>.";
  private static readonly TREE_TRUNCATED: string = "GitHub truncated a Test262 tree listing; the intake would be incomplete.";

  private readonly trees: Map<string, JsonObjectReader> = new Map();

  public override async runAsync(): Promise<void> {
    const commit = process.argv[2];
    if (commit === undefined || !RegexConformanceVendor.COMMIT_PATTERN.test(commit))
      throw new Error(RegexConformanceVendor.COMMIT_REQUIRED);

    await this.writeLogAsync(`Listing Test262 ${commit}...`);
    const treeSha = (await this.fetchJsonAsync(`${RegexConformanceVendor.COMMITS_PATH}/${commit}`)).object("tree").string("sha");
    const roots: RegexVendoredRoot[] = [];
    const files: RegexVendoredFile[] = [];
    for (const root of RegexConformanceVendor.ROOTS) {
      const rootFiles = await this.listRootAsync(treeSha, root);
      roots.push(root.withFiles(rootFiles.length));
      files.push(...rootFiles);
    }
    const license = new RegexVendoredFile(RegexConformanceVendor.LICENSE_PATH,
      path.posix.join(RegexConformanceLayout.LICENSES, RegexConformanceVendor.LICENSE_PATH),
      await this.findEntryAsync(treeSha, RegexConformanceVendor.LICENSE_PATH, RegexConformanceVendor.BLOB_TYPE));
    files.push(license);

    await this.removeDirectoryAsync(RegexConformanceVendor.STAGING_DIRECTORY);
    await this.runStepAsync(`Downloading ${files.length} files...`, () => this.downloadAsync(commit, files));
    await this.runStepAsync("Replacing the intake...", async () => {
      for (const directory of [RegexConformanceLayout.CASES, RegexConformanceLayout.LICENSES]) {
        await this.removeDirectoryAsync(RegexConformanceLayout.pathOf(directory));
        await cp(path.join(RegexConformanceVendor.STAGING_DIRECTORY, directory), RegexConformanceLayout.pathOf(directory), { recursive: true });
      }
      await this.writeFileAsync(RegexConformanceLayout.pathOf(RegexConformanceLayout.PROVENANCE),
        new RegexConformanceProvenance(RegexConformanceVendor.REPOSITORY_URL, commit, roots, license).serialize());
    });
    await this.runStepAsync("Reading the expected patterns...", () => new RegexExpectedPatternsGenerator().runAsync());
  }

  private async listRootAsync(treeSha: string, root: RegexVendoredRoot): Promise<readonly RegexVendoredFile[]> {
    let sha = treeSha;
    for (const segment of root.upstreamRoot.split(path.posix.sep))
      sha = await this.findEntryAsync(sha, segment, RegexConformanceVendor.TREE_TYPE);

    const listing = await this.fetchJsonAsync(`${RegexConformanceVendor.TREES_PATH}/${sha}${RegexConformanceVendor.RECURSIVE_QUERY}`);
    if (listing.optionalBoolean("truncated") === true)
      throw new Error(RegexConformanceVendor.TREE_TRUNCATED);

    return listing.objects("tree")
      .filter(t => t.string("type") === RegexConformanceVendor.BLOB_TYPE)
      .map(t => new RegexVendoredFile(path.posix.join(root.upstreamRoot, t.string("path")), path.posix.join(root.localRoot, t.string("path")), t.string("sha")))
      .toSorted((left, right) => left.localPath < right.localPath ? -1 : left.localPath > right.localPath ? 1 : 0);
  }

  private async findEntryAsync(treeSha: string, name: string, type: string): Promise<string> {
    const tree = this.trees.get(treeSha) ?? await this.fetchJsonAsync(`${RegexConformanceVendor.TREES_PATH}/${treeSha}`);
    this.trees.set(treeSha, tree);
    const entry = tree.objects("tree").find(t => t.string("path") === name && t.string("type") === type);
    if (entry === undefined)
      throw new Error(RegexConformanceVendor.entryMissing(name));

    return entry.string("sha");
  }

  private async downloadAsync(commit: string, files: readonly RegexVendoredFile[]): Promise<void> {
    let next = 0;
    const downloadNextAsync = async (): Promise<void> => {
      for (let file = files[next++]; file !== undefined; file = files[next++])
        await this.downloadFileAsync(commit, file);
    };
    await Promise.all(Array.from({ length: RegexConformanceVendor.DOWNLOAD_CONCURRENCY }, downloadNextAsync));
  }

  private async downloadFileAsync(commit: string, file: RegexVendoredFile): Promise<void> {
    const url = `${RegexConformanceVendor.RAW_CONTENT}/${RegexConformanceVendor.REPOSITORY}/${commit}/${file.upstreamPath}`;
    const response = await fetch(url, { headers: { [RegexConformanceVendor.USER_AGENT_HEADER]: RegexConformanceVendor.USER_AGENT } });
    if (!response.ok)
      throw new Error(RegexConformanceVendor.requestFailed(url, response.status));

    const bytes = Buffer.from(await response.arrayBuffer());
    const blobSha = createHash(RegexConformanceVendor.BLOB_HASH_ALGORITHM).update(`blob ${bytes.length}\0`).update(bytes).digest(RegexConformanceVendor.HASH_ENCODING);
    if (blobSha !== file.blobSha)
      throw new Error(RegexConformanceVendor.blobMismatch(file.upstreamPath, blobSha, file.blobSha));

    const target = path.join(RegexConformanceVendor.STAGING_DIRECTORY, file.localPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }

  private async fetchJsonAsync(resource: string): Promise<JsonObjectReader> {
    const url = `${RegexConformanceVendor.GITHUB_API}/${RegexConformanceVendor.REPOSITORY}/${resource}`;
    const response = await fetch(url, {
      headers: {
        [RegexConformanceVendor.ACCEPT_HEADER]: RegexConformanceVendor.GITHUB_ACCEPT,
        [RegexConformanceVendor.USER_AGENT_HEADER]: RegexConformanceVendor.USER_AGENT,
      },
    });
    if (!response.ok)
      throw new Error(RegexConformanceVendor.requestFailed(url, response.status));

    return JsonObjectReader.parse(await response.text(), url);
  }

  private static entryMissing(name: string): string {
    return `The pinned Test262 tree holds no ${name}.`;
  }

  private static requestFailed(url: string, status: number): string {
    return `${url} answered HTTP ${status}.`;
  }

  private static blobMismatch(upstreamPath: string, actual: string, expected: string): string {
    return `${upstreamPath} downloaded as blob ${actual}, where the pinned tree names ${expected}.`;
  }
}
