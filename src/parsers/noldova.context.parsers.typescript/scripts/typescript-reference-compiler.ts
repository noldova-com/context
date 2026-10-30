/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { API, type Diagnostic, type Program } from "typescript/unstable/sync";

import type TypeScriptConformanceCase from "./typescript-conformance-case.ts";
import TypeScriptExpectedApplicableRecord from "./typescript-expected-applicable-record.ts";
import TypeScriptExpectedDiagnosticSections from "./typescript-expected-diagnostic-sections.ts";
import TypeScriptExpectedDiagnostic from "./typescript-expected-diagnostic.ts";
import TypeScriptPlatformPackage from "./typescript-platform-package.ts";
import TypeScriptReferenceFileSystem from "./typescript-reference-file-system.ts";
import TypeScriptReferenceIdentity from "./typescript-reference-identity.ts";
import TypeScriptReferenceInvocation from "./typescript-reference-invocation.ts";

export default class TypeScriptReferenceCompiler {
  private static readonly SEPARATOR: string = "/";
  private static readonly CASE_ROOT_NAME: string = "case";
  private static readonly CASE_ROOT: string = `${TypeScriptReferenceCompiler.SEPARATOR}${TypeScriptReferenceCompiler.CASE_ROOT_NAME}`;
  private static readonly CONFIG_PATH: string = "/tsconfig.json";
  private static readonly LIBRARY_OPTION_NAME: string = "lib";
  private static readonly PACKAGE_MANIFEST_NAME: string = "package.json";

  private readonly fileSystem: TypeScriptReferenceFileSystem = new TypeScriptReferenceFileSystem();
  private readonly libraryDirectory: string;

  public constructor(librariesDirectory: string) {
    this.libraryDirectory = TypeScriptReferenceCompiler.resolveLibraryDirectory();
    for (const name of readdirSync(librariesDirectory))
      this.fileSystem.write(`${this.libraryDirectory}${TypeScriptReferenceCompiler.SEPARATOR}${name}`, readFileSync(path.join(librariesDirectory, name)).toString());
  }

  public evaluate(conformanceCase: TypeScriptConformanceCase): TypeScriptExpectedApplicableRecord {
    const unitPaths = conformanceCase.units.map(t => `${TypeScriptReferenceCompiler.CASE_ROOT}${TypeScriptReferenceCompiler.SEPARATOR}${t.name}`);
    const identity = new TypeScriptReferenceIdentity(TypeScriptReferenceCompiler.CONFIG_PATH, this.libraryDirectory, unitPaths);

    conformanceCase.units.forEach((t, index) => { this.fileSystem.write(unitPaths[index]!, t.content); });
    this.fileSystem.write(TypeScriptReferenceCompiler.CONFIG_PATH, this.createConfig(conformanceCase));

    const api = new API({ fs: this.fileSystem });
    try {
      const snapshot = api.updateSnapshot({ openProjects: [TypeScriptReferenceCompiler.CONFIG_PATH] });
      try {
        const project = snapshot.getProject(TypeScriptReferenceCompiler.CONFIG_PATH);
        if (project === undefined)
          throw new Error(TypeScriptReferenceCompiler.projectNotOpened(conformanceCase.path));

        const sourceFileNames = project.program.getSourceFileNames();
        if (!sourceFileNames.some(t => identity.isLibrary(t)))
          throw new Error(TypeScriptReferenceCompiler.librariesNotLoaded(conformanceCase.path, this.libraryDirectory));

        const unitFileNames = sourceFileNames.filter(t => identity.isUnit(t));

        return new TypeScriptExpectedApplicableRecord(
          conformanceCase, unitFileNames.map(t => identity.ofFile(t) as number), this.collect(project.program, unitFileNames, identity));
      }
      finally {
        snapshot.dispose();
      }
    }
    finally {
      api.close();
      for (const unitPath of unitPaths)
        this.fileSystem.remove(unitPath);
      this.fileSystem.remove(TypeScriptReferenceCompiler.CONFIG_PATH);
    }
  }

  private createConfig(conformanceCase: TypeScriptConformanceCase): string {
    const compilerOptions = conformanceCase.libraries === undefined
      ? TypeScriptReferenceInvocation.COMPILER_OPTIONS
      : { ...TypeScriptReferenceInvocation.COMPILER_OPTIONS, [TypeScriptReferenceCompiler.LIBRARY_OPTION_NAME]: conformanceCase.libraries };

    return JSON.stringify({
      compilerOptions,
      files: conformanceCase.rootUnits.map(t => `${TypeScriptReferenceCompiler.CASE_ROOT_NAME}${TypeScriptReferenceCompiler.SEPARATOR}${t.name}`),
    });
  }

  private collect(program: Program, unitFileNames: readonly string[], identity: TypeScriptReferenceIdentity): TypeScriptExpectedDiagnosticSections {
    const record = (t: readonly Diagnostic[]): TypeScriptExpectedDiagnostic[] => t.map(t => TypeScriptExpectedDiagnostic.record(t, identity));

    const config = record(program.getConfigFileParsingDiagnostics());
    const syntactic = record(unitFileNames.flatMap(t => program.getSyntacticDiagnostics(t)));
    const programDiagnostics = record(program.getProgramDiagnostics());
    const semantic = record(unitFileNames.flatMap(t => program.getSemanticDiagnostics(t)));
    const global = record(program.getGlobalDiagnostics());
    const suggestion = record(unitFileNames.flatMap(t => program.getSuggestionDiagnostics(t)));

    return new TypeScriptExpectedDiagnosticSections(config, syntactic, programDiagnostics, global, semantic, suggestion);
  }

  private static resolveLibraryDirectory(): string {
    const manifestPath = fileURLToPath(import.meta.resolve(
      `${TypeScriptPlatformPackage.NAME}${TypeScriptReferenceCompiler.SEPARATOR}${TypeScriptReferenceCompiler.PACKAGE_MANIFEST_NAME}`));

    return path.join(path.dirname(manifestPath), TypeScriptPlatformPackage.LIBRARY_DIRECTORY).split(path.sep).join(path.posix.sep);
  }

  private static librariesNotLoaded(casePath: string, libraryDirectory: string): string {
    return `The reference loaded no library for "${casePath}"; the vendored libraries are mounted at "${libraryDirectory}" but were not read there.`;
  }

  private static projectNotOpened(casePath: string): string {
    return `The reference opened no project for "${casePath}".`;
  }
}
