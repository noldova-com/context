/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandFailedException } from "../exceptions/command-failed.exception.ts";
import type { IReleaseHost } from "../interfaces/i-release-host.ts";
import { Resources } from "../resources.ts";

export class GitHubAPI {
  private static readonly MEDIA_TYPE: string = "application/vnd.github+json";
  private static readonly API_VERSION: string = "2022-11-28";

  private readonly host: IReleaseHost;
  private readonly address: string;
  private readonly token: string;

  public constructor(host: IReleaseHost, address: string, token: string) {
    this.host = host;
    this.address = address;
    this.token = token;
  }

  public async requestAsync(method: string, resource: string, body?: Readonly<Record<string, string>>): Promise<Response> {
    try {
      return await this.host.requestAsync(`${this.address}/${resource}`, {
        method,
        headers: { "Accept": GitHubAPI.MEDIA_TYPE, "Authorization": `Bearer ${this.token}`, "X-GitHub-Api-Version": GitHubAPI.API_VERSION },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
    }
    catch (error) {
      throw new CommandFailedException(Resources.formatGitHubUnreachable(this.address), { cause: error });
    }
  }
}
