/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CommandFailedException, GitHubAPI } from "@noldova/context.tooling";

import { ReleaseHostFixture } from "../fixtures/release-host.fixture.js";

@TestClass
export class GitHubAPITests {
  @TestMethod
  public async sendsTheAPIHeadersWithoutABodyAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    const expected = new Response("{}", { status: 200 });
    host.responses.push(expected);

    const response = await new GitHubAPI(host, "https://api.example.test", "fixture-token").requestAsync("GET", "repos/owner/name/git/ref/tags/v0.0.3");

    Assert.areEqual(expected, response);
    Assert.areEqual(1, host.requests.length);
    Assert.areEqual("https://api.example.test/repos/owner/name/git/ref/tags/v0.0.3", host.requests[0]!.address);
    Assert.areEqual("GET", host.requests[0]!.init.method);
    Assert.areEqual(JSON.stringify({ "Accept": "application/vnd.github+json", "Authorization": "Bearer fixture-token", "X-GitHub-Api-Version": "2022-11-28" }), JSON.stringify(host.requests[0]!.init.headers));
    Assert.isFalse(Object.hasOwn(host.requests[0]!.init, "body"));
  }

  @TestMethod
  public async sendsTheBodyAsJsonAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    host.responses.push(new Response("{}", { status: 201 }));

    await new GitHubAPI(host, "https://api.example.test", "fixture-token").requestAsync("POST", "repos/owner/name/git/refs", { ref: "refs/tags/v0.0.3", sha: "abc" });

    Assert.areEqual("POST", host.requests[0]!.init.method);
    Assert.areEqual("{\"ref\":\"refs/tags/v0.0.3\",\"sha\":\"abc\"}", host.requests[0]!.init.body);
  }

  @TestMethod
  public async reportsAnUnreachableAPIWithTheCauseAsync(): Promise<void> {
    const host = new ReleaseHostFixture();
    const cause = new TypeError("fetch failed");
    host.responses.push(cause);

    const exception = await Assert.throwsAsync(async () => await new GitHubAPI(host, "https://api.example.test", "fixture-token").requestAsync("GET", "rate_limit"), CommandFailedException);

    Assert.areEqual("GitHub could not be reached at https://api.example.test.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
