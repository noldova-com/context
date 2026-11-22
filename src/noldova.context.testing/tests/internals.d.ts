/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.testing/enums/test-worker-message-kind.js" {
  export enum TestWorkerMessageKind {
    Imported = "Imported",
    Ready = "Ready",
    Started = "Started",
    MethodCompleted = "MethodCompleted",
    TimedOut = "TimedOut",
    ClassCompleted = "ClassCompleted"
  }
}

declare module "@noldova/context.testing/enums/test-worker-value-kind.js" {
  export enum TestWorkerValueKind {
    Value = "Value",
    Text = "Text",
    Error = "Error",
    Assert = "Assert",
    Timeout = "Timeout"
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-record.js" {
  export class TestWorkerRecord {
    public static from(value: unknown): TestWorkerRecord;
    public string(name: string): string;
    public optionalString(name: string): string | undefined;
    public boolean(name: string): boolean;
    public count(name: string): number;
    public optionalCount(name: string): number | undefined;
    public duration(name: string): number;
    public strings(name: string): string[];
    public records(name: string): TestWorkerRecord[];
    public value(name: string): unknown;
    public values(name: string): readonly unknown[];
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-text.js" {
  export class TestWorkerText {
    public readonly text: string;
    public constructor(text: string);
    public toString(): string;
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-value.js" {
  import type { TestWorkerValueKind } from "@noldova/context.testing/enums/test-worker-value-kind.js";

  export class TestWorkerValue {
    public readonly kind: TestWorkerValueKind;
    public readonly value: unknown;
    public readonly name: string;
    public readonly message: string;
    public readonly stack: string | undefined;
    public readonly timeoutMilliseconds: number;
    public readonly details: readonly TestWorkerValue[];
    public static of(value: unknown): TestWorkerValue;
    public static from(value: unknown): TestWorkerValue;
    public toData(): object;
    public toValue(): unknown;
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-result.js" {
  import type { TestMethodResult } from "@noldova/context.testing";

  export class TestWorkerResult {
    public readonly methodResult: TestMethodResult;
    public constructor(methodResult: TestMethodResult);
    public static from(value: unknown): TestWorkerResult;
    public toData(): object;
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-start.js" {
  import type { TestProject } from "@noldova/context.testing";

  export class TestWorkerStart {
    public readonly testProjects: readonly TestProject[];
    public readonly filters: readonly string[];
    public readonly timeoutMilliseconds: number;
    public constructor(testProjects: readonly TestProject[], filters: readonly string[], timeoutMilliseconds: number);
    public static from(value: unknown): TestWorkerStart;
    public toData(): object;
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-run.js" {
  export class TestWorkerRun {
    public readonly classIndex: number;
    public readonly startMethodIndex: number;
    public readonly isStartMethodStopped: boolean;
    public constructor(classIndex: number, startMethodIndex: number, isStartMethodStopped: boolean);
    public static from(value: unknown): TestWorkerRun;
    public toData(): object;
  }
}

declare module "@noldova/context.testing/models/execution/test-timeout-limit.js" {
  export class TestTimeoutLimit {
    public static isValid(timeoutMilliseconds: unknown): timeoutMilliseconds is number;
    public static throwIfInvalid(timeoutMilliseconds: number): void;
  }
}

declare module "@noldova/context.testing/models/execution/test-worker-message.js" {
  import type { TestWorkerMessageKind } from "@noldova/context.testing/enums/test-worker-message-kind.js";
  import type { TestWorkerResult } from "@noldova/context.testing/models/execution/test-worker-result.js";

  export class TestWorkerMessage {
    public readonly kind: TestWorkerMessageKind;
    public readonly classIndex: number;
    public readonly methodIndex: number;
    public readonly filePath: string;
    public readonly result: TestWorkerResult | undefined;
    public readonly classCount: number;
    public readonly methodCount: number;
    public readonly discoveredCount: number;
    public readonly timeoutMilliseconds: number;
    public static imported(filePath: string): TestWorkerMessage;
    public static ready(classCount: number, methodCount: number, discoveredCount: number): TestWorkerMessage;
    public static started(classIndex: number, methodIndex: number, timeoutMilliseconds: number): TestWorkerMessage;
    public static methodCompleted(classIndex: number, methodIndex: number, result: TestWorkerResult): TestWorkerMessage;
    public static timedOut(classIndex: number, methodIndex: number, filePath: string): TestWorkerMessage;
    public static classCompleted(classIndex: number, filePath: string): TestWorkerMessage;
    public static from(value: unknown): TestWorkerMessage;
    public toData(): object;
  }
}

declare module "@noldova/context.testing/services/execution/test-run-worker.js" {
  import type { MessagePort } from "node:worker_threads";

  import type {
    DiscoveredTestClass,
    DiscoveredTestMethod,
    IClock,
    ITestProgressListener,
    TestClassResult,
    TestMethodResult
  } from "@noldova/context.testing";
  import type { TestWorkerRun } from "@noldova/context.testing/models/execution/test-worker-run.js";
  import type { TestWorkerStart } from "@noldova/context.testing/models/execution/test-worker-start.js";

