/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type BinaryToTextEncoding, createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Script from "../../../../scripts/script.ts";
import TypeScriptConformanceCase from "./typescript-conformance-case.ts";
import TypeScriptConformanceLayout from "./typescript-conformance-layout.ts";
import TypeScriptConformanceProvenance from "./typescript-conformance-provenance.ts";
import TypeScriptExpectedApplicableRecord from "./typescript-expected-applicable-record.ts";
import TypeScriptExpectedBatch from "./typescript-expected-batch.ts";
import TypeScriptExpectedCheckpoint from "./typescript-expected-checkpoint.ts";
import TypeScriptExpectedDiagnosticSections from "./typescript-expected-diagnostic-sections.ts";
import type TypeScriptExpectedInapplicableRecord from "./typescript-expected-inapplicable-record.ts";
import TypeScriptExpectedManifestTotals from "./typescript-expected-manifest-totals.ts";
import TypeScriptExpectedManifest from "./typescript-expected-manifest.ts";
import TypeScriptExpectedWorkerSupervisor from "./typescript-expected-worker-supervisor.ts";
import TypeScriptReferenceInvocation from "./typescript-reference-invocation.ts";

export default class TypeScriptExpectedDiagnosticsGenerator extends Script {
  private static readonly BATCH_FILE_NAME: string = "batch.json";
  private static readonly BATCH_SIZE: number = 250;
  private static readonly CASE_TIMEOUT_MILLISECONDS: number = 10_000;
  private static readonly CASES_DIRECTORY: string = TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.CASES);
  private static readonly CHECKPOINT_DIRECTORY: string = "_build/typescript-expected-diagnostics";
  private static readonly DIAGNOSTICS_FILE_NAME: string = "diagnostics.jsonl";
  private static readonly EXPECTED_DIRECTORY: string = TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.EXPECTED);
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: BinaryToTextEncoding = "hex";
  private static readonly LIBRARIES_DIRECTORY: string = TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.LIBRARIES);
  private static readonly LINE_FEED: string = "\n";
  private static readonly MANIFEST_FILE_NAME: string = "MANIFEST.json";
  private static readonly MAXIMUM_ATTEMPTS: number = 3;
  private static readonly MEMORY_BUDGET_BYTES: number = 6 * 1024 * 1024 * 1024;
  private static readonly PROVENANCE_PATH: string = TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.PROVENANCE);
  private static readonly SEALED_MESSAGE: string = "Generated the TypeScript expected diagnostics.";
  private static readonly WORKER_MODULE: string = "./generate-expected-diagnostics-worker.ts";

  public override async runAsync(): Promise<void> {
    const cases = this.listCases();
    const checkpoint = TypeScriptExpectedCheckpoint.open(TypeScriptExpectedDiagnosticsGenerator.CHECKPOINT_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.identity());
    const batchPath = path.join(TypeScriptExpectedDiagnosticsGenerator.CHECKPOINT_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.BATCH_FILE_NAME);
    const workerPath = fileURLToPath(import.meta.resolve(TypeScriptExpectedDiagnosticsGenerator.WORKER_MODULE));
    let batchNumber = 0;

    await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.starting(cases.length, checkpoint.accountedCount));

    while (true) {
      const outstanding = cases.filter(t => !checkpoint.isAccounted(t));
      if (outstanding.length === 0)
        break;

      const batch = outstanding.slice(0, TypeScriptExpectedDiagnosticsGenerator.BATCH_SIZE);
      await this.writeFileAsync(batchPath, JSON.stringify(new TypeScriptExpectedBatch(
        TypeScriptExpectedDiagnosticsGenerator.CASES_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.LIBRARIES_DIRECTORY, batch)));

      const started = performance.now();
      const accountedBefore = checkpoint.accountedCount;
      const outcome = await new TypeScriptExpectedWorkerSupervisor(
        workerPath, batchPath, TypeScriptExpectedDiagnosticsGenerator.CASE_TIMEOUT_MILLISECONDS, TypeScriptExpectedDiagnosticsGenerator.MEMORY_BUDGET_BYTES)
        .runAsync(t => { checkpoint.addResult(t.record!); });

      if (outcome.reason !== undefined) {
        if (outcome.chargedPath === undefined && outcome.exitCode !== null && outcome.exitCode !== 0)
          throw new Error(TypeScriptExpectedDiagnosticsGenerator.workerFailedBeforeACase(outcome.exitCode, outcome.signal));

        if (outcome.chargedPath !== undefined) {
          const attempts = checkpoint.recordAttempt(outcome.chargedPath, outcome.reason);
          await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.caseEndedAbnormally(outcome.chargedPath, outcome.reason, attempts));
          if (attempts >= TypeScriptExpectedDiagnosticsGenerator.MAXIMUM_ATTEMPTS)
            checkpoint.addExceeded(outcome.chargedPath, outcome.reason);
        }
        else
          await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.workerKilledBetweenCases(outcome.reason));
      }

      if (checkpoint.accountedCount === accountedBefore && outcome.chargedPath === undefined)
        throw new Error(TypeScriptExpectedDiagnosticsGenerator.NO_PROGRESS);

      batchNumber++;
      await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.batchDone(
        batchNumber, checkpoint.accountedCount, cases.length, checkpoint.exceededReasons.size, checkpoint.retries.length, performance.now() - started));
    }

    if (checkpoint.accountedCount !== cases.length)
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.accountingDrift(cases.length, checkpoint.accountedCount));

    if (checkpoint.exceededReasons.size !== 0)
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.casesExceeded(checkpoint.exceededReasons));

    await this.sealAsync(cases, checkpoint);
    await this.writeSummaryAsync(cases, checkpoint.retries.length);
    await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.SEALED_MESSAGE);
  }

  public async regenerateAsync(): Promise<void> {
    await this.removeDirectoryAsync(TypeScriptExpectedDiagnosticsGenerator.CHECKPOINT_DIRECTORY);
    await this.runAsync();
  }

  public async verifyAsync(): Promise<void> {
    const manifestPath = path.join(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.MANIFEST_FILE_NAME);
    const diagnosticsPath = path.join(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.DIAGNOSTICS_FILE_NAME);
    if (!await this.pathExistsAsync(manifestPath) || !await this.pathExistsAsync(diagnosticsPath))
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_MISSING);

    const manifest = TypeScriptExpectedManifest.parse(await this.readFileAsync(manifestPath), manifestPath);
    if (manifest.typescriptVersion !== await this.readTypeScriptVersionAsync())
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_PIN_OUTDATED);

    if (manifest.compilerOptionsSha256 !== TypeScriptReferenceInvocation.hash())
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_INVOCATION_OUTDATED);

    if (manifest.unitSplittingVersion !== TypeScriptConformanceCase.SPLITTING_VERSION)
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_SPLITTING_OUTDATED);

    if (manifest.resultsSha256 !== TypeScriptExpectedDiagnosticsGenerator.hash(await this.readFileAsync(diagnosticsPath)))
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_RESULTS_ALTERED);
  }

  private listCases(): readonly string[] {
    return readdirSync(TypeScriptExpectedDiagnosticsGenerator.CASES_DIRECTORY, { recursive: true, withFileTypes: true })
      .filter(t => t.isFile())
      .map(t => path.relative(TypeScriptExpectedDiagnosticsGenerator.CASES_DIRECTORY, path.join(t.parentPath, t.name)).split(path.sep).join(path.posix.sep))
      .sort();
  }

  private async sealAsync(cases: readonly string[], checkpoint: TypeScriptExpectedCheckpoint): Promise<void> {
    const provenance = TypeScriptConformanceProvenance.parse(
      await this.readFileAsync(TypeScriptExpectedDiagnosticsGenerator.PROVENANCE_PATH), TypeScriptExpectedDiagnosticsGenerator.PROVENANCE_PATH);
    if (provenance.typescriptVersion !== await this.readTypeScriptVersionAsync())
      throw new Error(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_PIN_OUTDATED);

    const inapplicableByReason = new Map<string, number>();
    let applicable = 0;
    let diagnostics = 0;
    const lines: string[] = [];

    for (const casePath of cases) {
      const line = checkpoint.resultLines.get(casePath)!;
      const record: TypeScriptExpectedApplicableRecord | TypeScriptExpectedInapplicableRecord = JSON.parse(line);
      if (record.applicability === TypeScriptExpectedApplicableRecord.APPLICABILITY) {
        applicable++;
        diagnostics += TypeScriptExpectedDiagnosticSections.count(record.diagnostics);
      }
      else
        inapplicableByReason.set(record.reason, (inapplicableByReason.get(record.reason) ?? 0) + 1);

      lines.push(line);
    }

    const results = `${lines.join(TypeScriptExpectedDiagnosticsGenerator.LINE_FEED)}${TypeScriptExpectedDiagnosticsGenerator.LINE_FEED}`;
    const manifest = new TypeScriptExpectedManifest(
      provenance.typescriptVersion,
      provenance.sources,
      TypeScriptReferenceInvocation.COMPILER_OPTIONS,
      TypeScriptReferenceInvocation.hash(),
      TypeScriptConformanceCase.SPLITTING_VERSION,
      new TypeScriptExpectedManifestTotals(
        cases.length, applicable, Object.fromEntries([...inapplicableByReason.keys()].sort().map(t => [t, inapplicableByReason.get(t)!] as const)), diagnostics),
      checkpoint.retries,
      TypeScriptExpectedDiagnosticsGenerator.hash(results));

    await this.createDirectoryAsync(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_DIRECTORY);
    await this.writeFileAsync(path.join(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.DIAGNOSTICS_FILE_NAME), results);
    await this.writeFileAsync(path.join(TypeScriptExpectedDiagnosticsGenerator.EXPECTED_DIRECTORY, TypeScriptExpectedDiagnosticsGenerator.MANIFEST_FILE_NAME),
      manifest.serialize());
  }

  private async writeSummaryAsync(cases: readonly string[], retried: number): Promise<void> {
    let discardedPreambles = 0;
    let repeatedUnitNames = 0;
    for (const casePath of cases) {
      const conformanceCase = TypeScriptConformanceCase.read(TypeScriptExpectedDiagnosticsGenerator.CASES_DIRECTORY, casePath);
      if (conformanceCase.hasDiscardedPreamble)
        discardedPreambles++;
      if (conformanceCase.hasRepeatedUnitName)
        repeatedUnitNames++;
    }

    await this.writeLogAsync(TypeScriptExpectedDiagnosticsGenerator.summary(discardedPreambles, repeatedUnitNames, retried));
  }

  private static hash(content: string): string {
    return createHash(TypeScriptExpectedDiagnosticsGenerator.HASH_ALGORITHM).update(content).digest(TypeScriptExpectedDiagnosticsGenerator.HASH_ENCODING);
  }

  private static identity(): string {
    return JSON.stringify({ compilerOptions: TypeScriptReferenceInvocation.COMPILER_OPTIONS, unitSplittingVersion: TypeScriptConformanceCase.SPLITTING_VERSION });
  }

  private static readonly NO_PROGRESS: string = "A worker ended without accounting for a single case; the run stops rather than loop.";
  private static readonly EXPECTED_INVOCATION_OUTDATED: string = "The committed expected diagnostics were generated under another invocation; regenerate them.";
  private static readonly EXPECTED_MISSING: string = "The committed expected diagnostics are missing; generate them.";
  private static readonly EXPECTED_PIN_OUTDATED: string = "The committed expected diagnostics were generated under another TypeScript pin; regenerate them.";
  private static readonly EXPECTED_RESULTS_ALTERED: string = "The committed expected diagnostics do not match their manifest; regenerate them rather than edit them.";
  private static readonly EXPECTED_SPLITTING_OUTDATED: string = "The committed expected diagnostics were generated under another splitting rule; regenerate them.";

  private static accountingDrift(total: number, accounted: number): string {
    return `Accounting drift: ${total} cases vendored, ${accounted} accounted; the checkpoint names cases no longer vendored.`;
  }

  private static batchDone(batch: number, accounted: number, total: number, exceeded: number, retried: number, milliseconds: number): string {
    return `Batch ${batch}: ${accounted}/${total} accounted, ${exceeded} exceeded, ${retried} retried, ${(milliseconds / 1000).toFixed(1)} s.`;
  }

  private static caseEndedAbnormally(casePath: string, reason: string, attempts: number): string {
    return `Attempt ${attempts} ended abnormally (${reason}): ${casePath}`;
  }

  private static casesExceeded(exceeded: ReadonlyMap<string, string>): string {
    return `${exceeded.size} cases never answered and no expected diagnostics were sealed:\n${[...exceeded].map(([casePath, reason]) => `  ${reason}: ${casePath}`).join("\n")}`;
  }

  private static starting(total: number, accounted: number): string {
    return `Generating the expected diagnostics for ${total} cases, ${accounted} already accounted by the checkpoint.`;
  }

  private static summary(discardedPreambles: number, repeatedUnitNames: number, retried: number): string {
    return `Cases with content discarded before the first @filename: ${discardedPreambles}; with a repeated unit name: ${repeatedUnitNames}; asked more than once: ${retried}.`;
  }

  private static workerFailedBeforeACase(exitCode: number | null, signal: NodeJS.Signals | null): string {
    return `A worker failed (exit ${exitCode}, signal ${signal}) before starting a case.`;
  }

  private static workerKilledBetweenCases(reason: string): string {
    return `A worker was killed (${reason}) between two cases; no case is charged.`;
  }
}
