"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/parser.ts
var parser_exports = {};
__export(parser_exports, {
  Parser: () => Parser,
  choice: () => choice,
  contextConditions: () => contextConditions,
  createParser: () => createParser,
  createRule: () => createRule,
  error: () => error,
  errorRecoveryStrategies: () => errorRecoveryStrategies,
  oneOrMore: () => oneOrMore,
  optional: () => optional,
  parse: () => parse,
  repeat: () => repeat,
  rule: () => rule,
  seq: () => seq,
  token: () => token,
  validateGrammar: () => validateGrammar,
  zeroOrMore: () => zeroOrMore
});
module.exports = __toCommonJS(parser_exports);
var Parser = class {
  constructor(rules, settings) {
    this.tokens = [];
    this.ast = [];
    this.position = 0;
    this.depth = 0;
    this.errors = [];
    // Performance optimizations
    this.memoCache = /* @__PURE__ */ new Map();
    this.nodePool = [];
    this.ignoredSet = /* @__PURE__ */ new Set();
    this.ruleSet = /* @__PURE__ */ new Set();
    this.startTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    // Safety and robustness
    this.maxIterations = 1e4;
    this.disposed = false;
    this.validateInput(rules, settings);
    this.rules = /* @__PURE__ */ new Map();
    for (const rule2 of rules) {
      this.rules.set(rule2.name, rule2);
      this.ruleSet.add(rule2.name);
    }
    this.settings = this.normalizeSettings(settings);
    this.ignoredSet = /* @__PURE__ */ new Set([...this.settings.ignored]);
    this.errors = [];
    this.stats = {
      tokensProcessed: 0,
      rulesApplied: 0,
      errorsRecovered: 0,
      parseTimeMs: 0
    };
    const grammarIssues = this.validateGrammar();
    if (grammarIssues.length > 0) {
      throw new Error(`Grammar validation failed: ${grammarIssues.join(", ")}`);
    }
  }
  // ════ Main ════
  /**
   * Parses an array of tokens into an AST using the configured grammar rules.
   * @param tokens Array of tokens to parse
   * @returns ParseResult containing the AST and any parsing errors
   */
  parse(tokens) {
    var _a;
    if (this.disposed) {
      throw new Error("Parser has been disposed and cannot be reused");
    }
    this.startTime = Date.now();
    this.debug(`Starting parse with ${tokens.length} tokens`);
    this.resetState(tokens);
    if (tokens.length === 0) {
      return this.createResult();
    }
    try {
      const startRule = this.rules.get(this.settings.startRule);
      if (!startRule) {
        throw new Error(`Start rule '${this.settings.startRule}' not found`);
      }
      this.skipIgnored();
      const result = this.parsePattern(startRule.pattern, startRule);
      if (result !== null) {
        if ((_a = startRule.options) == null ? void 0 : _a.build) {
          const processed = this.safeBuild(startRule.options.build, result);
          if (processed !== null) {
            this.ast.push(processed);
          }
        } else {
          this.ast.push(result);
        }
      }
      this.skipIgnored();
      if (this.position < this.tokens.length && this.settings.errorRecovery.mode === "strict") {
        this.addError({
          message: `Unexpected token '${this.tokens[this.position].type}'`,
          position: this.getCurrentPosition(),
          suggestions: ["Check for missing operators or delimiters"],
          context: this.getContext(),
          code: "E001"
        });
      }
    } catch (error2) {
      this.addError({
        message: error2.message,
        position: this.getCurrentPosition(),
        context: this.getContext(),
        code: "E000"
      });
    }
    return this.createResult();
  }
  // ════ Help ════
  parsePattern(pattern, rule2) {
    var _a;
    if (this.depth > this.settings.maxDepth) {
      throw new Error("Maximum parsing depth exceeded");
    }
    this.debug(`[parsePattern] Attempting to parse pattern type: ${pattern.type} at position ${this.position}, depth: ${this.depth}`);
    this.depth++;
    try {
      this.skipIgnored((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.ignored);
      switch (pattern.type) {
        case "token":
          return this.parseToken(pattern.name);
        case "rule":
          return this.parseRule(pattern.name);
        case "seq":
          return this.parseSequence(pattern.patterns, rule2);
        case "choice":
          return this.parseChoice(pattern.patterns, rule2);
        case "repeat":
          return this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, rule2);
        case "optional":
          return this.parseOptional(pattern.pattern, rule2);
        default:
          throw new Error(`Unknown pattern type: ${pattern.type}`);
      }
    } finally {
      this.depth--;
    }
  }
  parseToken(tokenName) {
    if (this.position >= this.tokens.length) {
      this.debug(`[parseToken] End of tokens reached while looking for: ${tokenName}`);
      return null;
    }
    const token2 = this.tokens[this.position];
    this.debug(`[parseToken] Looking for '${tokenName}', found '${token2.type}' at position ${this.position}`);
    if (token2.type === tokenName) {
      this.position++;
      this.stats.tokensProcessed++;
      this.skipIgnored();
      this.debug(`[parseToken] Successfully matched token '${tokenName}'`);
      return token2;
    }
    return null;
  }
  parseSequence(patterns, rule2) {
    var _a, _b;
    this.debug(`[parseSequence] Starting sequence parse with ${patterns.length} patterns at position ${this.position}`);
    const results = [];
    const savedPosition = this.position;
    const savedErrorCount = this.errors.length;
    for (let i = 0; i < patterns.length; i++) {
      this.debug(`[parseSequence] Parsing pattern ${i + 1}/${patterns.length} of type ${patterns[i].type}`);
      const result = this.parsePattern(patterns[i]);
      if (result === null) {
        this.debug(`[parseSequence] Pattern ${i + 1} failed at position ${this.position}`);
        if ((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.errors) {
          this.handleRuleError(rule2, i);
        }
        if (this.settings.errorRecovery.mode === "strict") {
          this.position = savedPosition;
          return null;
        } else {
          if ((_b = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _b.recovery) {
            this.debug(`[parseSequence] Applying recovery strategy`);
            this.applyRecoveryStrategy(rule2.options.recovery);
            this.stats.errorsRecovered++;
          } else {
            this.defaultErrorRecovery();
          }
          return null;
        }
      }
      results.push(result);
    }
    this.debug(`[parseSequence] Successfully parsed all ${patterns.length} patterns`);
    return results;
  }
  parseChoice(patterns, rule2) {
    const savedPosition = this.position;
    const savedErrorCount = this.errors.length;
    for (let i = 0; i < patterns.length; i++) {
      this.position = savedPosition;
      try {
        const result = this.parsePattern(patterns[i]);
        if (result !== null) {
          return result;
        }
      } catch (error2) {
        this.position = savedPosition;
        if (this.settings.errorRecovery.mode === "resilient") {
          this.errors.length = savedErrorCount;
        }
      }
    }
    this.position = savedPosition;
    return null;
  }
  parseRepeat(pattern, min = 0, max = Infinity, separator, rule2) {
    const results = [];
    let separatorConsumed = false;
    const loopState = {
      visitedPositions: /* @__PURE__ */ new Set(),
      iterationCount: 0,
      lastProgress: this.position
    };
    while (results.length < max && this.position < this.tokens.length && loopState.iterationCount < this.maxIterations) {
      const iterationStartPosition = this.position;
      loopState.iterationCount++;
      if (this.detectInfiniteLoop(loopState)) {
        this.debug(`[parseRepeat] Infinite loop detected at position ${this.position}`);
        this.addError({
          message: "Infinite loop detected in repeat pattern",
          position: this.getCurrentPosition(),
          code: "E002"
        });
        break;
      }
      if (separator && results.length > 0) {
        const savedPosition = this.position;
        const sepResult = this.parsePattern(separator);
        if (sepResult === null) {
          this.position = savedPosition;
          break;
        }
        separatorConsumed = true;
      }
      const beforePatternPosition = this.position;
      const result = this.parsePattern(pattern);
      if (result === null) {
        this.debug(`[parseRepeat] Pattern failed at position ${this.position}, iteration ${results.length}`);
        if (separatorConsumed && this.settings.errorRecovery.mode === "strict") {
          throw new Error(`Expected pattern after separator`);
        }
        if (this.settings.errorRecovery.mode === "resilient" && this.position > beforePatternPosition) {
          separatorConsumed = false;
          continue;
        }
        break;
      }
      this.debug(`[parseRepeat] Successfully parsed iteration ${results.length + 1}`);
      results.push(result);
      separatorConsumed = false;
      loopState.lastProgress = this.position;
      if (this.position === iterationStartPosition && result !== null) {
        this.debug(`[parseRepeat] No progress made despite successful match, breaking`);
        break;
      }
    }
    this.debug(`[parseRepeat] Completed with ${results.length} results (min: ${min})`);
    if (results.length < min) {
      if (this.settings.errorRecovery.mode === "resilient") {
        this.addError({
          message: `Expected at least ${min} occurrences, got ${results.length}`,
          position: this.getCurrentPosition(),
          context: this.getContext(),
          code: "E003"
        });
        return results;
      } else {
        throw new Error(`Expected at least ${min} occurrences, got ${results.length}`);
      }
    }
    return results;
  }
  parseOptional(pattern, rule2) {
    const savedPosition = this.position;
    const savedErrorCount = this.errors.length;
    try {
      const result = this.parsePattern(pattern);
      return result;
    } catch (error2) {
      this.position = savedPosition;
      this.errors.length = savedErrorCount;
      return null;
    }
  }
  parseRule(ruleName) {
    var _a, _b, _c;
    this.debug(`[parseRule] Parsing rule: ${ruleName} at position ${this.position}`);
    const rule2 = this.rules.get(ruleName);
    if (!rule2) {
      throw new Error(`Rule '${ruleName}' not found`);
    }
    if (this.settings.enableMemoization && ((_a = rule2.options) == null ? void 0 : _a.memoizable) !== false) {
      const memoKey = this.getMemoKey(ruleName, this.position);
      const memoEntry = this.memoCache.get(memoKey);
      if (memoEntry && Date.now() - memoEntry.timestamp < 5e3) {
        this.debug(`[parseRule] Cache hit for rule '${ruleName}' at position ${this.position}`);
        this.position = memoEntry.endPosition;
        this.cacheHits++;
        return memoEntry.result;
      }
      this.cacheMisses++;
    }
    const savedPosition = this.position;
    const startErrorCount = this.errors.length;
    try {
      this.stats.rulesApplied++;
      const result = this.parsePattern(rule2.pattern, rule2);
      let finalResult = result;
      if (result !== null && ((_b = rule2.options) == null ? void 0 : _b.build)) {
        this.debug(`[parseRule] Applying build function for rule '${ruleName}'`);
        finalResult = this.safeBuild(rule2.options.build, result);
      }
      if (this.settings.enableMemoization && ((_c = rule2.options) == null ? void 0 : _c.memoizable) !== false && finalResult !== null) {
        this.cacheMemoResult(ruleName, savedPosition, finalResult, this.position, this.errors.slice(startErrorCount));
      }
      return finalResult;
    } catch (error2) {
      if (this.settings.errorRecovery.mode === "strict") {
        throw error2;
      }
      this.debug(`[parseRule] Error in rule '${ruleName}': ${error2.message}`);
      this.handleError(error2, rule2, savedPosition);
      return null;
    }
  }
  // ════ More ════
  detectInfiniteLoop(state) {
    const currentPosition = this.position;
    if (state.visitedPositions.has(currentPosition)) {
      if (state.visitedPositions.size > 10) {
        return true;
      }
    }
    state.visitedPositions.add(currentPosition);
    if (state.iterationCount > 100 && currentPosition === state.lastProgress) {
      return true;
    }
    if (state.visitedPositions.size > 20) {
      const positions = Array.from(state.visitedPositions);
      state.visitedPositions.clear();
      positions.slice(-10).forEach((pos) => state.visitedPositions.add(pos));
    }
    return false;
  }
  safeBuild(buildFn, matches) {
    try {
      const result = buildFn(Array.isArray(matches) ? matches : [matches]);
      return result;
    } catch (error2) {
      this.debug(`[safeBuild] Build function error: ${error2.message}`);
      this.addError({
        message: `Build function error: ${error2.message}`,
        position: this.getCurrentPosition(),
        code: "E004"
      });
      return matches;
    }
  }
  getMemoKey(ruleName, position) {
    return `${ruleName}:${position}`;
  }
  cacheMemoResult(ruleName, position, result, endPosition, errors) {
    if (this.memoCache.size >= this.settings.maxCacheSize) {
      const oldestEntries = Array.from(this.memoCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp).slice(0, Math.floor(this.settings.maxCacheSize * 0.2));
      oldestEntries.forEach(([key]) => this.memoCache.delete(key));
    }
    const memoKey = this.getMemoKey(ruleName, position);
    this.memoCache.set(memoKey, {
      result,
      endPosition,
      errors: [...errors],
      timestamp: Date.now()
    });
  }
  handleError(error2, rule2, savedPosition) {
    var _a;
    const pos = this.getCurrentPosition();
    const context = this.getContext();
    this.debug(`[handleError] Parse error: ${error2.message}`);
    this.addError({
      message: error2.message,
      position: pos,
      context,
      code: "E005"
    });
    if ((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.recovery) {
      this.debug(`[handleError] Applying recovery for rule '${rule2.name}'`);
      this.applyRecoveryStrategy(rule2.options.recovery);
      this.stats.errorsRecovered++;
    } else {
      this.debug(`[handleError] No recovery strategy, using default`);
      this.defaultErrorRecovery();
    }
  }
  handleRuleError(rule2, failedAt) {
    var _a;
    if ((_a = rule2.options) == null ? void 0 : _a.errors) {
      for (const errorHandler of rule2.options.errors) {
        if (errorHandler.condition(this, failedAt)) {
          this.addError({
            message: errorHandler.message,
            position: this.getCurrentPosition(),
            suggestions: errorHandler.suggestions,
            context: this.getContext(),
            code: errorHandler.code || "E006",
            severity: errorHandler.severity || "error"
          });
          break;
        }
      }
    }
  }
  applyRecoveryStrategy(strategy) {
    const beforePos = this.position;
    this.debug(`[recovery] Starting recovery at position ${beforePos}`);
    switch (strategy.type) {
      case "panic":
        this.debug(`[recovery] Using panic mode recovery`);
        this.defaultErrorRecovery();
        break;
      case "skipUntil":
        const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
        this.debug(`[recovery] Skipping until tokens: ${tokens.join(", ")}`);
        this.skipUntilTokens(tokens);
        break;
      case "insertToken":
        this.debug(`[recovery] Attempting token insertion recovery`);
        break;
      case "deleteToken":
        this.debug(`[recovery] Attempting token deletion recovery`);
        if (this.position < this.tokens.length) {
          this.position++;
        }
        break;
      default:
        this.defaultErrorRecovery();
    }
    this.debug(`[recovery] Recovery moved position from ${beforePos} to ${this.position}`);
  }
  skipUntilTokens(tokens) {
    this.debug(`[skipUntilTokens] Looking for tokens: ${tokens.join(", ")} from position ${this.position}`);
    const tokenSet = new Set(tokens);
    let skipped = 0;
    while (this.position < this.tokens.length && skipped < this.maxIterations) {
      const currentToken = this.tokens[this.position];
      this.debug(`[skipUntilTokens] Checking token '${currentToken.type}' at position ${this.position}`);
      if (tokenSet.has(currentToken.type)) {
        this.debug(`[skipUntilTokens] Found sync token '${currentToken.type}' at position ${this.position}`);
        return;
      }
      this.position++;
      skipped++;
    }
    this.debug(`[skipUntilTokens] Reached end of tokens or skip limit without finding sync token`);
  }
  defaultErrorRecovery() {
    this.debug(`[defaultErrorRecovery] Starting at position ${this.position}`);
    const syncTokens = this.settings.errorRecovery.syncTokens;
    if (syncTokens.length > 0) {
      this.skipUntilTokens(syncTokens);
    } else {
      if (this.position < this.tokens.length) {
        this.debug(`[defaultErrorRecovery] No sync tokens, skipping one token`);
        this.position++;
      }
    }
  }
  getCurrentPosition() {
    var _a;
    if (this.position < this.tokens.length) {
      return this.tokens[this.position].pos;
    }
    if (this.tokens.length > 0) {
      const lastToken = this.tokens[this.tokens.length - 1];
      const valueLength = ((_a = lastToken.value) == null ? void 0 : _a.length) || 0;
      return {
        line: lastToken.pos.line,
        col: lastToken.pos.col + valueLength,
        offset: lastToken.pos.offset + valueLength
      };
    }
    return { line: 1, col: 1, offset: 0 };
  }
  getCurrentToken() {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }
  getContext() {
    const contextSize = 5;
    const start = Math.max(0, this.position - contextSize);
    const end = Math.min(this.tokens.length, this.position + contextSize);
    return this.tokens.slice(start, end).map((token2, idx) => {
      const actualIdx = start + idx;
      const marker = actualIdx === this.position ? "\u2192" : " ";
      return `${marker}${token2.type}${token2.value ? `:${token2.value}` : ""}`;
    }).join(" ");
  }
  skipIgnored(ruleIgnored) {
    if (this.ignoredSet.size === 0 && (!ruleIgnored || ruleIgnored.length === 0)) {
      return;
    }
    const combinedIgnored = ruleIgnored ? /* @__PURE__ */ new Set([...this.ignoredSet, ...ruleIgnored]) : this.ignoredSet;
    while (this.position < this.tokens.length) {
      const token2 = this.tokens[this.position];
      if (!combinedIgnored.has(token2.type)) break;
      this.position++;
      this.stats.tokensProcessed++;
    }
  }
  addError(error2) {
    if (this.settings.errorRecovery.maxErrors > 0 && this.errors.length >= this.settings.errorRecovery.maxErrors) {
      return;
    }
    const isDuplicate = this.errors.some(
      (existing) => existing.message === error2.message && existing.position.line === error2.position.line && existing.position.col === error2.position.col
    );
    if (!isDuplicate) {
      this.errors.push(__spreadProps(__spreadValues({}, error2), {
        severity: error2.severity || "error"
      }));
      if (this.settings.debug) {
        this.debug(`Parse Error: ${error2.message} at ${error2.position.line}:${error2.position.col}`);
      }
    }
  }
  debug(...args) {
    if (this.settings.debug) {
      console.log(`[Parser]`, ...args);
    }
  }
  // ════ Initialization and Validation ════
  validateInput(rules, settings) {
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      throw new Error("Rules must be a non-empty array");
    }
    if (!settings || typeof settings !== "object") {
      throw new Error("Settings must be an object");
    }
    if (!settings.startRule || typeof settings.startRule !== "string") {
      throw new Error("Settings must specify a valid startRule");
    }
  }
  normalizeSettings(settings) {
    var _a, _b, _c;
    return {
      startRule: settings.startRule,
      errorRecovery: {
        mode: ((_a = settings.errorRecovery) == null ? void 0 : _a.mode) || "strict",
        maxErrors: ((_b = settings.errorRecovery) == null ? void 0 : _b.maxErrors) || 10,
        syncTokens: ((_c = settings.errorRecovery) == null ? void 0 : _c.syncTokens) || []
      },
      ignored: settings.ignored || ["ws"],
      debug: settings.debug || false,
      maxDepth: Math.max(1, settings.maxDepth || 1e3),
      enableMemoization: settings.enableMemoization !== false,
      maxCacheSize: settings.maxCacheSize || 1e3,
      enableProfiling: settings.enableProfiling || false
    };
  }
  validateGrammar() {
    const issues = [];
    const ruleNames = new Set(Array.from(this.rules.keys()));
    for (const [ruleName, rule2] of this.rules) {
      const referencedRules = this.extractRuleReferences(rule2.pattern);
      for (const ref of referencedRules) {
        if (!ruleNames.has(ref)) {
          issues.push(`Rule '${ruleName}' references undefined rule '${ref}'`);
        }
      }
      if (this.hasDirectLeftRecursion(rule2)) {
        issues.push(`Rule '${ruleName}' has direct left recursion`);
      }
    }
    if (!this.rules.has(this.settings.startRule)) {
      issues.push(`Start rule '${this.settings.startRule}' is not defined`);
    }
    return issues;
  }
  extractRuleReferences(pattern) {
    const refs = [];
    switch (pattern.type) {
      case "rule":
        refs.push(pattern.name);
        break;
      case "seq":
      case "choice":
        for (const p of pattern.patterns) {
          refs.push(...this.extractRuleReferences(p));
        }
        break;
      case "repeat":
        refs.push(...this.extractRuleReferences(pattern.pattern));
        if (pattern.separator) {
          refs.push(...this.extractRuleReferences(pattern.separator));
        }
        break;
      case "optional":
        refs.push(...this.extractRuleReferences(pattern.pattern));
        break;
    }
    return refs;
  }
  hasDirectLeftRecursion(rule2) {
    return this.checkLeftRecursion(rule2.pattern, rule2.name, /* @__PURE__ */ new Set());
  }
  checkLeftRecursion(pattern, ruleName, visited) {
    if (visited.has(ruleName)) {
      return false;
    }
    visited.add(ruleName);
    switch (pattern.type) {
      case "rule":
        return pattern.name === ruleName;
      case "seq":
        return pattern.patterns.length > 0 && this.checkLeftRecursion(pattern.patterns[0], ruleName, visited);
      case "choice":
        return pattern.patterns.some((p) => this.checkLeftRecursion(p, ruleName, visited));
      case "optional":
        return this.checkLeftRecursion(pattern.pattern, ruleName, visited);
      default:
        return false;
    }
  }
  // ════ Resource Management ════
  resetState(tokens) {
    this.tokens = tokens;
    this.position = 0;
    this.errors = [];
    this.ast = [];
    this.depth = 0;
    this.stats = {
      tokensProcessed: 0,
      rulesApplied: 0,
      errorsRecovered: 0,
      parseTimeMs: 0
    };
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  createResult() {
    this.stats.parseTimeMs = Date.now() - this.startTime;
    if (this.settings.enableProfiling) {
      this.stats.cacheHitRate = this.cacheHits + this.cacheMisses > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0;
      this.stats.memoryUsedKB = Math.round(
        (this.memoCache.size * 100 + this.nodePool.length * 50) / 1024
      );
    }
    return {
      ast: this.ast,
      errors: this.errors,
      statistics: this.settings.enableProfiling ? this.stats : void 0
    };
  }
  /**
   * Clears internal caches and resets parser state.
   * Call this periodically for long-running applications.
   */
  clearCaches() {
    this.memoCache.clear();
    this.nodePool = [];
    this.debug("Caches cleared");
  }
  /**
   * Returns current cache statistics
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.memoCache.size,
      hitRate: total > 0 ? this.cacheHits / total : 0
    };
  }
  /**
   * Disposes of the parser and frees resources.
   * Parser cannot be reused after calling this method.
   */
  dispose() {
    this.clearCaches();
    this.rules.clear();
    this.ignoredSet.clear();
    this.ruleSet.clear();
    this.tokens = [];
    this.ast = [];
    this.errors = [];
    this.disposed = true;
    this.debug("Parser disposed");
  }
};
function parse(tokens, rules, settings) {
  if (!tokens || tokens.length === 0) {
    return { ast: [], errors: [] };
  }
  const defaultSettings = {
    startRule: "root",
    errorRecovery: {
      mode: "strict",
      maxErrors: 10,
      syncTokens: []
    },
    ignored: ["ws"],
    // commonly ignored whitespace
    debug: false,
    maxDepth: 1e3,
    enableMemoization: true,
    maxCacheSize: 1e3,
    enableProfiling: false
  };
  const mergedSettings = __spreadValues(__spreadValues({}, defaultSettings), settings);
  if (settings == null ? void 0 : settings.errorRecovery) {
    mergedSettings.errorRecovery = __spreadValues(__spreadValues({}, defaultSettings.errorRecovery), settings.errorRecovery);
  }
  const parser = new Parser(rules, mergedSettings);
  try {
    return parser.parse(tokens);
  } finally {
    if (!(settings == null ? void 0 : settings.enableMemoization)) {
      parser.dispose();
    }
  }
}
function createParser(rules, settings) {
  const defaultSettings = {
    startRule: "root",
    errorRecovery: {
      mode: "strict",
      maxErrors: 10,
      syncTokens: []
    },
    ignored: ["ws"],
    debug: false,
    maxDepth: 1e3,
    enableMemoization: true,
    maxCacheSize: 1e3,
    enableProfiling: false
  };
  const mergedSettings = __spreadValues(__spreadValues({}, defaultSettings), settings);
  if (settings == null ? void 0 : settings.errorRecovery) {
    mergedSettings.errorRecovery = __spreadValues(__spreadValues({}, defaultSettings.errorRecovery), settings.errorRecovery);
  }
  return new Parser(rules, mergedSettings);
}
function validateGrammar(rules, startRule) {
  try {
    const tempSettings = {
      startRule: startRule || "root",
      errorRecovery: { mode: "strict", maxErrors: 1, syncTokens: [] },
      ignored: [],
      debug: false,
      maxDepth: 1e3,
      enableMemoization: false,
      maxCacheSize: 0,
      enableProfiling: false
    };
    const parser = new Parser(rules, tempSettings);
    parser.dispose();
    return [];
  } catch (error2) {
    return [error2.message];
  }
}
function createRule(name, pattern, options) {
  if (!name || typeof name !== "string") {
    throw new Error("Rule name must be a non-empty string");
  }
  if (!pattern || typeof pattern !== "object") {
    throw new Error("Rule pattern must be an object");
  }
  return { name, pattern, options };
}
function token(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Token name must be a non-empty string");
  }
  return { type: "token", name };
}
function rule(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Rule name must be a non-empty string");
  }
  return { type: "rule", name };
}
function seq(...patterns) {
  if (patterns.length === 0) {
    throw new Error("Sequence must have at least one pattern");
  }
  return { type: "seq", patterns };
}
function choice(...patterns) {
  if (patterns.length === 0) {
    throw new Error("Choice must have at least one pattern");
  }
  return { type: "choice", patterns };
}
function repeat(pattern, min = 0, max = Infinity, separator) {
  if (min < 0) {
    throw new Error("Minimum repetition count cannot be negative");
  }
  if (max < min) {
    throw new Error("Maximum repetition count cannot be less than minimum");
  }
  return { type: "repeat", pattern, min, max, separator };
}
function optional(pattern) {
  return { type: "optional", pattern };
}
function oneOrMore(pattern, separator) {
  return repeat(pattern, 1, Infinity, separator);
}
function zeroOrMore(pattern, separator) {
  return repeat(pattern, 0, Infinity, separator);
}
function error(condition, message, suggestions = [], code, severity = "error") {
  return { condition, message, suggestions, code, severity };
}
var errorRecoveryStrategies = {
  /**
   * Panic mode recovery - skip to synchronization tokens
   */
  panicMode() {
    return { type: "panic" };
  },
  /**
   * Skip until specific tokens are found
   */
  skipUntil(tokens) {
    return {
      type: "skipUntil",
      tokens: Array.isArray(tokens) ? tokens : [tokens]
    };
  },
  /**
   * Virtual token insertion (doesn't modify token stream)
   */
  insertToken(token2, value) {
    return {
      type: "insertToken",
      token: token2,
      insertValue: value
    };
  },
  /**
   * Skip the current token
   */
  deleteToken() {
    return { type: "deleteToken" };
  }
};
var contextConditions = {
  /**
   * Condition for when a specific token is missing
   */
  missingToken(tokenName) {
    return (parser, failedAt) => {
      return failedAt >= 0;
    };
  },
  /**
   * Condition for when an unexpected token is encountered
   */
  unexpectedToken(tokenName) {
    return (parser, failedAt) => {
      return failedAt >= 0;
    };
  },
  /**
   * Condition for premature end of input
   */
  prematureEnd() {
    return (parser, failedAt) => {
      return failedAt >= 0;
    };
  },
  /**
   * Custom condition based on parser state
   */
  custom(predicate) {
    return predicate;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Parser,
  choice,
  contextConditions,
  createParser,
  createRule,
  error,
  errorRecoveryStrategies,
  oneOrMore,
  optional,
  parse,
  repeat,
  rule,
  seq,
  token,
  validateGrammar,
  zeroOrMore
});
//# sourceMappingURL=parser.js.map