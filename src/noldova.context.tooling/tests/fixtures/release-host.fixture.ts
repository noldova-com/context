/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReleaseHost, ProcessResult } from "@noldova/context.tooling";

export class ReleaseHostFixture implements IReleaseHost {
  public static readonly COMMIT: string = "0123456789abcdef0123456789abcdef01234567";
  public static readonly OTHER_COMMIT: string = "89abcdef0123456789abcdef0123456789abcdef";
  public static readonly VERSION: string = "0.0.4";
  public static readonly REGISTRY_URL: string = "https://registry.example.test/";
  public static readonly API_URL: string = "https://api.example.test";
  public static readonly REPOSITORY: string = "owner/name";
  public static readonly TOKEN: string = "fixture-token";
  public static readonly NOT_FOUND: ProcessResult = new ProcessResult(1, "", "npm error code E404\nnpm error 404 Not Found");

  public readonly environment: Record<string, string | undefined> = {
    RELEASE_REGISTRY_URL: ReleaseHostFixture.REGISTRY_URL,
    RELEASE_SCOPE: "@noldova",
    RELEASE_ACCESS: "public",
    GITHUB_API_URL: ReleaseHostFixture.API_URL,
    GITHUB_REPOSITORY: ReleaseHostFixture.REPOSITORY,
    GITHUB_TOKEN: ReleaseHostFixture.TOKEN
  };

  public readonly logs: string[] = [];
  public readonly gitCalls: string[] = [];
  public readonly npmReads: string[] = [];
  public readonly npmRuns: string[] = [];
  public readonly requests: { readonly address: string; readonly init: RequestInit }[] = [];
  public readonly delays: number[] = [];
  public readonly gitResults: Map<string, ProcessResult> = new Map([["rev-parse", new ProcessResult(0, `${ReleaseHostFixture.COMMIT}\n`, "")]]);
  public readonly views: Map<string, (ProcessResult | Error)[]> = new Map();
  public readonly publishFailures: Map<string, Error> = new Map();
  public readonly responses: (Response | Error)[] = [];
  public time: number = 1_000;

  public static answer(value: unknown): ProcessResult {
    return new ProcessResult(0, `${JSON.stringify(value)}\n`, "");
  }

  public view(specifier: string, field: string, ...results: (ProcessResult | Error)[]): void {
    this.views.set(`${specifier} ${field}`, results);
  }

  public async readGitAsync(arguments_: readonly string[]): Promise<ProcessResult> {
    this.gitCalls.push(arguments_.join(" "));
    return this.gitResults.get(arguments_[0] ?? "") ?? new ProcessResult(0, "", "");
  }

  public async readNPMAsync(arguments_: readonly string[]): Promise<ProcessResult> {
    this.npmReads.push(arguments_.join(" "));
    const results = this.views.get(`${arguments_[1]} ${arguments_[2]}`);
    const result = results === undefined ? ReleaseHostFixture.NOT_FOUND : results.length > 1 ? results.shift()! : results[0]!;
    if (result instanceof Error)
      throw result;

    return result;
  }

  public async runNPMAsync(arguments_: readonly string[]): Promise<void> {
    this.npmRuns.push(arguments_.join(" "));
    const failure = [...this.publishFailures].find(([archiveName]) => arguments_.some(t => t.endsWith(archiveName)));
    if (failure !== undefined)
      throw failure[1];
  }

  public async requestAsync(address: string, init: RequestInit): Promise<Response> {
    this.requests.push({ address, init });
    const response = this.responses.shift();
    if (response === undefined || response instanceof Error)
      throw response ?? new Error("No response is scripted.");

    return response;
  }

  public async writeLogAsync(message: string): Promise<void> {
    this.logs.push(message);
  }

  public now(): number {
    return this.time;
  }

  public async delayAsync(milliseconds: number): Promise<void> {
    this.delays.push(milliseconds);
    this.time += milliseconds;
  }
}
