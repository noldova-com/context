/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { DataException } from "@noldova/context.data";
import { Backend } from "@noldova/context.data.sql.postgresql/services/protocol/backend.js";
import { FrameReader } from "@noldova/context.data.sql.postgresql/services/protocol/frame.reader.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";

@TestClass
export class FrameReaderTests {
  @TestMethod
  public holdsFramesWhilePaused(): void {
    const frames: string[] = [];
    const reader: FrameReader = new FrameReader(type => {
      frames.push(String.fromCharCode(type));
      if (frames.length === 1)
        reader.pause();
    }, () => undefined);

    reader.push(Buffer.concat([M.parseComplete(), M.bindComplete()]));
    reader.push(M.noData());
    Assert.areEqual("1", frames.join(","));
    Assert.isTrue(reader.isPaused);
    reader.resume();

    Assert.areEqual("1,2,n", frames.join(","));
    Assert.isFalse(reader.isPaused);
  }

  @TestMethod
  public ownsEveryFrameWhenNotShared(): void {
    const owned: boolean[] = [];
    const reader: FrameReader = new FrameReader((_type, data) => owned.push(reader.isOwning(data)), () => undefined);

    reader.push(M.parseComplete());

    Assert.areEqual("true", owned.join(","));
  }

  @TestMethod
  public copiesASharedBufferItKeeps(): void {
    const owned: boolean[] = [];
    const reader: FrameReader = new FrameReader((_type, data) => {
      owned.push(reader.isOwning(data));
      if (owned.length === 1)
        reader.pause();
    }, () => undefined, true);
    const shared = Buffer.concat([M.parseComplete(), M.bindComplete()]);

    reader.push(shared);
    shared.fill(0);
    reader.push(M.noData());
    reader.resume();

    Assert.areEqual("false,true,true", owned.join(","));
  }

  @TestMethod
  public copiesEveryChunkWhileOwning(): void {
    const frames: string[] = [];
    const owned: boolean[] = [];
    const reader: FrameReader = new FrameReader((type, data) => {
      frames.push(String.fromCharCode(type));
      owned.push(reader.isOwning(data));
    }, () => undefined, true);
    const stream = Buffer.concat([M.parseComplete(), M.bindComplete()]);

    reader.setOwning(true);
    reader.push(stream.subarray(0, 7));
    reader.setOwning(false);
    reader.push(stream.subarray(7));
    reader.push(M.noData());

    Assert.areEqual("1,2,n", frames.join(","));
    Assert.areEqual("true,true,false", owned.join(","));
  }

  @TestMethod
  public queuesAChunkPushedWhileAFrameIsHandled(): void {
    const frames: string[] = [];
    const reader: FrameReader = new FrameReader(type => {
      frames.push(String.fromCharCode(type));
      if (frames.length === 1)
        reader.push(M.noData());
    }, () => undefined);

    reader.push(Buffer.concat([M.parseComplete(), M.bindComplete()]));

    Assert.areEqual("1,2,n", frames.join(","));
  }

  @TestMethod
  public copiesQueuedSharedChunksWhenItPauses(): void {
    const frames: string[] = [];
    const owned: boolean[] = [];
    const queued = M.commandComplete("SELECT 1");
    const reader: FrameReader = new FrameReader((type, data, start, end) => {
      frames.push(type === 67 ? Backend.readCommandComplete(data, start, end).command : String.fromCharCode(type));
      owned.push(reader.isOwning(data));
      if (frames.length === 1) {
        reader.push(queued);
        reader.pause();
      }
    }, () => undefined, true);

    reader.push(M.parseComplete());
    reader.push(M.noData());
    reader.pause();
    queued.fill(0);
    reader.resume();

    Assert.areEqual("1,SELECT,n", frames.join(","));
    Assert.areEqual("false,true,true", owned.join(","));
  }

  @TestMethod
  public waitsForTheRestOfAFrameWhoseHeaderArrived(): void {
    const tags: string[] = [];
    const reader = new FrameReader((_type, data, start, end) => tags.push(Backend.readCommandComplete(data, start, end).command), () => undefined);
    const message = M.commandComplete("INSERT 0 3");

    reader.push(message.subarray(0, 8));
    Assert.areEqual(0, tags.length);
    reader.push(message.subarray(8));

    Assert.areEqual("INSERT", tags.join(","));
  }

  @TestMethod
  public stopsAtAnInvalidLengthSplitAcrossChunks(): void {
    const frames: number[] = [];
    const errors: Error[] = [];
    const reader = new FrameReader(type => frames.push(type), error => errors.push(error));

    reader.push(Buffer.from([0x31, 0, 0]));
    reader.push(Buffer.from([0, 2]));
    reader.push(M.parseComplete());

    Assert.areEqual(0, frames.length);
    Assert.areEqual(1, errors.length);
    Assert.isInstanceOf(errors[0], DataException);
  }
}
