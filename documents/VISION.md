# CONTEXT vision

**Scope:** Long-term product purpose and ecosystem direction

This document records why CONTEXT exists and guides product and architecture tradeoffs.

## 1. North star

CONTEXT aims to make TypeScript, HTML, and CSS the primary source ecosystem for portable and native software without depending on a JavaScript engine to define the execution model.

Developers should be able to author libraries and applications in that ecosystem, compile them once to portable CONTEXT artifacts, and optionally AOT compile those artifacts into target-native operating-system products.
The result is a managed native platform and framework, not another Node.js, V8, or browser-hosted JavaScript runtime.

## 2. Unified ecosystem

CONTEXT is the foundation: source compiler, portable artifacts, Runtime, SDK, frameworks, libraries, package model, tooling, and native AOT boundary.

The wider direction includes:

- native application and service development from TypeScript sources;
- eventual first-class HTML and CSS compilation for web and visual software.

The ecosystem remains modular.
Applications, libraries, frameworks, the Runtime, and the SDK keep explicit ownership and package boundaries even though they share one source and execution platform.

## 3. Guiding principles

- **Source semantics first.** TypeScript and applicable ECMAScript behavior are preserved; speed does not justify changing program meaning.
- **Portable first, native downstream.** Portable artifacts are the canonical product.
  Runtime execution and AOT are sibling consumers.
- **Framework completeness.** CONTEXT should provide a coherent framework and tooling ecosystem, complete enough to build whole applications and services on.
- **Owned platform boundary.** Bootstrap tools and transitional host dependencies may exist during development, but they do not define the final architecture.
  The intended platform owns its Runtime, package loading, and required user-space services.
- **Proved performance.** Execution speed, latency, and memory efficiency are primary engineering goals alongside correctness, compatibility, and maintainability.
  Design for efficient algorithms and clear lifetimes from the beginning.
  The compiler and Runtime should exploit sound static facts to avoid unnecessary allocation and reduce retention, dispatch, and garbage-collection overhead.
  Performance comparable to native code is a measured objective on comparable workloads, never an assumption or permission to change program meaning.
- **One ecosystem, clear owners.** Unification does not permit monoliths, hidden coupling, duplicated behavior, or ownerless infrastructure.

## 4. Compatibility and migration

The long-term goal is to compile TypeScript libraries whose language and dependency requirements can be expressed by accepted CONTEXT frameworks.
Libraries coupled to Node.js, browser internals, generated JavaScript, native addons, dynamic code loading, or another host may require a framework adapter, migration, or explicit rejection.

A migration tool is a possible future product, not a prerequisite or accepted design today.
Compatibility is established by exact source, framework, and behavioral contracts rather than by executing existing JavaScript output.

HTML and CSS are part of the vision, but their source model, typed representation, rendering architecture, and possible instructions remain separate future decisions.

## 5. Claim discipline

Claim discipline follows [BUILD-AND-VERIFICATION.md](BUILD-AND-VERIFICATION.md#1-proof-boundaries): a claim names the evidence behind it, and covers only what that evidence proves.

When evaluating a major decision, prefer the design that most directly advances this vision while preserving semantics, ownership, portability, replaceability, and measurable correctness.
