/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdtemp, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ProcessesException, ProcessIdentity, ProcessTree, ProcessTreeEndException, ProcessTreeEndOptions } from "@noldova/context.processes";
import { ProcessLister } from "@noldova/context.processes/services/process-lister.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { StartedTree } from "../fixtures/started-tree.fixture.js";
import { TreeShape } from "../fixtures/tree-shape.fixture.js";

@TestClass
export class ProcessTreeTests {
  private static readonly FOLDER_PREFIX: string = "noldova-process-tree-";
  private static readonly LISTING_LIMIT_MILLISECONDS: number = 10_000;
  private static readonly PLATFORM_PROPERTY: string = "platform";
  private static readonly UNSUPPORTED_PLATFORM: string = "aix";
  private static readonly WINDOWS_PLATFORM: string = "win32";

  @TestMethod
  public async endsARootWithAChildAndAGrandchildAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.of(TreeShape.of())));

    const ended = await ProcessTree.endAsync(tree.identity);

    ProcessTreeTests.assertEndedEach(tree.processIds, ended);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsAGrandchildThatStartedASessionOfItsOwnAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.detachedOf(TreeShape.of())));

    const ended = await ProcessTree.endAsync(tree.identity);

    ProcessTreeTests.assertEndedEach(tree.processIds, ended);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsAnOrphanThroughTheRootsGroupOrWithItsParentOnWindowsAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.exitingOf(TreeShape.of())));
    const isWindows = process.platform === ProcessTreeTests.WINDOWS_PLATFORM;
    await StartedTree.waitUntilGoneAsync(tree.processIds.slice(1, isWindows ? 3 : 2));

    const ended = await ProcessTree.endAsync(tree.identity);

    ProcessTreeTests.assertEndedEach(isWindows ? [tree.identity.processId] : [tree.identity.processId, tree.processIds[2] ?? 0], ended);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async listsInTheRootsGroupOnlyProcessesStartedAfterTheRootAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.exitingOf(TreeShape.of())));
    const isWindows = process.platform === ProcessTreeTests.WINDOWS_PLATFORM;
    await StartedTree.waitUntilGoneAsync(tree.processIds.slice(1, isWindows ? 3 : 2));

    const group = await ProcessLister.useAsync(ProcessTreeTests.LISTING_LIMIT_MILLISECONDS,
      async t => (await t.listAsync()).filter(entry => entry.groupId === tree.identity.processId));

    const expected = isWindows ? [] : [tree.identity.processId, tree.processIds[2] ?? 0];
    Assert.areEqual(expected.length, group.length);
    Assert.isTrue(expected.every(processId => group.some(t => t.processId === processId)));
    Assert.isTrue(group.every(t => t.startTime >= tree.identity.startTime));
    await ProcessTree.endAsync(tree.identity);
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsTheProcessesAChildKeepsStartingAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.forking()));

    const ended = await ProcessTree.endAsync(tree.identity);

    ProcessTreeTests.assertEndedEach(tree.processIds, ended);
    Assert.isTrue(await StartedTree.areGoneAsync(ended.map(t => t.processId)));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async removesAFolderAGrandchildWorkedInAsSoonAsTheEndReturnsAsync(): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), ProcessTreeTests.FOLDER_PREFIX));
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.of(TreeShape.workingIn(folder))));

    await ProcessTree.endAsync(tree.identity);

    await rmdir(folder);
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsNothingWhenTheRootsIdHasAnotherStartTimeAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of());

    const ended = await ProcessTree.endAsync(new ProcessIdentity(tree.identity.processId, tree.identity.startTime + 1000));

    Assert.areEqual(0, ended.length);
    Assert.isDefined(await ProcessIdentity.readAsync(tree.identity.processId));
    await ProcessTree.endAsync(tree.identity);
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsARootThatEndsOnTheGracesRequestAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of());

    const ended = await ProcessTree.endAsync(tree.identity, new ProcessTreeEndOptions(500));

    ProcessTreeTests.assertEndedEach(tree.processIds, ended);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async endsAChildThatIgnoresTheGracesRequestOnceTheGracePassesAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.ignoringTerminate()));

    const ended = await ProcessTree.endAsync(tree.identity, new ProcessTreeEndOptions(200));

    ProcessTreeTests.assertEndedEach(tree.processIds, ended);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async throwsNamingTheSurvivorsWhenTheLimitPassesAsync(): Promise<void> {
    const tree = await StartedTree.startAsync(TreeShape.of(TreeShape.of()));

    const error = await Assert.throwsAsync(() => ProcessTree.endAsync(tree.identity, new ProcessTreeEndOptions(0, 0)), ProcessTreeEndException);

    ProcessTreeTests.assertEndedEach(tree.processIds, error.survivors);
    Assert.isTrue(error.message.startsWith(`The process tree still had ${error.survivors.length} processes when its 0 ms limit passed: `));
    Assert.isTrue(error.message.includes(`${tree.identity.processId} started at ${new Date(tree.identity.startTime).toISOString()}`));
    await ProcessTree.endAsync(tree.identity);
    Assert.isTrue(await StartedTree.areGoneAsync(tree.processIds));
    await tree.waitUntilClosedAsync();
  }

  @TestMethod
  public async throwsOnASystemItCantListProcessesOnAsync(): Promise<void> {
    const platform = Object.getOwnPropertyDescriptor(process, ProcessTreeTests.PLATFORM_PROPERTY);
    Assert.isDefined(platform);
    Object.defineProperty(process, ProcessTreeTests.PLATFORM_PROPERTY, { ...platform, value: ProcessTreeTests.UNSUPPORTED_PLATFORM });
    let ending: Promise<readonly ProcessIdentity[]>;
    try {
      ending = ProcessTree.endAsync(new ProcessIdentity(process.pid, 0));
    }
    finally {
      Object.defineProperty(process, ProcessTreeTests.PLATFORM_PROPERTY, platform);
    }

    const error = await Assert.throwsAsync(() => ending, ProcessesException);

    Assert.areEqual("Processes can't be listed on \"aix\"; Linux, macOS and Windows are supported.", error.message);
  }

  private static assertEndedEach(processIds: readonly number[], ended: readonly ProcessIdentity[]): void {
    for (const processId of processIds)
      Assert.isTrue(ended.some(t => t.processId === processId), String(processId));
  }
}
