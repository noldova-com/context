/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from "node:crypto";
import { createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { cp } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import Script from "../../../../scripts/script.ts";
import TarArchiveReader from "./tar-archive.reader.ts";
import TypeScriptConformanceLayout from "./typescript-conformance-layout.ts";
import TypeScriptConformanceProvenance from "./typescript-conformance-provenance.ts";
import TypeScriptExpectedDiagnosticsGenerator from "./typescript-expected-diagnostics-generator.ts";
import TypeScriptPlatformPackage from "./typescript-platform-package.ts";
import TypeScriptVendoredArchive from "./typescript-vendored-archive.ts";
import TypeScriptVendoredCatalogRecord from "./typescript-vendored-catalog-record.ts";
import TypeScriptVendoredCatalog from "./typescript-vendored-catalog.ts";
import TypeScriptVendoredComposition from "./typescript-vendored-composition.ts";
import TypeScriptVendoredCorpus from "./typescript-vendored-corpus.ts";
import TypeScriptVendoredDiagnostics from "./typescript-vendored-diagnostics.ts";
import TypeScriptVendoredFile from "./typescript-vendored-file.ts";
import TypeScriptVendoredLibraryRecord from "./typescript-vendored-library-record.ts";
import TypeScriptVendoredLicenseRecord from "./typescript-vendored-license-record.ts";
import TypeScriptVendoredLicenses from "./typescript-vendored-licenses.ts";
import TypeScriptVendoredSectionRecord from "./typescript-vendored-section-record.ts";
import TypeScriptVendoredSection from "./typescript-vendored-section.ts";
import TypeScriptVendoredSelection from "./typescript-vendored-selection.ts";
import TypeScriptVendoredSource from "./typescript-vendored-source.ts";
import TypeScriptVendoredSources from "./typescript-vendored-sources.ts";
import TypeScriptVendoredSuite from "./typescript-vendored-suite.ts";

export default class TypeScriptConformanceVendor extends Script {
  private static readonly DOWNLOAD_DIRECTORY: string = "_build/typescript-vendor";
  private static readonly STAGING_DIRECTORY: string = path.posix.join(TypeScriptConformanceVendor.DOWNLOAD_DIRECTORY, "intake");
  private static readonly VERSION_PATTERN: RegExp = /^\d+\.\d+\.\d+$/u;

  private static readonly GITHUB_API: string = "https://api.github.com/repos";
  private static readonly GITHUB_ARCHIVES: string = "https://codeload.github.com";
  private static readonly GITHUB_REPOSITORY_ROOT: string = "https://github.com";
  private static readonly GITHUB_ACCEPT: string = "application/vnd.github+json";
  private static readonly GITHUB_GIT_PATH: string = "git";
  private static readonly GITHUB_TAG_REFERENCES_PATH: string = "ref/tags";
  private static readonly GITHUB_TAGS_PATH: string = "tags";
  private static readonly GITHUB_CONTENTS_PATH: string = "contents";
  private static readonly GITHUB_REFERENCE_QUERY: string = "?ref=";
  private static readonly OBJECT_SHA_PATH: readonly string[] = ["object", "sha"];
  private static readonly OBJECT_TYPE_PATH: readonly string[] = ["object", "type"];
  private static readonly SHA_PATH: readonly string[] = ["sha"];
  private static readonly DIST_TARBALL_PATH: readonly string[] = ["dist", "tarball"];
  private static readonly DIST_INTEGRITY_PATH: readonly string[] = ["dist", "integrity"];
  private static readonly NPM_REGISTRY: string = "https://registry.npmjs.org";
  private static readonly ACCEPT_HEADER: string = "Accept";
  private static readonly USER_AGENT_HEADER: string = "User-Agent";
  private static readonly USER_AGENT: string = "Noldova-CONTEXT-vendor";
  private static readonly TYPESCRIPT_GO_REPOSITORY: string = "microsoft/typescript-go";
  private static readonly TYPESCRIPT_REPOSITORY: string = "microsoft/TypeScript";
  private static readonly TAG_PREFIX: string = "typescript/v";
  private static readonly TAG_OBJECT_TYPE: string = "tag";
  private static readonly SUBMODULE_PATH: string = "_submodules/TypeScript";
  private static readonly GIT_SUFFIX: string = ".git";
  private static readonly TAR_GZIP: string = "tar.gz";
  private static readonly INTEGRITY_ALGORITHM: string = "sha512";
  private static readonly INTEGRITY_ENCODING: "base64" = "base64";
  private static readonly TYPESCRIPT_GO_SOURCE: string = "typescriptGo";
  private static readonly TYPESCRIPT_SOURCE: string = "typescript";
  private static readonly NATIVE: string = "native";
  private static readonly CLASSIC: string = "classic";

  private static readonly ERRORS_SELECTION: TypeScriptVendoredSelection = new TypeScriptVendoredSelection("", ".errors.txt");
  private static readonly LIBRARY_SELECTION: TypeScriptVendoredSelection = new TypeScriptVendoredSelection("lib", ".d.ts");
  private static readonly NATIVE_CASES: TypeScriptVendoredSection = new TypeScriptVendoredSection(
    ["testdata/tests/cases"], path.posix.join(TypeScriptConformanceLayout.CASES, TypeScriptConformanceVendor.NATIVE));
  private static readonly NATIVE_BASELINES: TypeScriptVendoredSection = new TypeScriptVendoredSection(
    ["testdata/baselines/reference/compiler", "testdata/baselines/reference/conformance"],
    path.posix.join(TypeScriptConformanceLayout.BASELINES, TypeScriptConformanceVendor.NATIVE), TypeScriptConformanceVendor.ERRORS_SELECTION);
  private static readonly CLASSIC_CASES: TypeScriptVendoredSection = new TypeScriptVendoredSection(
    ["tests/cases/compiler", "tests/cases/conformance"], path.posix.join(TypeScriptConformanceLayout.CASES, TypeScriptConformanceVendor.CLASSIC));
  private static readonly CLASSIC_BASELINES: TypeScriptVendoredSection = new TypeScriptVendoredSection(
    ["testdata/baselines/reference/submodule/compiler", "testdata/baselines/reference/submodule/conformance"],
    path.posix.join(TypeScriptConformanceLayout.BASELINES, TypeScriptConformanceVendor.CLASSIC), TypeScriptConformanceVendor.ERRORS_SELECTION);
  private static readonly LIBRARIES: TypeScriptVendoredSection = new TypeScriptVendoredSection(
    [TypeScriptPlatformPackage.LIBRARY_DIRECTORY], TypeScriptConformanceLayout.LIBRARIES, TypeScriptConformanceVendor.LIBRARY_SELECTION);
  private static readonly NATIVE_DEFINITIONS: TypeScriptVendoredFile = new TypeScriptVendoredFile("internal/diagnostics/extraDiagnosticMessages.json",
    path.posix.join(TypeScriptConformanceLayout.DIAGNOSTIC_DEFINITIONS, TypeScriptConformanceVendor.NATIVE, "extraDiagnosticMessages.json"));
  private static readonly CLASSIC_DEFINITIONS: TypeScriptVendoredFile = new TypeScriptVendoredFile("src/compiler/diagnosticMessages.json",
    path.posix.join(TypeScriptConformanceLayout.DIAGNOSTIC_DEFINITIONS, TypeScriptConformanceVendor.CLASSIC, "diagnosticMessages.json"));
  private static readonly NATIVE_LICENSES_ROOT: string = path.posix.join(TypeScriptConformanceLayout.LICENSES, TypeScriptConformanceVendor.NATIVE);
  private static readonly CLASSIC_LICENSES_ROOT: string = path.posix.join(TypeScriptConformanceLayout.LICENSES, TypeScriptConformanceVendor.CLASSIC);

  private static readonly GO_ARCHIVE: TypeScriptVendoredArchive = new TypeScriptVendoredArchive("typescript-go.tar.gz",
    [TypeScriptConformanceVendor.NATIVE_CASES, TypeScriptConformanceVendor.NATIVE_BASELINES, TypeScriptConformanceVendor.CLASSIC_BASELINES],
    [TypeScriptConformanceVendor.NATIVE_DEFINITIONS, ...TypeScriptConformanceVendor.licenses(TypeScriptConformanceVendor.NATIVE_LICENSES_ROOT, ["LICENSE", "NOTICE.txt"])]);
  private static readonly TYPESCRIPT_ARCHIVE: TypeScriptVendoredArchive = new TypeScriptVendoredArchive("typescript.tar.gz", [TypeScriptConformanceVendor.CLASSIC_CASES],
    [TypeScriptConformanceVendor.CLASSIC_DEFINITIONS,
      ...TypeScriptConformanceVendor.licenses(TypeScriptConformanceVendor.CLASSIC_LICENSES_ROOT, ["LICENSE.txt", "ThirdPartyNoticeText.txt"])]);
  private static readonly PACKAGE_ARCHIVE: TypeScriptVendoredArchive = new TypeScriptVendoredArchive("package.tgz", [TypeScriptConformanceVendor.LIBRARIES], []);
  private static readonly ARCHIVES: readonly TypeScriptVendoredArchive[] = [
    TypeScriptConformanceVendor.GO_ARCHIVE,
    TypeScriptConformanceVendor.TYPESCRIPT_ARCHIVE,
    TypeScriptConformanceVendor.PACKAGE_ARCHIVE,
  ];

  private readonly rootCounts: Map<string, number> = new Map();
  private readonly written: Set<TypeScriptVendoredFile> = new Set();

  public override async runAsync(): Promise<void> {
    const version = process.argv[2];
    if (version === undefined || !TypeScriptConformanceVendor.VERSION_PATTERN.test(version))
      throw new Error(TypeScriptConformanceVendor.VERSION_REQUIRED);

    const installedVersion = await this.readTypeScriptVersionAsync();
    if (installedVersion !== version)
      throw new Error(TypeScriptConformanceVendor.compilerNotInstalled(version, installedVersion));

    const tag = `${TypeScriptConformanceVendor.TAG_PREFIX}${version}`;
    const goCommit = await TypeScriptConformanceVendor.resolveTagAsync(tag);
    const typescriptCommit = await TypeScriptConformanceVendor.resolveSubmoduleAsync(goCommit);
    await this.writeLogAsync(TypeScriptConformanceVendor.resolved(tag, goCommit, typescriptCommit));

    await this.removeDirectoryAsync(TypeScriptConformanceVendor.DOWNLOAD_DIRECTORY);
    await this.createDirectoryAsync(TypeScriptConformanceVendor.DOWNLOAD_DIRECTORY);
    await this.downloadAsync(TypeScriptConformanceVendor.archiveUrl(TypeScriptConformanceVendor.TYPESCRIPT_GO_REPOSITORY, goCommit), TypeScriptConformanceVendor.GO_ARCHIVE);
    await this.downloadAsync(TypeScriptConformanceVendor.archiveUrl(TypeScriptConformanceVendor.TYPESCRIPT_REPOSITORY, typescriptCommit),
      TypeScriptConformanceVendor.TYPESCRIPT_ARCHIVE);
    await this.downloadPackageAsync(version, TypeScriptConformanceVendor.PACKAGE_ARCHIVE);

    for (const archive of TypeScriptConformanceVendor.ARCHIVES)
      await this.extractAsync(archive);
    this.verifyEverythingCopied();
    const provenance = this.createProvenance(version, tag, goCommit, typescriptCommit);

    for (const directory of TypeScriptConformanceVendor.replacedDirectories()) {
      const intakeDirectory = TypeScriptConformanceLayout.pathOf(directory);
      await this.removeDirectoryAsync(intakeDirectory);
      await cp(path.join(TypeScriptConformanceVendor.STAGING_DIRECTORY, directory), intakeDirectory, { recursive: true });
    }
    await this.writeFileAsync(TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.PROVENANCE), provenance.serialize());
    await this.removeDirectoryAsync(TypeScriptConformanceVendor.DOWNLOAD_DIRECTORY);
    await this.writeLogAsync(TypeScriptConformanceVendor.INTAKE_WRITTEN);

    await new TypeScriptExpectedDiagnosticsGenerator().regenerateAsync();
  }

  private async extractAsync(archive: TypeScriptVendoredArchive): Promise<void> {
    const localPathOf = (t: string): string | undefined => {
      const upstreamPath = t.slice(t.indexOf(path.posix.sep) + 1);
      const file = archive.files.find(t => t.upstreamPath === upstreamPath);
      if (file !== undefined) {
        this.written.add(file);
        return file.localPath;
      }
      for (const section of archive.sections) {
        const root = section.rootOf(upstreamPath);
        if (root !== undefined) {
          this.rootCounts.set(root, (this.rootCounts.get(root) ?? 0) + 1);
          return section.localPathOf(root, upstreamPath);
        }
      }
      return undefined;
    };

    await TarArchiveReader.readAsync(TypeScriptConformanceVendor.downloadPath(archive), localPathOf, async (localPath, content) => {
      const filePath = path.join(TypeScriptConformanceVendor.STAGING_DIRECTORY, localPath);
      await this.createDirectoryAsync(path.dirname(filePath));
      writeFileSync(filePath, content);
    });
  }

  private verifyEverythingCopied(): void {
    for (const archive of TypeScriptConformanceVendor.ARCHIVES) {
      for (const section of archive.sections)
        for (const root of section.upstreamRoots)
          if (!this.rootCounts.has(root))
            throw new Error(TypeScriptConformanceVendor.rootEmpty(root, section));
      for (const file of archive.files)
        if (!this.written.has(file))
          throw new Error(TypeScriptConformanceVendor.fileMissing(file));
    }
  }

  private filesOf(section: TypeScriptVendoredSection): number {
    return section.upstreamRoots.reduce((total, t) => total + this.rootCounts.get(t)!, 0);
  }

  private sectionRecord(source: string, section: TypeScriptVendoredSection): TypeScriptVendoredSectionRecord {
    return TypeScriptVendoredSectionRecord.of(source, section, this.filesOf(section));
  }

  private createProvenance(version: string, tag: string, goCommit: string, typescriptCommit: string): TypeScriptConformanceProvenance {
    const go = TypeScriptConformanceVendor.TYPESCRIPT_GO_SOURCE;
    const typescript = TypeScriptConformanceVendor.TYPESCRIPT_SOURCE;
    const classic = TypeScriptVendoredCatalog.read(path.join(TypeScriptConformanceVendor.STAGING_DIRECTORY, TypeScriptConformanceVendor.CLASSIC_DEFINITIONS.localPath));
    const native = TypeScriptVendoredCatalog.read(path.join(TypeScriptConformanceVendor.STAGING_DIRECTORY, TypeScriptConformanceVendor.NATIVE_DEFINITIONS.localPath));

    return new TypeScriptConformanceProvenance(
      version,
      new TypeScriptVendoredSources(
        new TypeScriptVendoredSource(TypeScriptConformanceVendor.repositoryUrl(TypeScriptConformanceVendor.TYPESCRIPT_GO_REPOSITORY), tag, goCommit),
        new TypeScriptVendoredSource(TypeScriptConformanceVendor.repositoryUrl(TypeScriptConformanceVendor.TYPESCRIPT_REPOSITORY), undefined, typescriptCommit)),
      new TypeScriptVendoredCorpus(
        new TypeScriptVendoredSuite(
          this.sectionRecord(go, TypeScriptConformanceVendor.NATIVE_CASES), this.sectionRecord(go, TypeScriptConformanceVendor.NATIVE_BASELINES)),
        new TypeScriptVendoredSuite(
          this.sectionRecord(typescript, TypeScriptConformanceVendor.CLASSIC_CASES), this.sectionRecord(go, TypeScriptConformanceVendor.CLASSIC_BASELINES))),
      new TypeScriptVendoredLibraryRecord(
        go,
        TypeScriptPlatformPackage.NAME_PATTERN,
        version,
        TypeScriptPlatformPackage.LIBRARY_DIRECTORY,
        TypeScriptConformanceVendor.LIBRARY_SELECTION.text,
        TypeScriptConformanceVendor.LIBRARIES.localRoot,
        this.filesOf(TypeScriptConformanceVendor.LIBRARIES)),
      new TypeScriptVendoredDiagnostics(
        TypeScriptVendoredCatalogRecord.of(typescript, TypeScriptConformanceVendor.CLASSIC_DEFINITIONS, classic),
        TypeScriptVendoredCatalogRecord.of(go, TypeScriptConformanceVendor.NATIVE_DEFINITIONS, native),
        TypeScriptVendoredComposition.of(classic, native)),
      new TypeScriptVendoredLicenses(
        new TypeScriptVendoredLicenseRecord(go, TypeScriptConformanceVendor.NATIVE_LICENSES_ROOT),
        new TypeScriptVendoredLicenseRecord(typescript, TypeScriptConformanceVendor.CLASSIC_LICENSES_ROOT)));
  }

  private async downloadAsync(url: string, archive: TypeScriptVendoredArchive): Promise<void> {
    await this.writeLogAsync(TypeScriptConformanceVendor.downloading(url));
    const response = await fetch(url, { headers: { [TypeScriptConformanceVendor.USER_AGENT_HEADER]: TypeScriptConformanceVendor.USER_AGENT } });
    if (!response.ok || response.body === null)
      throw new Error(TypeScriptConformanceVendor.requestFailed(url, response.status));
    await pipeline(Readable.fromWeb(response.body as ReadableStream<Uint8Array>), createWriteStream(TypeScriptConformanceVendor.downloadPath(archive)));
  }

  private async downloadPackageAsync(version: string, archive: TypeScriptVendoredArchive): Promise<void> {
    const url = `${TypeScriptConformanceVendor.NPM_REGISTRY}/${TypeScriptPlatformPackage.NAME}/${version}`;
    const metadata = await TypeScriptConformanceVendor.fetchJsonAsync(url, undefined);
    const tarball = TypeScriptConformanceVendor.readText(metadata, TypeScriptConformanceVendor.DIST_TARBALL_PATH, url);
    const expectedIntegrity = TypeScriptConformanceVendor.readText(metadata, TypeScriptConformanceVendor.DIST_INTEGRITY_PATH, url);
    await this.downloadAsync(tarball, archive);
    const integrity = `${TypeScriptConformanceVendor.INTEGRITY_ALGORITHM}-${createHash(TypeScriptConformanceVendor.INTEGRITY_ALGORITHM)
      .update(readFileSync(TypeScriptConformanceVendor.downloadPath(archive))).digest(TypeScriptConformanceVendor.INTEGRITY_ENCODING)}`;
    if (integrity !== expectedIntegrity)
      throw new Error(TypeScriptConformanceVendor.integrityMismatch(tarball));
  }

  private static async resolveTagAsync(tag: string): Promise<string> {
    const api = `${TypeScriptConformanceVendor.GITHUB_API}/${TypeScriptConformanceVendor.TYPESCRIPT_GO_REPOSITORY}/${TypeScriptConformanceVendor.GITHUB_GIT_PATH}`;
    const referenceUrl = `${api}/${TypeScriptConformanceVendor.GITHUB_TAG_REFERENCES_PATH}/${tag}`;
    const reference = await TypeScriptConformanceVendor.fetchJsonAsync(referenceUrl, TypeScriptConformanceVendor.GITHUB_ACCEPT);
    const sha = TypeScriptConformanceVendor.readText(reference, TypeScriptConformanceVendor.OBJECT_SHA_PATH, referenceUrl);
    if (TypeScriptConformanceVendor.readText(reference, TypeScriptConformanceVendor.OBJECT_TYPE_PATH, referenceUrl) !== TypeScriptConformanceVendor.TAG_OBJECT_TYPE)
      return sha;

    const tagUrl = `${api}/${TypeScriptConformanceVendor.GITHUB_TAGS_PATH}/${sha}`;
    return TypeScriptConformanceVendor.readText(await TypeScriptConformanceVendor.fetchJsonAsync(tagUrl, TypeScriptConformanceVendor.GITHUB_ACCEPT),
      TypeScriptConformanceVendor.OBJECT_SHA_PATH, tagUrl);
  }

  private static async resolveSubmoduleAsync(goCommit: string): Promise<string> {
    const url = `${TypeScriptConformanceVendor.GITHUB_API}/${TypeScriptConformanceVendor.TYPESCRIPT_GO_REPOSITORY}/${TypeScriptConformanceVendor.GITHUB_CONTENTS_PATH}/`
      + `${TypeScriptConformanceVendor.SUBMODULE_PATH}${TypeScriptConformanceVendor.GITHUB_REFERENCE_QUERY}${goCommit}`;
    return TypeScriptConformanceVendor.readText(await TypeScriptConformanceVendor.fetchJsonAsync(url, TypeScriptConformanceVendor.GITHUB_ACCEPT), TypeScriptConformanceVendor.SHA_PATH, url);
  }

  private static async fetchJsonAsync(url: string, accept: string | undefined): Promise<unknown> {
    const headers: Record<string, string> = { [TypeScriptConformanceVendor.USER_AGENT_HEADER]: TypeScriptConformanceVendor.USER_AGENT };
    if (accept !== undefined)
      headers[TypeScriptConformanceVendor.ACCEPT_HEADER] = accept;
    const response = await fetch(url, { headers });
    if (!response.ok)
      throw new Error(TypeScriptConformanceVendor.requestFailed(url, response.status));
    return await response.json();
  }

  private static readText(answer: unknown, keys: readonly string[], url: string): string {
    let value: unknown = answer;
    for (const key of keys)
      value = typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
    if (typeof value !== "string" || value.length === 0)
      throw new Error(TypeScriptConformanceVendor.fieldMissing(url, keys));
    return value;
  }

  private static replacedDirectories(): readonly string[] {
    const places = TypeScriptConformanceVendor.ARCHIVES.flatMap(t => [...t.sections.map(t => t.localRoot), ...t.files.map(t => t.localPath)]);
    return [...new Set(places.map(t => t.split(path.posix.sep)[0]!))];
  }

  private static licenses(localRoot: string, names: readonly string[]): readonly TypeScriptVendoredFile[] {
    return names.map(t => new TypeScriptVendoredFile(t, path.posix.join(localRoot, t)));
  }

  private static downloadPath(archive: TypeScriptVendoredArchive): string {
    return path.join(TypeScriptConformanceVendor.DOWNLOAD_DIRECTORY, archive.fileName);
  }

  private static archiveUrl(repository: string, commit: string): string {
    return `${TypeScriptConformanceVendor.GITHUB_ARCHIVES}/${repository}/${TypeScriptConformanceVendor.TAR_GZIP}/${commit}`;
  }

  private static repositoryUrl(repository: string): string {
    return `${TypeScriptConformanceVendor.GITHUB_REPOSITORY_ROOT}/${repository}${TypeScriptConformanceVendor.GIT_SUFFIX}`;
  }

  private static readonly VERSION_REQUIRED: string = "Name the TypeScript version to vendor, as in: npm run vendor:typescript -- 7.0.2";
  private static readonly INTAKE_WRITTEN: string = "Wrote the conformance intake; regenerating the expected diagnostics.";

  private static compilerNotInstalled(version: string, installedVersion: string): string {
    return `The installed reference compiler is TypeScript ${installedVersion}; pin and install TypeScript ${version} first, since it generates the expected diagnostics.`;
  }

  private static resolved(tag: string, goCommit: string, typescriptCommit: string): string {
    return `Resolved ${tag} to TypeScript-Go ${goCommit}, whose TypeScript submodule is ${typescriptCommit}.`;
  }

  private static downloading(url: string): string {
    return `Downloading ${url}`;
  }

  private static requestFailed(url: string, status: number): string {
    return `${url} answered ${status}.`;
  }

  private static fieldMissing(url: string, keys: readonly string[]): string {
    return `${url} answered without the text field ${keys.join(".")}.`;
  }

  private static integrityMismatch(url: string): string {
    return `${url} does not match the integrity the registry records for it.`;
  }

  private static rootEmpty(root: string, section: TypeScriptVendoredSection): string {
    return `The upstream root ${root} supplied no file to ${section.localRoot}; it is missing at this pin.`;
  }

  private static fileMissing(file: TypeScriptVendoredFile): string {
    return `The upstream file ${file.upstreamPath} is missing at this pin.`;
  }
}
