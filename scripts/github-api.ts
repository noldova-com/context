/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";

export default class GitHubAPI {
  private static readonly MEDIA_TYPE: string = "application/vnd.github+json";
  private static readonly API_VERSION: string = "2022-11-28";

  private readonly address: string;
  private readonly token: string;

  public constructor(address: string, token: string) {
    this.address = address;
    this.token = token;
  }

  public async requestAsync(method: string, resource: string, body?: Readonly<Record<string, string>>): Promise<Response> {
    try {
      return await fetch(`${this.address}/${resource}`, {
        method,
        headers: { "Accept": GitHubAPI.MEDIA_TYPE, "Authorization": `Bearer ${this.token}`, "X-GitHub-Api-Version": GitHubAPI.API_VERSION },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
    }
    catch (error) {
      throw new CommandFailedException(GitHubAPI.unreachable(this.address), { cause: error });
    }
  }

  private static unreachable(address: string): string {
    return `GitHub could not be reached at ${address}.`;
  }
}
