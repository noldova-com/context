/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This script runs the steps of the organization's shared npm release workflow through noldova.context.tooling's ReleaseService.
 * It runs that package's source with Node's type stripping and uses only Node.js's own modules, so the publish and tag jobs install nothing.
 *
 * @example
 * npm run release -- source <version> <commit> - checks that the commit is on main and that scripts/config.ts holds the version there.
 * npm run release -- check <folder> <version> <commit> - checks that the folder holds exactly the published packages' archives at the version, built from the commit.
 * npm run release -- publish <folder> <version> <commit> - publishes the archives that the registry doesn't hold yet, then waits until the registry serves each one.
 * npm run release -- tag <version> <commit> - tags the commit with the version through GitHub's API.
 */

import { setTimeout as delayAsync } from "node:timers/promises";

import { type IReleaseHost, type ProcessResult, ReleaseService } from "../src/noldova.context.tooling/src/api/index.ts";
import Config from "./config.ts";
import Script from "./script.ts";

export class Release extends Script implements IReleaseHost {
  private static readonly GIT_COMMAND: string = "git";

  public readonly environment: Readonly<Record<string, string | undefined>> = process.env;

  public override async runAsync(): Promise<void> {
    await new ReleaseService(this, Config.PACKAGES_INFO).runAsync(process.argv.slice(2));
  }

  public async readGitAsync(arguments_: readonly string[]): Promise<ProcessResult> {
    return await this.readProcessAsync(Release.GIT_COMMAND, arguments_, process.cwd());
  }

  public async readNPMAsync(arguments_: readonly string[]): Promise<ProcessResult> {
    return await this.readNPMCommandAsync(arguments_, process.cwd());
  }

  public async runNPMAsync(arguments_: readonly string[]): Promise<void> {
    await this.executeNPMCommandAsync(arguments_, process.cwd(), true);
  }

  public async requestAsync(address: string, init: RequestInit): Promise<Response> {
    return await fetch(address, init);
  }

  public override async writeLogAsync(message: string): Promise<void> {
    await super.writeLogAsync(message);
  }

  public now(): number {
    return Date.now();
  }

  public async delayAsync(milliseconds: number): Promise<void> {
    await delayAsync(milliseconds);
  }
}

const release = new Release();
await release.runAsEntryPointAsync();
