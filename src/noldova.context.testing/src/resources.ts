/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TestProject } from "./models/discovery/test-project.js";

export class Resources {
  public static readonly testClassSuffix: string = "Tests";
  public static readonly testFileSuffix: string = ".test.js";
  public static readonly filePathParameter: string = "filePath";
  public static readonly packageNameParameter: string = "packageName";
  public static readonly rootDirectoryParameter: string = "rootDirectory";
  public static readonly coverageDirectoryParameter: string = "coverageDirectory";
  public static readonly projectsParameter: string = "projects";
  public static readonly mapDirectoryParameter: string = "mapDirectory";
  public static readonly generatedLineParameter: string = "generatedLine";
  public static readonly generatedColumnParameter: string = "generatedColumn";
  public static readonly timeoutMillisecondsParameter: string = "timeoutMilliseconds";
  public static readonly workerCountParameter: string = "workerCount";
  public static readonly startLimitMillisecondsParameter: string = "startLimitMilliseconds";
  public static readonly stopLimitMillisecondsParameter: string = "stopLimitMilliseconds";
  public static readonly nameParameter: string = "name";
  public static readonly reasonParameter: string = "reason";
  public static readonly maximumTimeoutMilliseconds: number = 2_147_483_647;
  public static readonly timeoutTooLarge: string = "The Node bootstrap timeout cannot exceed 2147483647 milliseconds.";
  public static readonly testClassMarkInvalid: string = "A test-class mark must be an own data property containing true.";
  public static readonly testMethodMarkInvalid: string = "A test-method mark must be an own data property containing true.";
  public static readonly unprintableValue: string = "<unprintable value>";
  public static readonly unhandledRejectionEvent: "unhandledRejection" = "unhandledRejection";
  public static readonly uncaughtExceptionEvent: "uncaughtException" = "uncaughtException";
  public static readonly messageEvent: string = "message";
  public static readonly errorEvent: string = "error";
  public static readonly exitEvent: string = "exit";
  public static readonly killSignal: "SIGKILL" = "SIGKILL";
  public static readonly testRunWorkerFileName: string = "./test-run-worker-entry-point.js";
  public static readonly testWorkerGraceMilliseconds: number = 250;
  public static readonly testWorkerStartMilliseconds: number = 5_000;
  public static readonly testWorkerEndMilliseconds: number = 5_000;
  public static readonly temporaryDirectoryPrefix: string = "noldova-test-run-";
  public static readonly temporaryDirectoryVariables: readonly string[] = ["TMPDIR", "TEMP", "TMP"];
  public static readonly temporaryRemovalRetries: number = 5;
  public static readonly abandonedProcessesNotEnded: string = "The run could not end the processes still running under it.";
  public static readonly endingOwnProcess: string = "The stopped tests' workers still have not ended, so the run ends its own process so it cannot hang.";
  public static readonly minimumWorkerCount: number = 2;
  public static readonly testWorkerDataInvalid: string = "The test worker exchanged data that is not a test worker message.";
  public static readonly noTestRunning: string = "No test is running here, so there is no test context.";
  public static readonly testEnded: string = "The test already ended, so it takes no more attachments.";
  public static readonly attachmentNameParameter: string = "name";
  public static readonly attachmentValueParameter: string = "value";
  public static readonly attachmentValueInvalid: string = "An attachment's value must be text.";
  public static readonly coverageOffsetBeforeFirstLine: string = "A coverage offset lies before the generated file's first line.";
  public static readonly testWorkerParentPortMissing: string = "The test worker runs only in a worker thread, which has a parent port.";
  public static readonly secondUnit: string = "s";
  public static readonly minuteUnit: string = "min";
  public static readonly hourUnit: string = "h";
  public static readonly valueSeparator: string = ", ";
  public static readonly parentDirectory: string = "..";
  public static readonly categoryMarkDescription: string = "Noldova.Context.Testing.Category";
  public static readonly testClassMarkDescription: string = "Noldova.Context.Testing.TestClass";
  public static readonly testDataMarkDescription: string = "Noldova.Context.Testing.TestData";
  public static readonly testMethodMarkDescription: string = "Noldova.Context.Testing.TestMethod";
  public static readonly skipMarkDescription: string = "Noldova.Context.Testing.Skip";
  public static readonly timeoutMarkDescription: string = "Noldova.Context.Testing.Timeout";
  public static readonly javascriptFileSuffix: string = ".js";
  public static readonly coverageFileSuffix: string = ".json";
  public static readonly fileUrlPrefix: string = "file://";
  public static readonly reportLocation: string = "report";
  public static readonly textEncoding: "utf8" = "utf8";
  public static readonly blockCommentPattern: RegExp = /\/\*[\s\S]*?\*\//gu;
  public static readonly missingFileErrorCode: string = "ENOENT";
  public static readonly sourceMapSuffix: string = ".map";
  public static readonly sourceMapLineSeparator: string = ";";
  public static readonly sourceMapSegmentSeparator: string = ",";
  public static readonly sourceMapVersion: number = 3;
  public static readonly sourceMapShapeInvalid: string = "A source map must contain a numeric version, string mappings, and string-array sources; optional sourceRoot must be a string and names a string array.";
  public static readonly defaultTimeoutMilliseconds: number = 30_000;
  public static readonly filtersVariable: string = "CONTEXT_TEST_FILTERS";
  public static readonly skipTestDetailsVariable: string = "CONTEXT_SKIP_TEST_DETAILS";
  public static readonly timeoutVariable: string = "CONTEXT_TEST_TIMEOUT_MILLISECONDS";
  public static readonly stopLimitVariable: string = "CONTEXT_TEST_STOP_LIMIT_MILLISECONDS";
  public static readonly resultsFileVariable: string = "CONTEXT_TEST_RESULTS_FILE";
  public static readonly timeoutVariablePattern: RegExp = /^[1-9][0-9]*$/u;
  public static readonly emptyParameterListPattern: RegExp = /^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\)/u;
  public static readonly parameterListStart: string = "(";
  public static readonly testTimeFields: readonly string[] = ["packageName", "filePath", "className", "methodName", "testDataIndex", "outcome", "durationMilliseconds", "attachments"];
  public static readonly testTimesInvalid: string = "The test times must be a JSON array of results, each with its package, file, class and method names, an optional non-negative integer data row, an outcome, a non-negative duration, and optional attachments of text.";
  public static readonly budgetMillisecondsParameter: string = "budgetMilliseconds";
  public static readonly budgetInvalid: string = "The time budget must be a positive finite number of milliseconds.";
  public static readonly marginParameter: string = "margin";
  public static readonly marginInvalid: string = "The margin must be a non-negative finite fraction.";
  public static readonly slowerFilesHeading: string = "Test files slower than the timing check's budget:";
  public static readonly slowerFileRowPattern: RegExp = /^\| `([^`]+)` \| ([0-9]+) ms \|/u;
  public static readonly tableRowPrefix: string = "|";
  public static readonly lineEndPattern: RegExp = /\r?\n/u;
  public static readonly slowestTestsHeading: string = "Slowest tests:";
  public static readonly notRun: string = "not run";
  public static readonly coverageVariable: string = "NODE_V8_COVERAGE";
  public static readonly coverageProfilePattern: RegExp = /^coverage-(\d+)-\d+-(\d+)\.json$/u;
  public static readonly threadListPattern: RegExp = /^threads-(\d+)-[0-9a-f-]+\.txt$/u;
  public static readonly lineSeparator: string = "\n";
  public static readonly greenThreshold: number = 90;
  public static readonly yellowThreshold: number = 60;
  public static readonly terminalRed: string = "\u001b[31m";
  public static readonly terminalGreen: string = "\u001b[32m";
  public static readonly terminalYellow: string = "\u001b[33m";
  public static readonly terminalReset: string = "\u001b[0m";
  public static readonly terminalClearLine: string = "\r\u001b[2K";
  public static readonly progressText: string = "Running tests";
  public static readonly progressDot: string = ".";
  public static readonly progressMaximumDots: number = 3;
  public static readonly progressIntervalMilliseconds: number = 300;
  public static readonly centisecondsPerSecond: number = 100;
  public static readonly durationDecimalPlaces: number = 2;
  public static readonly millisecondsPerCentisecond: number = 10;
  public static readonly millisecondsPerSecond: number = 1_000;
  public static readonly minutesPerHour: number = 60;
  public static readonly secondsPerMinute: number = 60;
  public static readonly assertionFailed: string = "Assertion failed.";
  public static readonly expectedTrue: string = "Expected the condition to be true.";
  public static readonly expectedFalse: string = "Expected the condition to be false.";
  public static readonly expectedEqual: string = "Expected the values to be equal.";
  public static readonly expectedNotEqual: string = "Expected the values to be different.";
  public static readonly expectedNull: string = "Expected the value to be null.";
  public static readonly expectedNotNull: string = "Expected the value not to be null.";
  public static readonly expectedUndefined: string = "Expected the value to be undefined.";
  public static readonly expectedDefined: string = "Expected the value to be defined.";
  public static readonly expectedInstanceOf: string = "Expected the value to be an instance of the specified type.";
  public static readonly expectedThrow: string = "Expected the action to throw.";
  public static readonly expectedThrowType: string = "Expected the action to throw the specified exception type.";
  public static readonly expectedNoThrow: string = "Expected the action not to throw.";
  public static readonly durationInvalid: string = "The duration must be a non-negative finite number of milliseconds.";
  public static readonly testCountInvalid: string = "The test count must be a non-negative integer.";
  public static readonly selectedCountInvalid: string = "The selected count cannot exceed the discovered count.";
  public static readonly noTestMatchedFilters: string = "No test matched the filters; a filter that selects nothing fails the run.";
  public static readonly methodResultIdentityInvalid: string = "Every method result must belong to this package and class.";
  public static readonly lineInvalid: string = "The line must be a positive integer.";
  public static readonly startLineInvalid: string = "The start line must be a positive integer.";
  public static readonly endLineInvalid: string = "The end line must be an integer no smaller than the start line.";
  public static readonly totalLengthInvalid: string = "The total length must be a non-negative integer.";
  public static readonly uncoveredLengthInvalid: string = "The uncovered length must be a non-negative integer no larger than the total length.";
  public static readonly uncoveredRangesInvalid: string = "The uncovered line ranges and the uncovered length must agree: both empty or both present.";
  public static readonly nonExecutableBlocksInvalid: string = "A non-executable file cannot contain coverage blocks.";
  public static readonly timeoutInvalid: string = "The timeout must be a positive integer of milliseconds.";
  public static readonly workerCountInvalid: string = "The worker count must be a positive integer.";
  public static readonly startLimitInvalid: string = "The start limit must be a positive integer of milliseconds.";
  public static readonly stopLimitInvalid: string = "The stop limit must be a positive integer of milliseconds.";
  public static readonly testProjectPairRequired: string = "Each test project requires a package name and a root directory.";
  public static readonly testFiltersInvalid: string = "The test filters must be a JSON array of strings.";
  public static readonly categoryFilterPrefix: string = "category:";
  public static readonly categoryMarkInvalid: string = "A category mark must carry a non-empty collection of non-whitespace string names.";
  public static readonly skipReasonInvalid: string = "A skip mark must carry a non-whitespace string reason.";
  public static readonly timeoutMarkInvalid: string = "A timeout mark must carry a positive integer of milliseconds within the timer limit.";
  public static readonly testDataMarkInvalid: string = "A test-data mark must carry a non-empty collection of test-data entries.";
  public static readonly testDataIdentityInvalid: string = "Test data and its index must either both be present or both be absent.";
  public static readonly testDataIndexInvalid: string = "The test-data index must be a non-negative integer.";
  public static readonly coverageUniverseEmpty: string = "The coverage projects contain no production JavaScript files; the coverage universe is empty.";
  public static readonly generatedLineInvalid: string = "The generated line must be a positive integer.";
  public static readonly generatedColumnInvalid: string = "The generated column must be a non-negative integer.";
  public static readonly sourceMapSegmentFieldCountInvalid: string = "A source map segment must contain one, four, or five fields.";
  public static readonly sourceMapGeneratedColumnInvalid: string = "A source map generated column cannot be negative.";
  public static readonly sourceMapGeneratedColumnOrderInvalid: string = "Source map segments must be ordered by generated column.";
  public static readonly sourceMapOriginalPositionInvalid: string = "A source map segment refers to an invalid original position.";
  public static readonly sourceMapNameIndexInvalid: string = "A source map segment refers to an invalid name index.";
  public static readonly sourceMapIntegerUnsupported: string = "A source map mapping value exceeds the supported integer range.";
  public static readonly sourceMapMappingTruncated: string = "A source map contains a truncated mapping value.";
  public static readonly coverageFileHeading: string = "File";
  public static readonly coverageHeading: string = "Coverage";
  public static readonly coverageBlockSeparator: string = "/";
  public static readonly blocksHeading: string = "Blocks";
  public static readonly coverageNotApplicable: string = "-";
  public static readonly coveragePercentSuffix: string = "%";
  public static readonly directorySeparator: string = "/";
  public static readonly windowsDirectorySeparator: string = "\\";
  public static readonly emptyExport: string = "export {};";
  public static readonly lineCommentPrefix: string = "//";
  public static readonly lineFeed: string = "\n";
  public static readonly reportIndent: string = "  ";
  public static readonly tableBottomLeft: string = "└";
  public static readonly tableBottomMiddle: string = "┴";
  public static readonly tableBottomRight: string = "┘";
  public static readonly tableHorizontal: string = "─";
  public static readonly tableMiddle: string = "┼";
  public static readonly tableMiddleLeft: string = "├";
  public static readonly tableMiddleRight: string = "┤";
  public static readonly tableTopLeft: string = "┌";
  public static readonly tableTopMiddle: string = "┬";
  public static readonly tableTopRight: string = "┐";
  public static readonly tableVertical: string = "│";
  public static readonly testReportSeparator: string = "----------------------------------------";
  public static readonly totalLabel: string = "Total:";
  public static readonly timeLabel: string = "Time:";
  public static readonly passedLabel: string = "Passed:";
  public static readonly failedLabel: string = "Failed:";
  public static readonly skippedLabel: string = "Skipped:";
  public static readonly filtersLabel: string = "Filters:";
  public static readonly discoveredLabel: string = "Discovered:";
  public static readonly selectedLabel: string = "Selected:";
  public static readonly unselectedLabel: string = "Unselected:";
  public static readonly passedMark: string = "✓";
  public static readonly failedMark: string = "✘";
  public static readonly skippedMark: string = "○";
  public static readonly millisecondUnit: string = "ms";
  public static readonly expectedLabel: string = "expected:";
  public static readonly actualLabel: string = "actual:";
  public static readonly threwLabel: string = "threw:";
  public static readonly causeLabel: string = "cause:";
  public static readonly stackLineSeparator: string = "\n";
  public static readonly stackFramePrefix: string = "at ";

  public static outcomeCannotCarryFailure(outcome: string): string {
    return `A ${outcome} result cannot carry a failure.`;
  }

  public static attachmentDuplicated(name: string): string {
    return `The test already has an attachment named "${name}".`;
  }

  public static outcomeCannotCarrySkipReason(outcome: string): string {
    return `A ${outcome} result cannot carry a skip reason.`;
  }

  public static testWorkerEnded(exitCode: number): string {
    return `The test worker ended with exit code ${exitCode} before the run finished.`;
  }

  public static threadListFileName(processId: number, listId: string): string {
    return `threads-${processId}-${listId}.txt`;
  }

  public static coverageProfilesMissing(threads: readonly string[]): string {
    return `No coverage profile was written for ${threads.join(", ")}, so the coverage would be incomplete.`;
  }

  public static formatProfileThread(processId: string, threadId: string): string {
    return `thread ${threadId} of process ${processId}`;
  }

  public static formatThreadListRun(testProjects: readonly TestProject[]): string {
    return testProjects.map(t => `${t.packageName} ${t.rootDirectory}`).join(", ");
  }

  public static formatProfileOwner(processId: string, threadId: string, run: string | undefined): string {
    return `${Resources.formatProfileThread(processId, threadId)} (${Resources.formatProfileRun(run)})`;
  }

  public static formatProfileRun(run: string | undefined): string {
    if (Object.isUndefined(run))
      return "no test run listed";

    return run === String.empty ? "a test run that listed no test projects" : `the test run of ${run}`;
  }

  public static formatProfileWriter(owner: string, profiles: readonly string[]): string {
    return `${owner}, which wrote ${profiles.join(", ")}`;
  }

  public static testWorkerEndedAfterItsLastClass(exitCode: number, lastClass: string | undefined): string {
    return Object.isUndefined(lastClass)
      ? `The test worker, which ran no class, ended with exit code ${exitCode} after it was told to end.`
      : `The test worker ended with exit code ${exitCode} after its last class, ${lastClass}.`;
  }

  public static testWorkerDidNotEnd(limitMilliseconds: number, lastClass: string | undefined): string {
    return Object.isUndefined(lastClass)
      ? `The test worker, which ran no class, did not end within ${limitMilliseconds} milliseconds of being told to end, so its coverage is incomplete.`
      : `The test worker did not end within ${limitMilliseconds} milliseconds after its last class, ${lastClass}, so its coverage is incomplete.`;
  }

  public static testWorkersNotEnded(workerCount: number, limitMilliseconds: number, testNames: readonly string[]): string {
    const running = testNames.length === 0 ? String.empty : `, running ${testNames.join(", ")}`;
    return `Test workers that could not be ended within ${limitMilliseconds} milliseconds of being stopped: ${workerCount}${running}.`;
  }

  public static runProcessNotListed(processId: number): string {
    return `The process listing left out the run's own process, ${processId}, so the processes running under it could not be found.`;
  }

  public static abandonedProcessesEnded(processIds: readonly number[]): string {
    return `Processes the run ended that were still running under it: ${[String(processIds.length), ...processIds.map(t => `process ${t}`)].join(", ")}.`;
  }

  public static testWorkerDiscoveryMismatch(classCount: number, methodCount: number, otherClassCount: number, otherMethodCount: number): string {
    return `The test workers discovered different tests: ${classCount} classes and ${methodCount} tests, then ${otherClassCount} classes and ` +
      `${otherMethodCount} tests.`;
  }

  public static testTimedOut(timeoutMilliseconds: number): string {
    return `The test did not settle within its limit of ${timeoutMilliseconds} milliseconds.`;
  }

  public static slowestTest(durationMilliseconds: number, test: string): string {
    return `  ${Math.round(durationMilliseconds)} ms  ${test}`;
  }

  public static fileTimingOver(file: string, median: string, limitMilliseconds: number): string {
    return `Over: ${file}, median ${median}, limit ${Math.round(limitMilliseconds)} ms.`;
  }

  public static fileTimingStale(file: string, median: string, budgetLimitMilliseconds: number): string {
    return `Stale: ${file}, median ${median}, within the ${Math.round(budgetLimitMilliseconds)} ms an unlisted file may take on this machine; the list drops it once it is stale on every machine the list was measured on.`;
  }

  public static fileTimingWithin(file: string, median: string, limitMilliseconds: number): string {
    return `Within: ${file}, median ${median}, limit ${Math.round(limitMilliseconds)} ms.`;
  }

  public static timingSummary(files: number, runs: number, over: number, stale: number): string {
    return `Timed ${files} test files over ${runs} runs; ${over} over their limit, ${stale} listed but within the budget.`;
  }

  public static timeoutVariableInvalid(text: string): string {
    return `${Resources.timeoutVariable} must be a positive integer of milliseconds within the timer limit, not "${text}".`;
  }

  public static testWorkerStalled(limitMilliseconds: number): string {
    return `The test worker started no test within ${limitMilliseconds} milliseconds.`;
  }

  public static testWorkerStalledAfterImport(limitMilliseconds: number, filePath: string): string {
    return `The test worker imported no test file and started no test within ${limitMilliseconds} milliseconds after it imported ${filePath}.`;
  }

  public static formatTestResourcesOpen(heading: string, resources: readonly string[]): string {
    return `${heading} left ${resources.join(Resources.valueSeparator)} open after its tests finished; a test must close what it opens.`;
  }

  public static formatThrewAfterItsTest(testName: string): string {
    return `${testName} left work that threw after the test ended, uncaught; a test must await or handle what it starts.`;
  }

  public static formatRejectedAfterItsTest(testName: string): string {
    return `${testName} left a promise that rejected after the test ended, unhandled; a test must await or handle what it starts.`;
  }

  public static formatTemporaryFolderNotRemoved(directory: string): string {
    return `The run could not remove its temporary folder ${directory}.`;
  }

  public static formatTemporaryLeftovers(leftovers: readonly string[]): string {
    return `The tests left ${leftovers.join(Resources.valueSeparator)} in the run's temporary folder; a test must remove what it creates.`;
  }

  public static runResultCountMismatch(resultCount: number, selectedCount: number): string {
    return `The run produced ${resultCount} results for ${selectedCount} selected tests.`;
  }

  public static methodNotCallable(methodName: string, className: string): string {
    return `Method "${methodName}" of "${className}" is not callable.`;
  }

  public static unmarkedNamedTestClass(exportName: string, filePath: string): string {
    return `Export "${exportName}" in "${filePath}" is named like a test class but is not marked with @TestClass.`;
  }

  public static markedTestClassWithoutRequiredName(exportName: string, filePath: string, requiredSuffix: string): string {
    return `Export "${exportName}" in "${filePath}" is marked with @TestClass but its name does not end in "${requiredSuffix}".`;
  }

  public static testFileWithoutTestClass(filePath: string): string {
    return `Test file "${filePath}" yields no test class. Skip a suite deliberately with @Skip("reason"); delete the file when it is no longer needed.`;
  }

  public static testClassWithoutPrototype(className: string, filePath: string): string {
    return `Test class "${className}" in "${filePath}" has no prototype.`;
  }

  public static categoryWithoutTestClass(exportName: string, filePath: string): string {
    return `Export "${exportName}" in "${filePath}" carries @Category but is not marked with @TestClass.`;
  }

  public static skipWithoutTestClass(exportName: string, filePath: string): string {
    return `Export "${exportName}" in "${filePath}" carries @Skip but is not marked with @TestClass.`;
  }

  public static skipWithoutTestMethod(memberName: string, className: string, filePath: string): string {
    return `Method "${memberName}" of "${className}" in "${filePath}" carries @Skip but is not marked with @TestMethod.`;
  }

  public static timeoutOnExport(exportName: string, filePath: string): string {
    return `Export "${exportName}" in "${filePath}" carries @Timeout, which only a method marked with @TestMethod can carry.`;
  }

  public static timeoutWithoutTestMethod(memberName: string, className: string, filePath: string): string {
    return `Method "${memberName}" of "${className}" in "${filePath}" carries @Timeout but is not marked with @TestMethod.`;
  }

  public static memberDescriptorMissing(memberName: string, className: string, filePath: string): string {
    return `Member "${memberName}" of "${className}" in "${filePath}" is listed among its own members but has no property descriptor.`;
  }

  public static staticTestMetadataInvalid(memberName: string, className: string, filePath: string): string {
    return `Static method "${memberName}" of "${className}" in "${filePath}" cannot carry test metadata; mark instance methods only.`;
  }

  public static accessorTestMetadataInvalid(memberName: string, className: string, filePath: string): string {
    return `Accessor "${memberName}" of "${className}" in "${filePath}" cannot carry test metadata; mark instance methods only.`;
  }

  public static testClassWithoutTestMethod(className: string, filePath: string): string {
    return `Test class "${className}" in "${filePath}" declares no test method.`;
  }

  public static testDataWithoutTestMethod(memberName: string, className: string, filePath: string): string {
    return `Method "${memberName}" of "${className}" in "${filePath}" carries @TestData but is not marked with @TestMethod.`;
  }

  public static categoryWithoutTestMethod(memberName: string, className: string, filePath: string): string {
    return `Method "${memberName}" of "${className}" in "${filePath}" carries @Category but is not marked with @TestMethod.`;
  }

  public static inheritedTestMetadataInvalid(memberName: string, className: string, filePath: string): string {
    return `"${className}" in "${filePath}" inherits the marked member "${memberName}" from a base class; marks must be the test class's own.`;
  }

  public static testMethodRequiresData(memberName: string, className: string, filePath: string): string {
    return `Test method "${memberName}" of "${className}" in "${filePath}" declares parameters but carries no @TestData.`;
  }

  public static testDataParameterCountMismatch(memberName: string, className: string, filePath: string, expectedCount: number, actualCount: number): string {
    return `Test data for "${memberName}" of "${className}" in "${filePath}" supplies ${actualCount} values for ${expectedCount} parameters.`;
  }

  public static symbolTestMetadataInvalid(className: string, filePath: string): string {
    return `A symbol-named member of "${className}" in "${filePath}" cannot carry test metadata; use a named instance method.`;
  }

  public static generatorTestMethodInvalid(memberName: string, className: string, filePath: string): string {
    return `Test method "${memberName}" of "${className}" in "${filePath}" cannot be a generator; use a synchronous or asynchronous method.`;
  }

  public static sourceMapVersionInvalid(version: number): string {
    return `A source map must use version ${version}.`;
  }

  public static sourceMapCharacterInvalid(character: string): string {
    return `A source map contains the invalid mapping character "${character}".`;
  }

  public static coverageReportMalformed(reportFilePath: string): string {
    return `The coverage report "${reportFilePath}" is malformed.`;
  }

  public static coverageReportMalformedFrom(reportFilePath: string, writer: string): string {
    return `The coverage report "${reportFilePath}" is malformed. It is a profile of ${writer}.`;
  }

  public static coverageReportMalformedForReason(reportFilePath: string, reason: string): string {
    return `The coverage report "${reportFilePath}" is malformed: ${reason}.`;
  }

  public static objectRequired(location: string): string {
    return `${location} must be an object`;
  }

  public static stringRequired(location: string): string {
    return `${location} must be a string`;
  }

  public static arrayRequired(location: string): string {
    return `${location} must be an array`;
  }

  public static nonEmptyArrayRequired(location: string): string {
    return `${location} must be a non-empty array`;
  }

  public static nonNegativeIntegerRequired(location: string): string {
    return `${location} must be a non-negative integer`;
  }

  public static integerNoSmallerThanRequired(location: string, lowerBoundName: string): string {
    return `${location} must be an integer no smaller than ${lowerBoundName}`;
  }

  public static sourceMapMalformed(filePath: string): string {
    return `The source map for "${filePath}" is malformed.`;
  }

  public static coverageRangeBeyondFile(rangeEnd: number, fileLength: number): string {
    return `A coverage range ending at ${rangeEnd} exceeds the measured file length ${fileLength}.`;
  }

  public static coverageFileOutsideProject(filePath: string, projectName: string): string {
    return `The coverage file "${filePath}" is outside the declared source or production directory of "${projectName}".`;
  }

  public static coverageFileUrlInvalid(reportFilePath: string, url: string): string {
    return `The coverage report "${reportFilePath}" contains an invalid file URL "${url}".`;
  }

  public static uncoveredLines(lineRange: string): string {
    return `    uncovered lines ${lineRange}`;
  }

  public static overallCoverage(fullyCovered: number, executableCount: number): string {
    return `Overall — ${fullyCovered} of ${executableCount} executable files fully covered`;
  }

  public static skippedTest(methodName: string, reason: string | undefined): string {
    return `${methodName} — skipped: ${reason}`;
  }
}
