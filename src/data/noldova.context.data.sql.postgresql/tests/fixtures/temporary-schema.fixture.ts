/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { randomUUID } from "node:crypto";

import { DataSource } from "@noldova/context.data";

import { RealClient } from "./real-client.fixture.js";
import { Released } from "./released.fixture.js";

export class TemporarySchema implements AsyncDisposable {
  public readonly name: string;
  public readonly location: string;

  private constructor(name: string) {
    this.name = name;
    this.location = `${RealClient.location()}?search_path=${name}`;
  }

  public static async createAsync(): Promise<TemporarySchema> {
    const schema = new TemporarySchema(`context_${randomUUID().replaceAll("-", "")}`);
    await TemporarySchema.runAsync(`CREATE SCHEMA "${schema.name}"`);
    return schema;
  }

  public dataSource(name: string = "app"): DataSource {
    return new DataSource(name, this.location);
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await TemporarySchema.runAsync(`DROP SCHEMA "${this.name}" CASCADE`);
    if (!await Released.socketsAsync())
      throw new Error("The test's connections left their sockets open.");
  }

  private static async runAsync(text: string): Promise<void> {
    const client = RealClient.create({ onnotice: false });
    try {
      await client.runUnsafe(text);
    }
    finally {
      await client.endAsync();
    }
  }
}