  export class TestRunWorker implements ITestProgressListener {
    public static forParentPort(port: MessagePort | null, start: TestWorkerStart): TestRunWorker;
    public constructor(port: MessagePort, start: TestWorkerStart, clock?: IClock);
    public startAsync(): Promise<void>;
    public runAsync(run: TestWorkerRun): Promise<void>;
    public onMethodStarted(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): void;
    public onMethodCompleted(methodResult: TestMethodResult): void;
    public onClassCompleted(classResult: TestClassResult): void;
  }
}

declare module "@noldova/context.testing/services/timing/system-clock.js" {
  import type { IClock } from "@noldova/context.testing";

  export class SystemClock implements IClock {
    public constructor(keepsProcessAlive?: boolean);
    public now(): number;
    public setTimeout(callback: () => void, delayMilliseconds: number): number;
    public clearTimeout(timer: number | undefined): void;
  }
}

declare module "@noldova/context.testing/services/execution/test-run-supervisor.js" {
  import type { Worker, WorkerOptions } from "node:worker_threads";

  import type { IClock, ITestProgressListener, TestProject, TestRunResult, TestSelection } from "@noldova/context.testing";

  export class TestRunSupervisor {
    public get selection(): TestSelection;
    public get elapsedMilliseconds(): number;
    public get unendedWorkersMessage(): string | undefined;
    public constructor(timeoutMilliseconds: number, testProjects: readonly TestProject[], filters: readonly string[],
      progressListener: ITestProgressListener | undefined, coverageDirectory: string | null, workerUrl?: URL, workerCount?: number,
      startLimitMilliseconds?: number, createWorker?: (url: URL, options: WorkerOptions) => Worker, clock?: IClock,
      stopLimitMilliseconds?: number);
    public static readCoverageDirectory(): string | null;
    public static readTimeoutMilliseconds(text: string | undefined): number;
    public static readStopLimitMilliseconds(text: string | undefined): number;
    public static defaultWorkerCount(): number;
    public static throwIfLimitsInvalid(timeoutMilliseconds: number, workerCount: number): void;
    public runAsync(): Promise<TestRunResult>;
    public waitForUnendedWorkersAsync(): Promise<boolean>;
    public whenWorkerLeftBehind(callback: () => void): void;
  }
}

declare module "@noldova/context.testing/services/execution/process-tree.js" {
  import type { IClock } from "@noldova/context.testing";
  import type { ProcessDescendants } from "@noldova/context.testing/models/execution/process-descendants.js";
  import type { ProcessListing } from "@noldova/context.testing/models/execution/process-listing.js";

  export class ProcessTree {
    public constructor(platform: string, listings?: ReadonlyMap<string, ProcessListing>, clock?: IClock);
    public get warming(): Promise<boolean>;
    public static end(processIds: readonly number[]): number;
    public warm(): void;
    public listDescendantsAsync(rootProcessId: number): Promise<ProcessDescendants>;
    public closeAsync(): Promise<void>;
  }
}

declare module "@noldova/context.testing/models/execution/process-descendants.js" {
  export class ProcessDescendants {
    public readonly processIds: readonly number[];
    public readonly isWarm: boolean;
    public readonly milliseconds: number;
    public readonly listedCount: number;
    public readonly isRootListed: boolean;
    public readonly brokenChains: readonly string[] | undefined;
    public constructor(processIds: readonly number[], isWarm: boolean, milliseconds: number, listedCount: number, isRootListed: boolean,
      brokenChains: readonly string[] | undefined);
    public describe(): string;
  }
}

declare module "@noldova/context.testing/models/execution/process-row.js" {
  export class ProcessRow {
    public readonly processId: number;
    public readonly parentId: number;
    public readonly created: string | undefined;
    public constructor(processId: number, parentId: number, created: string | undefined);
    public static parse(line: string): ProcessRow | undefined;
  }
}

declare module "@noldova/context.testing/models/execution/process-listing.js" {
  export class ProcessListing {
    public readonly file: string;
    public readonly arguments: readonly string[];
    public readonly warmFile: string;
    public readonly warmArguments: readonly string[];
    public readonly script: string | undefined;
    public constructor(file: string, arguments_: readonly string[], warmFile: string, warmArguments: readonly string[], script?: string);
  }
}

declare module "@noldova/context.testing/models/coverage/coverage-range.js" {
  export class CoverageRange {
    public readonly startOffset: number;
    public readonly endOffset: number;
    public readonly count: number;
    public constructor(startOffset: number, endOffset: number, count: number);
  }
}

declare module "@noldova/context.testing/models/coverage/function-coverage.js" {
  import type { CoverageRange } from "@noldova/context.testing/models/coverage/coverage-range.js";

  export class FunctionCoverage {
    public readonly ranges: readonly CoverageRange[];
    public constructor(ranges: readonly CoverageRange[]);
  }
}

declare module "@noldova/context.testing/services/coverage/file-coverage-analyzer.js" {
  import type { CoverageProject } from "@noldova/context.testing";
  import type { FunctionCoverage } from "@noldova/context.testing/models/coverage/function-coverage.js";

  export class FileCoverageAnalyzer {
    public constructor(project: CoverageProject);
    public analyzeAsync(filePath: string, scriptEntries: readonly (readonly FunctionCoverage[])[]): Promise<unknown>;
  }
}
