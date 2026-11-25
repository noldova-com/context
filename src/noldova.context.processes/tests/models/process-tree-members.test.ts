/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { ProcessIdentity } from "@noldova/context.processes";
import { ProcessEntry } from "@noldova/context.processes/models/process-entry.js";
import { ProcessTreeMembers } from "@noldova/context.processes/models/process-tree-members.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessTreeMembersTests {
  @TestMethod
  public collectsEveryProcessStartedUnderAMember(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));

    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 100 1 S 20", "300 200 1 S 30", "400 1 1 S 40"));

    Assert.areEqual("100/10 200/20 300/30", ProcessTreeMembersTests.describe(members));
  }

  @TestMethod
  public collectsEveryProcessInTheRootsGroup(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));

    members.collect(ProcessTreeMembersTests.entries("100 1 100 S 10", "200 1 100 S 20"));

    Assert.areEqual("100/10 200/20", ProcessTreeMembersTests.describe(members));
  }

  @TestMethod
  public leavesOutAProcessStartedBeforeTheMemberWithItsParentsId(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));

    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 100 1 S 5"));

    Assert.areEqual("100/10", ProcessTreeMembersTests.describe(members));
  }

  @TestMethod
  public leavesOutAChildOfANewerProcessHoldingAGoneMembersId(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));
    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 100 1 S 20"));

    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 1 1 S 40", "300 200 1 S 50"));

    Assert.areEqual("100/10 200/20", ProcessTreeMembersTests.describe(members));
  }

  @TestMethod
  public keepsAChildStartedBeforeAGoneMembersIdWasTakenAgain(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));
    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 100 1 S 20"));

    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "300 200 1 S 30", "200 1 1 S 40"));

    Assert.areEqual("100/10 200/20 300/30", ProcessTreeMembersTests.describe(members));
  }

  @TestMethod
  public tellsAMemberFromALaterProcessHoldingItsId(): void {
    const members = new ProcessTreeMembers(new ProcessIdentity(100, 10));
    members.collect(ProcessTreeMembersTests.entries("100 1 1 S 10", "200 100 1 S 20"));

    Assert.isTrue(members.has(ProcessEntry.parse("200 100 1 S 20")));
    Assert.isFalse(members.has(ProcessEntry.parse("200 1 1 S 40")));
  }

  private static entries(...lines: readonly string[]): IReadOnlyList<ProcessEntry> {
    return new List(lines.map(t => ProcessEntry.parse(t)));
  }

  private static describe(members: ProcessTreeMembers): string {
    return members.identities.select(t => `${t.processId}/${t.startTime}`).toArray().join(" ");
  }
}
