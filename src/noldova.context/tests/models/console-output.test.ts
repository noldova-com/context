/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { ConsoleOutput } from "@noldova/context";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ConsoleOutputTests {
  @TestMethod
  public writesLinesToStandardOutput(): void {
    const write = process.stdout.write;
    const written: string[] = [];
    process.stdout.write = (chunk: string | Uint8Array): boolean => written.push(String(chunk)) > 0;
    try {
      new ConsoleOutput().writeLine("built");
    }
    finally {
      process.stdout.write = write;
    }

    Assert.areEqual("built\n", written.join(""));
  }

  @TestMethod
  public writesErrorLinesToStandardError(): void {
    const write = process.stderr.write;
    const written: string[] = [];
    process.stderr.write = (chunk: string | Uint8Array): boolean => written.push(String(chunk)) > 0;
    try {
      new ConsoleOutput().writeErrorLine("failed");
    }
    finally {
      process.stderr.write = write;
    }

    Assert.areEqual("failed\n", written.join(""));
  }
}
