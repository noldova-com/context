/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandCollisionException, CommandHostException, CommandUnknownException, ProjectFileException, ProviderException } from "@noldova/context";
import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CommandHostExceptionTests {
  @TestMethod
  public keepsTheMessageAndTheCause(): void {
    const cause = new Error("cause");

    const exception = new CommandHostException("ctx failed.", new ExceptionOptions(cause));

    Assert.isInstanceOf(exception, Exception);
    Assert.areEqual("CommandHostException", exception.name);
    Assert.areEqual("ctx failed.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }

  @TestMethod
  public namesTheProjectFile(): void {
    const exception = new ProjectFileException("/app/app.ctxp", "Invalid.");

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.areEqual("/app/app.ctxp", exception.path);
    Assert.areEqual("Invalid.", exception.message);
  }

  @TestMethod
  public namesTheProvider(): void {
    const exception = new ProviderException("noldova.context.sdk", "Missing.");

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.areEqual("noldova.context.sdk", exception.identity);
  }

  @TestMethod
  public namesTheCommandAndBothProviders(): void {
    const exception = new CommandCollisionException("build", "noldova.context.sdk", "noldova.context.lint");

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.areEqual("build", exception.commandName);
    Assert.areEqual("noldova.context.sdk", exception.firstProvider);
    Assert.areEqual("noldova.context.lint", exception.secondProvider);
    Assert.areEqual("The command \"build\" is offered by both \"noldova.context.sdk\" and \"noldova.context.lint\".", exception.message);
  }

  @TestMethod
  public namesTheUnknownCommand(): void {
    const exception = new CommandUnknownException("publish");

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.areEqual("publish", exception.commandName);
  }
}
