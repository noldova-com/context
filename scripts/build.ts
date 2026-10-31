/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This script builds CONTEXT.
 *
 * @example
 * npm run build - builds all projects.
 * npm run build project1 project2 ... - builds specified projects.
 */

import path from "node:path";

import { CommandFailedException, type PackageInfo } from "../src/noldova.context.tooling/src/api/index.ts";
import Config from "./config.ts";
import Script from "./script.ts";

export class Build extends Script {
  private static readonly BUILD_SCRIPT_PATH: string = "scripts/build.ts";
  private static readonly CLEAN_INSTALL_ARGUMENTS: readonly string[] = ["ci", "--ignore-scripts"];
  private static readonly INSTALL_ARGUMENTS: readonly string[] = ["install", "--no-save", "--ignore-scripts", "--no-audit", "--no-fund"];
  private static readonly INSTALLING_PACKAGES: string = "Installing npm packages…";
  private static readonly LICENSE_FILE_NAME: string = "LICENSE";
  private static readonly NODE_MODULES_DIRECTORY_NAME: string = "node_modules";
  private static readonly NO_PACKAGES: string = "No packages to build.";
  private static readonly NOTICES_FILE_NAME: string = "THIRD-PARTY-NOTICES.txt";
  private static readonly PACKAGE_MANIFEST_FILE_NAME: string = "package.json";
  private static readonly VERSION_PLACEHOLDER: string = "__VERSION__";

  public override async runAsync(): Promise<void> {
    await this.npmInstallAsync();
    await this.createOutputDirectoriesAsync();

    const packagesInfo = await this.getPackagesInfoAsync();
    if (packagesInfo.length === 0) {
      await this.writeLogAsync(Build.NO_PACKAGES);
      return;
    }

    await this.executeActionAsync(packagesInfo, this.buildPackageAsync.bind(this));
  }

  private async npmInstallAsync(): Promise<void> {
    if (!(await this.pathExistsAsync(Build.NODE_MODULES_DIRECTORY_NAME))) {
      await this.writeLogAsync(Build.INSTALLING_PACKAGES);
      await this.executeNPMCommandAsync(Build.CLEAN_INSTALL_ARGUMENTS, process.cwd());
    }
  }

  private async createOutputDirectoriesAsync(): Promise<void> {
    await this.createDirectoryAsync(Config.BUILD_FOLDER);
    await this.createDirectoryAsync(Config.PACKAGES_FOLDER);
  }

  private async buildPackageAsync(packageInfo: PackageInfo): Promise<void> {
    await this.runStepAsync(Build.buildingPackage(packageInfo.packageName), async () => {
      await this.createPackageDirectoryAsync(packageInfo);
      await this.writePackageFileAsync(packageInfo);
      await this.copyLicenseFileAsync(packageInfo);
      await this.copyNoticesFileAsync(packageInfo);
      await this.buildAsync(packageInfo);
      await this.createPackageAsync(packageInfo);
      await this.installPackagesAsync();
    });
  }

  private async createPackageDirectoryAsync(packageInfo: PackageInfo): Promise<void> {
    const directoryName = `${Config.BUILD_FOLDER}/${packageInfo.name}`;

    await this.removeDirectoryAsync(directoryName);
    await this.createDirectoryAsync(directoryName);
  }

  private async writePackageFileAsync(packageInfo: PackageInfo): Promise<void> {
    const packageFilePath = `${Build.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Build.PACKAGE_MANIFEST_FILE_NAME}`;

    if (await this.pathExistsAsync(packageFilePath) === false)
      throw new CommandFailedException(Build.packageManifestMissing(packageFilePath));

    const content = await this.readFileAsync(packageFilePath);
    await this.writeFileAsync(`${Config.BUILD_FOLDER}/${packageInfo.name}/${Build.PACKAGE_MANIFEST_FILE_NAME}`, content.replaceAll(Build.VERSION_PLACEHOLDER, Config.VERSION));
  }

  private async copyLicenseFileAsync(packageInfo: PackageInfo): Promise<void> {
    await this.copyFileAsync(Build.LICENSE_FILE_NAME, `${Config.BUILD_FOLDER}/${packageInfo.name}/${Build.LICENSE_FILE_NAME}`);
  }

  private async copyNoticesFileAsync(packageInfo: PackageInfo): Promise<void> {
    const noticesFilePath = `${Build.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Build.NOTICES_FILE_NAME}`;

    if (await this.pathExistsAsync(noticesFilePath))
      await this.copyFileAsync(noticesFilePath, `${Config.BUILD_FOLDER}/${packageInfo.name}/${Build.NOTICES_FILE_NAME}`);
  }

  private async buildAsync(packageInfo: PackageInfo): Promise<void> {
    const buildScriptPath = `${Build.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Build.BUILD_SCRIPT_PATH}`;
    if (!await this.pathExistsAsync(buildScriptPath)) {
      await this.compilePackageAsync(packageInfo);
      return;
    }

    const buildClassImport = await import(`../${buildScriptPath}`);
    await new buildClassImport.Build().runAsync(packageInfo);
  }

  private async createPackageAsync(packageInfo: PackageInfo): Promise<void> {
    const packageDirectory = `${Config.BUILD_FOLDER}/${packageInfo.name}`;
    await this.executeNPMCommandAsync(
      ["pack", "--silent", "--pack-destination", path.resolve(Config.PACKAGES_FOLDER)],
      path.resolve(packageDirectory),
      true);
  }

  private async installPackagesAsync(): Promise<void> {
    const archives: string[] = [];
    for (const packageInfo of Config.PACKAGES_INFO) {
      const archive = `./${Config.PACKAGES_FOLDER}/${packageInfo.archiveName(Config.VERSION)}`;
      if (await this.pathExistsAsync(archive))
        archives.push(archive);
    }

    await this.executeNPMCommandAsync([...Build.INSTALL_ARGUMENTS, ...archives], process.cwd(), true);
  }

  private static buildingPackage(packageName: string): string {
    return `Building "${packageName}"...`;
  }

  private static packageManifestMissing(packageFilePath: string): string {
    return `Missing ${Build.PACKAGE_MANIFEST_FILE_NAME} in "${packageFilePath}" package.`;
  }
}

const builder = new Build();
await builder.runAsEntryPointAsync();
