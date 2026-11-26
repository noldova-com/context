/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { AsyncLocalStorage } from "node:async_hooks";

import { Dictionary, type IReadOnlyDictionary } from "@noldova/context.collections";
import { ArgumentException, InvalidOperationException } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";

export class TestContext {
  private static readonly STORAGE: AsyncLocalStorage<TestContext> = new AsyncLocalStorage<TestContext>();
  private readonly attachmentsByName: Dictionary<string, string> = new Dictionary<string, string>();
  private isEnded: boolean = false;

  public static get current(): TestContext {
    const context = TestContext.STORAGE.getStore();
    if (Object.isUndefined(context))
      throw new TestingException(Resources.noTestRunning);

    return context;
  }

  public get attachments(): IReadOnlyDictionary<string, string> {
    return this.attachmentsByName.asReadOnly();
  }

  public static async runAsync(context: TestContext, action: () => Promise<void>): Promise<void> {
    await TestContext.STORAGE.run(context, action);
  }

  public addAttachment(name: string, value: string): void {
    ArgumentException.throwIfNullOrWhitespace(name, Resources.attachmentNameParameter);
    if (this.isEnded)
      throw new InvalidOperationException(Resources.testEnded);
    if (!this.attachmentsByName.tryAdd(name, value))
      throw new ArgumentException(Resources.attachmentDuplicated(name), Resources.attachmentNameParameter);
  }

  public end(): void {
    this.isEnded = true;
  }
}
