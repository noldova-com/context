/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly releaseUsage: string = "Usage: npm run release -- source <version> <commit> | check <folder> <version> <commit> | publish <folder> <version> <commit> | tag <version> <commit>";

  public static formatAlreadyPublished(name: string, version: string): string {
    return `${name}@${version} is already published from this archive, so publishing skips it.`;
  }

  public static formatAlreadyTagged(tag: string, commit: string): string {
    return `${tag} already points at ${commit}; there is nothing to tag.`;
  }

  public static formatArchiveChecked(archiveName: string, name: string, version: string, commit: string): string {
    return `${archiveName}: ${name}@${version} from ${commit}`;
  }

  public static formatArchiveMissing(folder: string, archiveName: string): string {
    return `${folder} lacks ${archiveName}.`;
  }

  public static formatArchiveUnexpected(folder: string, fileName: string, version: string): string {
    return `${folder} holds ${fileName}, which is not a published package's archive at ${version}.`;
  }

  public static formatCommitNotOnMain(commit: string): string {
    return `${commit} is not on main, so it cannot be released.`;
  }

  public static formatDependencyDiffers(archiveName: string, dependency: string, range: string, version: string): string {
    return `${archiveName}: its dependency ${dependency} is "${range}", not exactly "${version}".`;
  }

  public static formatFieldDiffers(archiveName: string, field: string, found: string, expected: string): string {
    return `${archiveName}: its ${field} is "${found}", not "${expected}".`;
  }

  public static formatFolderMissing(folder: string): string {
    return `There is no folder ${folder} with the archives to release.`;
  }

  public static formatGitFailed(arguments_: string, exitCode: number | null, errorOutput: string): string {
    return `git ${arguments_} failed with exit code ${exitCode}:\n${errorOutput}`;
  }

  public static formatGitHubUnreachable(address: string): string {
    return `GitHub could not be reached at ${address}.`;
  }

  public static formatHeadDiffers(head: string, commit: string): string {
    return `The checkout is at ${head}, not at ${commit}, the commit to release.`;
  }

  public static formatMalformedEntry(archivePath: string, offset: number): string {
    return `${archivePath} has a malformed or truncated entry at offset ${offset}.`;
  }

  public static formatManifestMissing(archiveName: string, entryName: string): string {
    return `${archiveName} has no ${entryName}.`;
  }

  public static formatMarkedPrivate(archiveName: string): string {
    return `${archiveName}: is marked private, so npm would refuse to publish it.`;
  }

  public static formatNoVersionAtCommit(configFilePath: string, commit: string, version: string): string {
    return `${configFilePath} at ${commit} holds no version, not "${version}"; the version changes in a pull request before its release.`;
  }

  public static formatNotJson(identity: string): string {
    return `${identity} is not valid JSON.`;
  }

  public static formatNotNewer(name: string, version: string, latest: string): string {
    return `${name}@${version} is not newer than ${latest}, its latest published version.`;
  }

  public static formatNotObject(identity: string): string {
    return `${identity} must be an object.`;
  }

  public static formatNotPublished(name: string, version: string, waitSeconds: number): string {
    return `${name}@${version} was not on the registry ${waitSeconds} seconds after the last publish; check the registry before releasing again.`;
  }

  public static formatNotPublishedAfterError(name: string, version: string, waitSeconds: number, lastError: string): string {
    return `${name}@${version} was not on the registry ${waitSeconds} seconds after the last publish, and the last read failed: ${lastError}`;
  }

  public static formatNotString(identity: string, field: string): string {
    return `${identity}: its ${field} must be a string.`;
  }

  public static formatOtherVersionAtCommit(configFilePath: string, commit: string, found: string, version: string): string {
    return `${configFilePath} at ${commit} holds the version "${found}", not "${version}"; the version changes in a pull request before its release.`;
  }

  public static formatOutsideScope(archiveName: string, name: string, scope: string): string {
    return `${archiveName}: ${name} is outside the scope ${scope}.`;
  }

  public static formatPublished(name: string, version: string): string {
    return `${name}@${version} published.`;
  }

  public static formatPublishedOtherwise(name: string, version: string): string {
    return `${name}@${version} is already published from another archive; a version is published once, so this release needs a new version.`;
  }

  public static formatSourceChecked(commit: string, configFilePath: string, version: string): string {
    return `${commit} is on main, and ${configFilePath} there holds ${version}.`;
  }

  public static formatTagElsewhere(tag: string, tagged: string, commit: string): string {
    return `The tag ${tag} already points at ${tagged}, not at ${commit}; a version is used once, so this release needs a new version.`;
  }

  public static formatTagNotCreated(tag: string, status: number, text: string): string {
    return `GitHub answered ${status} when creating the tag ${tag}: ${text}`;
  }

  public static formatTagUnreadable(tag: string, status: number, text: string): string {
    return `GitHub answered ${status} when reading the tag ${tag}: ${text}`;
  }

  public static formatTagged(commit: string, tag: string): string {
    return `Tagged ${commit} as ${tag}.`;
  }

  public static formatUnknownAccess(access: string, accessLevels: readonly string[]): string {
    return `The access "${access}" is not one of ${accessLevels.join(" or ")}.`;
  }

  public static formatUnknownCommit(commit: string): string {
    return `The commit "${commit}" is not a full 40-character commit hash.`;
  }

  public static formatUnknownVersion(version: string): string {
    return `The version "${version}" is not of the form 0.0.<n>, which every CONTEXT package uses until the first public release.`;
  }

  public static formatUnreadableArchive(archivePath: string): string {
    return `${archivePath} could not be read as a gzipped archive.`;
  }

  public static formatUnreadableLatest(name: string, latest: string): string {
    return `${name}'s latest version is ${latest}, which is not of the form major.minor.patch, so whether this version is newer is unknown.`;
  }

  public static formatUnreadableRegistry(specifier: string, exitCode: number | null, errorOutput: string): string {
    return `npm view ${specifier} failed with exit code ${exitCode}, so what is published is unknown:\n${errorOutput}`;
  }

  public static formatVariableMissing(name: string): string {
    return `${name} is not set; the shared npm release workflow sets it.`;
  }
}
