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
  createRule: () => createRule,
  error: () => error,
  errorOrArrayOfOne: () => errorOrArrayOfOne,
  errorRecoveryStrategies: () => errorRecoveryStrategies,
  getMatchesSpan: () => getMatchesSpan,
  loud: () => loud,
  oneOrMore: () => oneOrMore,
  optional: () => optional,
  parse: () => parse,
  repeat: () => repeat,
  resWithoutSpan: () => resWithoutSpan,
  rule: () => rule,
  seq: () => seq,
  silent: () => silent,
  token: () => token,
  zeroOrMore: () => zeroOrMore,
  zeroOrOne: () => zeroOrOne
});
module.exports = __toCommonJS(parser_exports);
var Parser = class {
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── INIT ───────────────────────────────┐
  constructor(rules, settings) {
    // ..
    this.tokens = [];
    this.ast = [];
    this.errors = [];
    // ..
    this.index = 0;
    this.depth = 0;
    this.indentLevel = 0;
    this.startTime = 0;
    this.errorSeq = 0;
    // Performance optimizations
    this.memoCache = /* @__PURE__ */ new Map();
    this.ignoredSet = /* @__PURE__ */ new Set();
    // Memoization statistics
    this.memoHits = 0;
    this.memoMisses = 0;
    // Silent mode context stack - tracks when we're in silent parsing
    this.silentContextStack = [];
    this.rules = /* @__PURE__ */ new Map();
    rules.forEach((rule2) => this.rules.set(rule2.name, rule2));
    this.settings = this.normalizeSettings(settings);
    this.debugLevel = this.settings.debug;
    this.ignoredSet = /* @__PURE__ */ new Set([...this.settings.ignored]);
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
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── MAIN ───────────────────────────────┐
  parse(tokens) {
    {
      this.resetState(tokens);
      this.startTime = Date.now();
      this.log("rules", `\u{1F680} Parse started: ${tokens.length} tokens`);
    }
    {
      if (!(tokens == null ? void 0 : tokens.length)) {
        return { ast: [], errors: [] };
      }
      if (tokens.some((token2) => token2.type === "error")) {
        const errorToken = tokens.find((token2) => token2.type === "error");
        return {
          ast: [],
          errors: [this.createError(0, `Unexpected token '${errorToken == null ? void 0 : errorToken.value}'`, errorToken == null ? void 0 : errorToken.span)]
        };
      }
    }
    {
      try {
        const startRule = this.rules.get(this.settings.startRule);
        if (!startRule) {
          throw new Error(`Start rule '${this.settings.startRule}' not found`);
        }
        this.skipIgnored();
        this.parseWithRecovery(startRule);
        this.skipIgnored();
      } catch (err) {
        this.handleFatalError(err);
      }
    }
    {
      this.stats.parseTimeMs = Date.now() - this.startTime;
      this.log("rules", `\u2705 Parse completed: ${this.ast.length} nodes, ${this.errors.length} errors (${this.stats.parseTimeMs}ms)`);
      this.log("verbose", `\u{1F4CA} Memo stats: ${this.memoHits} hits, ${this.memoMisses} misses, ${this.memoCache.size} cached entries`);
      return {
        ast: this.ast,
        errors: this.errors,
        statistics: this.stats
      };
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── CORE ───────────────────────────────┐
  parseWithRecovery(startRule) {
    var _a;
    const maxErrors = this.settings.errorRecovery.maxErrors;
    let consecutiveErrors = 0;
    while (this.index < this.tokens.length && (maxErrors === 0 || this.errors.length < maxErrors)) {
      const beforeIndex = this.index;
      try {
        const result = this.parsePattern(startRule.pattern, startRule);
        if (result !== null) {
          const processed = ((_a = startRule.options) == null ? void 0 : _a.build) ? this.safeBuild(startRule.options.build, result) : result;
          if (processed !== null) {
            this.ast.push(processed);
          }
        }
        consecutiveErrors = 0;
        if (this.index >= this.tokens.length || this.index === beforeIndex) {
          break;
        }
      } catch (error2) {
        consecutiveErrors++;
        const parseError = this.normalizeError(error2, this.getCurrentSpan());
        this.addError(parseError);
        this.applyRecovery(startRule, beforeIndex);
        if (consecutiveErrors > 10 || this.index === beforeIndex) {
          if (this.index < this.tokens.length) {
            this.index++;
          } else {
            break;
          }
        }
        if (this.settings.errorRecovery.mode === "strict") {
          break;
        }
      }
      this.skipIgnored();
    }
  }
  parsePattern(pattern, parentRule) {
    var _a;
    if (this.depth > this.settings.maxDepth) {
      throw new Error("Maximum parsing depth exceeded");
    }
    const shouldBeSilent = this.shouldBeSilent(pattern, parentRule);
    this.silentContextStack.push(shouldBeSilent);
    const startIndex = this.index;
    const memoKey = this.createMemoKey(pattern.type, pattern, startIndex, parentRule == null ? void 0 : parentRule.name);
    let memoResult = { hit: false };
    const shouldUseMemo = this.shouldUseMemoization(pattern, parentRule);
    if (shouldUseMemo) {
      memoResult = this.getMemoized(memoKey);
      if (memoResult.hit) {
        this.index = memoResult.newIndex;
        this.silentContextStack.pop();
        return memoResult.result;
      }
    }
    this.indentLevel++;
    this.log("patterns", `${"  ".repeat(this.indentLevel)}\u27A4 ${pattern.type}${parentRule ? ` (${parentRule.name})` : ""}${shouldBeSilent ? " [SILENT]" : ""} @${this.index}`);
    this.depth++;
    let result = null;
    try {
      this.skipIgnored((_a = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _a.ignored);
      switch (pattern.type) {
        case "token":
          result = this.parseToken(pattern.name, parentRule, shouldBeSilent);
          break;
        case "rule":
          result = this.parseRule(pattern.name, parentRule, shouldBeSilent);
          break;
        case "repeat":
          result = this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, parentRule, shouldBeSilent);
          break;
        case "seq":
          result = this.parseSequence(pattern.patterns, parentRule, shouldBeSilent);
          break;
        case "choice":
          result = this.parseChoice(pattern.patterns, parentRule, shouldBeSilent);
          break;
        default:
          throw new Error(`Unknown pattern type: ${pattern.type}`);
      }
      const status = result !== null ? "\u2713" : "\u2717";
      this.log("patterns", `${"  ".repeat(this.indentLevel)}${status} ${pattern.type} \u2192 ${this.index}`);
      if (shouldUseMemo) {
        this.memoize(memoKey, result, startIndex, this.index);
      }
      return result;
    } finally {
      this.depth--;
      this.indentLevel--;
      this.silentContextStack.pop();
    }
  }
  parseToken(tokenName, parentRule, shouldBeSilent) {
    this.log("tokens", `\u2192 ${tokenName} @${this.index}`);
    if (this.index >= this.tokens.length) {
      this.log("tokens", `\u2717 Expected '${tokenName}', got 'EOF' @${this.index}`);
      if (shouldBeSilent || this.isInSilentMode()) {
        return null;
      }
      const error3 = this.createError(1, `Expected '${tokenName}', got 'EOF'`, this.getCurrentSpan());
      this.handleParseError(error3, parentRule, 0);
    }
    const token2 = this.getCurrentToken();
    if (token2.type === tokenName) {
      const consumedToken = __spreadValues({}, token2);
      this.index++;
      this.stats.tokensProcessed++;
      this.log("tokens", `\u2713 ${tokenName} = "${token2.value}" @${this.index - 1}`);
      return consumedToken;
    }
    this.log("tokens", `\u2717 Expected '${tokenName}', got '${token2.type}' @${this.index}`);
    if (shouldBeSilent || this.isInSilentMode()) {
      return null;
    }
    const error2 = this.createError(2, `Expected '${tokenName}', got '${token2.type}'`, this.getCurrentSpan());
    this.handleParseError(error2, parentRule, 0);
  }
  parseRule(ruleName, parentRule, shouldBeSilent) {
    var _a;
    this.log("rules", `\u2192 ${ruleName} @${this.index}`);
    const targetRule = this.rules.get(ruleName);
    if (!targetRule) {
      const error2 = new Error(`Rule '${ruleName}' not found`);
      this.handleFatalError(error2);
      return null;
    }
    const startIndex = this.index;
    const savedErrors = [...this.errors];
    try {
      this.stats.rulesApplied++;
      const result = this.parsePattern(targetRule.pattern, targetRule);
      if (result === null) {
        if (shouldBeSilent || this.isInSilentMode()) {
          this.log("rules", `\u2717 ${ruleName} (silent) @${this.index}`);
          return null;
        }
        const error2 = this.createError(3, `Rule '${ruleName}' failed to match`, this.getCurrentSpan());
        this.handleParseError(error2, parentRule, 0);
      }
      let finalResult = result;
      if (result !== null && ((_a = targetRule.options) == null ? void 0 : _a.build)) {
        finalResult = this.safeBuild(targetRule.options.build, result);
      }
      this.log("rules", `\u2713 ${ruleName} @${this.index}`);
      return finalResult;
    } catch (e) {
      if (shouldBeSilent || this.isInSilentMode()) {
        this.index = startIndex;
        this.errors = savedErrors;
        return null;
      }
      if (e instanceof Error) {
        this.handleFatalError(e);
      } else {
        const error2 = this.createError(e.code, e.msg, e.span);
        this.handleParseError(error2, parentRule, 0);
      }
    }
  }
  parseRepeat(pattern, min = 0, max = Infinity, separator, parentRule, shouldBeSilent) {
    this.log("verbose", `REPEAT(${min}-${max}) @${this.index}`);
    const results = [];
    const startIndex = this.index;
    while (results.length < max && this.index < this.tokens.length) {
      const iterationStart = this.index;
      const savedErrors = [...this.errors];
      try {
        const result = this.parsePattern(pattern, parentRule);
        if (result === null) {
          this.errors = savedErrors;
          if (shouldBeSilent || this.isInSilentMode() || pattern.silent || this.settings.errorRecovery.mode === "strict") {
            break;
          }
          this.applyRecovery(parentRule, iterationStart);
          if (this.index === iterationStart) {
            break;
          }
          continue;
        }
        results.push(result);
        if (this.index === iterationStart) {
          this.log("verbose", `\u26A0 No progress in repeat, breaking @${this.index}`);
          break;
        }
        if (separator && results.length < max && this.index < this.tokens.length) {
          const sepStart = this.index;
          const sepSavedErrors = [...this.errors];
          const sepResult = this.parsePattern(separator, void 0);
          if (sepResult === null) {
            this.index = sepStart;
            this.errors = sepSavedErrors;
            break;
          }
        } else if (separator && results.length >= max) {
          break;
        }
      } catch (e) {
        this.index = iterationStart;
        this.errors = savedErrors;
        if (shouldBeSilent || this.isInSilentMode()) {
          break;
        }
        if (this.settings.errorRecovery.mode === "strict" || results.length < min) {
          if (e instanceof Error) {
            this.handleFatalError(e);
          } else {
            const error2 = this.createError(e.code, e.msg, e.span);
            this.handleParseError(error2, parentRule, 0);
          }
        }
        this.applyRecovery(parentRule, iterationStart);
        if (this.index === iterationStart) {
          this.index++;
        }
      }
    }
    if (results.length < min) {
      const error2 = this.createError(
        5,
        `Expected at least ${min} occurrences, got ${results.length}`,
        this.getCurrentSpan()
      );
      if (shouldBeSilent || this.isInSilentMode()) {
        return null;
      }
      this.handleParseError(error2, parentRule, 0);
    }
    this.log("verbose", `REPEAT \u2192 [${results.length}] @${this.index}`);
    return results.length > 0 ? results : null;
  }
  parseChoice(patterns, parentRule, shouldBeSilent) {
    this.log("verbose", `CHOICE[${patterns.length}] @${this.index}`);
    const startPosition = this.index;
    const savedErrors = [...this.errors];
    let farthestIndex = this.index;
    let farthestError = null;
    for (let i = 0; i < patterns.length; i++) {
      this.index = startPosition;
      this.errors = savedErrors;
      try {
        const result = this.parsePattern(patterns[i], parentRule);
        if (result !== null) {
          this.log("verbose", `CHOICE \u2192 alt ${i + 1}/${patterns.length} succeeded @${this.index}`);
          return result;
        }
        if (this.index > farthestIndex) {
          farthestIndex = this.index;
          const newErrors = this.errors.slice(savedErrors.length);
          if (newErrors.length > 0) {
            farthestError = newErrors[newErrors.length - 1];
          }
        }
      } catch (error3) {
        if (this.index > farthestIndex) {
          farthestIndex = this.index;
          farthestError = this.normalizeError(error3, this.getCurrentSpan());
        }
      }
    }
    this.index = startPosition;
    this.errors = savedErrors;
    if (shouldBeSilent || this.isInSilentMode()) {
      return null;
    }
    const errorMsg = farthestError ? `No matching alternative found: ${farthestError.msg}` : `No matching pattern found in choice`;
    const error2 = this.createError(
      (farthestError == null ? void 0 : farthestError.code) || 9,
      errorMsg,
      this.getCurrentSpan()
    );
    this.handleParseError(error2, parentRule, 0);
  }
  parseSequence(patterns, parentRule, shouldBeSilent) {
    var _a;
    this.log("verbose", `SEQUENCE[${patterns.length}] @${this.index}`);
    if (patterns.length === 0) {
      return [];
    }
    const startPosition = this.index;
    const savedErrors = [...this.errors];
    const results = [];
    let lastPatternIndex = 0;
    try {
      for (lastPatternIndex = 0; lastPatternIndex < patterns.length; lastPatternIndex++) {
        const pattern = patterns[lastPatternIndex];
        const beforePatternIndex = this.index;
        const result = this.parsePattern(pattern, parentRule);
        if (result === null) {
          if (shouldBeSilent || this.isInSilentMode()) {
            this.index = startPosition;
            this.errors = savedErrors;
            return null;
          }
          const error2 = this.createError(
            6,
            `Sequence failed at element ${lastPatternIndex + 1}/${patterns.length}`,
            this.getCurrentSpan()
          );
          this.handleParseError(error2, parentRule, lastPatternIndex);
        }
        results.push(result);
        if (this.index === beforePatternIndex && !pattern.silent) {
          this.log("verbose", `\u26A0 No progress at sequence element ${lastPatternIndex} @${this.index}`);
        }
        this.skipIgnored((_a = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _a.ignored);
      }
      this.log("verbose", `SEQUENCE \u2192 [${results.length}] @${this.index}`);
      return results;
    } catch (e) {
      this.index = startPosition;
      this.errors = savedErrors;
      if (!shouldBeSilent && !this.isInSilentMode()) {
        if (e instanceof Error) {
          this.handleFatalError(e);
        } else {
          const error2 = this.createError(e.code, e.msg, e.span);
          this.handleParseError(error2, parentRule, lastPatternIndex);
        }
      }
      return null;
    }
  }
  safeBuild(buildFn, matches) {
    try {
      const input = Array.isArray(matches) ? matches : [matches];
      const result = buildFn(input);
      return result;
    } catch (error2) {
      if (!this.isInSilentMode()) {
        const buildError = this.createError(
          4,
          `Build function failed: ${error2.message}`,
          this.getCurrentSpan()
        );
        this.addError(buildError);
        this.log("errors", `Build error: ${error2.message}`);
      }
      return matches;
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── SILENT MODE ───────────────────────────────┐
  /**
   * Determines if a pattern should be parsed in silent mode
   */
  shouldBeSilent(pattern, rule2) {
    var _a;
    if (((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.silent) === true) {
      return true;
    }
    if (pattern.silent === true) {
      return true;
    }
    if (this.silentContextStack.length > 0) {
      return this.silentContextStack[this.silentContextStack.length - 1];
    }
    return false;
  }
  /**
   * Checks if we're currently in silent parsing mode
   */
  isInSilentMode() {
    return this.silentContextStack.length > 0 && this.silentContextStack[this.silentContextStack.length - 1];
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── HELP ───────────────────────────────┐
  normalizeSettings(settings) {
    const defaultSettings = {
      startRule: "root",
      errorRecovery: {
        mode: "strict",
        maxErrors: 1,
        syncTokens: []
      },
      ignored: ["ws"],
      debug: "off",
      maxDepth: 1e3,
      maxCacheSize: 1
    };
    if (!settings) {
      return defaultSettings;
    }
    const mergedSettings = __spreadValues(__spreadValues({}, defaultSettings), settings);
    if (settings == null ? void 0 : settings.errorRecovery) {
      mergedSettings.errorRecovery = __spreadValues(__spreadValues({}, defaultSettings.errorRecovery), settings.errorRecovery);
    }
    return mergedSettings;
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
      case "repeat":
        refs.push(...this.extractRuleReferences(pattern.pattern));
        if (pattern.separator) {
          refs.push(...this.extractRuleReferences(pattern.separator));
        }
        break;
    }
    return refs;
  }
  skipIgnored(ruleIgnored) {
    if (this.ignoredSet.size === 0 && !(ruleIgnored == null ? void 0 : ruleIgnored.length)) {
      return;
    }
    const combinedIgnored = ruleIgnored ? /* @__PURE__ */ new Set([...this.ignoredSet, ...ruleIgnored]) : this.ignoredSet;
    while (this.index < this.tokens.length) {
      const token2 = this.tokens[this.index];
      if (!combinedIgnored.has(token2.type)) break;
      this.index++;
      this.stats.tokensProcessed++;
    }
  }
  skipUntilTokens(tokens) {
    const tokenSet = new Set(tokens);
    const maxIterations = 1e4;
    let skipped = 0;
    while (this.index < this.tokens.length && skipped < maxIterations) {
      const currentToken = this.tokens[this.index];
      if (tokenSet.has(currentToken.type)) {
        this.log("errors", `Found sync token '${currentToken.type}' @${this.index}`);
        return;
      }
      this.index++;
      skipped++;
    }
  }
  deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }
    if (obj.type || obj.span || obj.value) {
      const cloned = {};
      for (const [key, value] of Object.entries(obj)) {
        cloned[key] = this.deepClone(value);
      }
      return cloned;
    }
    return obj;
  }
  resetState(tokens) {
    this.tokens = tokens;
    this.index = 0;
    this.errors = [];
    this.ast = [];
    this.depth = 0;
    this.errorSeq = 0;
    this.indentLevel = 0;
    this.silentContextStack = [];
    this.memoCache.clear();
    this.memoHits = 0;
    this.memoMisses = 0;
    this.stats = {
      tokensProcessed: 0,
      rulesApplied: 0,
      errorsRecovered: 0,
      parseTimeMs: 0
    };
  }
  getCurrentToken() {
    return this.tokens[this.index];
  }
  getCurrentSpan() {
    if (this.index === 0) {
      if (this.tokens.length > 0) {
        return {
          start: this.tokens[0].span.start,
          end: this.tokens[0].span.start
        };
      }
      return { start: 0, end: 0 };
    }
    if (this.index >= this.tokens.length) {
      const lastToken = this.tokens[this.tokens.length - 1];
      return {
        start: lastToken.span.end,
        end: lastToken.span.end
      };
    }
    const currentToken = this.tokens[this.index];
    return currentToken.span;
  }
  isNextToken(type, ignoredTokens) {
    ignoredTokens = [...ignoredTokens != null ? ignoredTokens : [], ...this.settings.ignored];
    let currentIndex = this.index;
    while (currentIndex < this.tokens.length) {
      const currentToken = this.tokens[currentIndex];
      if (currentToken.type == type) {
        return true;
      }
      if (ignoredTokens.includes(currentToken.type)) {
        currentIndex++;
      } else {
        break;
      }
    }
    return false;
  }
  isPrevToken(type, ignoredTokens) {
    ignoredTokens = [...ignoredTokens != null ? ignoredTokens : [], ...this.settings.ignored];
    let currentIndex = this.index - 1;
    while (currentIndex >= 0) {
      const currentToken = this.tokens[currentIndex];
      if (currentToken.type == type) {
        return true;
      }
      if (ignoredTokens.includes(currentToken.type)) {
        currentIndex--;
      } else {
        break;
      }
    }
    return false;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── ERROR ──────────────────────────────┐
  createError(code, msg, span) {
    return {
      code,
      msg,
      span: span || this.getCurrentSpan()
    };
  }
  addError(error2) {
    if (this.isInSilentMode()) {
      return;
    }
    const maxErrors = this.settings.errorRecovery.maxErrors;
    if (maxErrors !== 0 && this.errors.length >= maxErrors) {
      return;
    }
    if (this.settings.errorRecovery.mode === "strict" && this.errors.length > 0) {
      return;
    }
    this.errors.push(error2);
    this.log("errors", `\u26A0 ${error2.msg} @${error2.span.start}:${error2.span.end}`);
  }
  handleParseError(error2, rule2, failedAt = 0) {
    const finalError = this.getCustomErrorOr(rule2, error2, failedAt);
    throw finalError;
  }
  handleFatalError(error2) {
    const parseError = this.normalizeError(error2, this.getCurrentSpan());
    this.addError(parseError);
    this.log("errors", `\u{1F4A5} Fatal error: ${parseError.msg} @${this.index}`);
  }
  getCustomErrorOr(rule2, defaultError, failedAt = 0) {
    var _a;
    if (!((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.errors)) {
      return defaultError;
    }
    for (const errorHandler of rule2.options.errors) {
      let matches = false;
      if (typeof errorHandler.cond === "number") {
        matches = failedAt === errorHandler.cond;
      } else if (typeof errorHandler.cond === "function") {
        try {
          matches = errorHandler.cond(this, failedAt, false);
        } catch (e) {
          matches = false;
        }
      }
      if (matches) {
        return this.createError(
          errorHandler.code || 7,
          errorHandler.msg,
          defaultError.span
        );
      }
    }
    return defaultError;
  }
  normalizeError(error2, defaultSpan) {
    if (error2 && typeof error2 === "object" && "msg" in error2 && "code" in error2 && "span" in error2) {
      return error2;
    }
    if (error2 instanceof Error) {
      return this.createError(1028, error2.message, defaultSpan);
    }
    return this.createError(1280, `Unknown error: ${error2}`, defaultSpan);
  }
  applyRecovery(rule2, startIndex) {
    var _a;
    const recovery = (_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.recovery;
    if (recovery) {
      this.applyRecoveryStrategy(recovery);
    } else {
      this.defaultErrorRecovery();
    }
    this.stats.errorsRecovered++;
    if (startIndex !== void 0 && this.index === startIndex && this.index < this.tokens.length) {
      this.index++;
    }
  }
  applyRecoveryStrategy(strategy) {
    const beforePos = this.index;
    this.log("errors", `\u{1F527} Recovery: ${strategy.type} @${beforePos}`);
    switch (strategy.type) {
      case "panic":
        this.defaultErrorRecovery();
        break;
      case "skipUntil":
        const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
        this.skipUntilTokens(tokens);
        break;
      default:
        this.defaultErrorRecovery();
    }
    this.log("errors", `Recovery: ${beforePos} \u2192 ${this.index}`);
  }
  defaultErrorRecovery() {
    const syncTokens = this.settings.errorRecovery.syncTokens;
    if (syncTokens.length > 0) {
      this.skipUntilTokens(syncTokens);
    } else if (this.index < this.tokens.length) {
      this.index++;
    }
  }
  // └─────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── DEBUG ──────────────────────────────┐
  log(level, message) {
    if (this.debugLevel === "off") return;
    const levels = ["off", "errors", "rules", "patterns", "tokens", "verbose"];
    const currentIndex = levels.indexOf(this.debugLevel);
    const messageIndex = levels.indexOf(level);
    if (messageIndex <= currentIndex) {
      const prefix = this.getDebugPrefix(level);
      console.log(`${prefix} ${message}`);
    }
  }
  getDebugPrefix(level) {
    const prefixes = {
      errors: "\u{1F525}",
      rules: "\u{1F4CB}",
      patterns: "\u{1F50D}",
      tokens: "\u{1F3AF}",
      verbose: "\u{1F4DD}"
    };
    return `[${prefixes[level] || (level === "off" ? "\u26A1" : "")}]`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── CACHE ──────────────────────────────┐
  dispose() {
    this.memoCache.clear();
    this.rules.clear();
    this.ignoredSet.clear();
    this.tokens = [];
    this.ast = [];
    this.errors = [];
    this.silentContextStack = [];
  }
  cleanMemoCache() {
    const entries = Array.from(this.memoCache.entries());
    const now = Date.now();
    const validEntries = entries.filter(([key, value]) => {
      if (now - (value.cachedAt || 0) > 1e3) {
        return false;
      }
      if (value.errorCount !== this.errors.length) {
        return false;
      }
      return true;
    });
    const keepCount = Math.floor(validEntries.length / 2);
    this.memoCache.clear();
    for (let i = validEntries.length - keepCount; i < validEntries.length; i++) {
      this.memoCache.set(validEntries[i][0], validEntries[i][1]);
    }
    this.log("verbose", `\u{1F9F9} Memo cache cleaned: kept ${keepCount} of ${entries.length} entries`);
  }
  createMemoKey(patternType, patternData, position, ruleName) {
    var _a;
    const silentContext = this.isInSilentMode() ? "S" : "L";
    const errorContext = this.errors.length > 0 ? `E${this.errors.length}` : "E0";
    const baseKey = `${patternType}:${position}:${silentContext}:${errorContext}`;
    if (ruleName) {
      const rule2 = this.rules.get(ruleName);
      const ruleContext = this.getRuleContext(rule2);
      return `rule:${ruleName}:${ruleContext}:${baseKey}`;
    }
    switch (patternType) {
      case "token":
        return `${baseKey}:${patternData.name}`;
      case "repeat":
        return `${baseKey}:${patternData.min || 0}:${patternData.max || "inf"}:${patternData.separator ? "sep" : "nosep"}`;
      case "seq":
      case "choice":
        const patternHash = this.hashPatterns(patternData.patterns || []);
        return `${baseKey}:${((_a = patternData.patterns) == null ? void 0 : _a.length) || 0}:${patternHash}`;
      default:
        return baseKey;
    }
  }
  getRuleContext(rule2) {
    var _a, _b, _c, _d, _e;
    if (!rule2) return "none";
    const hasBuilder = ((_a = rule2.options) == null ? void 0 : _a.build) ? "B" : "";
    const hasErrors = ((_c = (_b = rule2.options) == null ? void 0 : _b.errors) == null ? void 0 : _c.length) ? "E" : "";
    const hasRecovery = ((_d = rule2.options) == null ? void 0 : _d.recovery) ? "R" : "";
    const isSilent = ((_e = rule2.options) == null ? void 0 : _e.silent) ? "S" : "";
    return `${hasBuilder}${hasErrors}${hasRecovery}${isSilent}`;
  }
  hashPatterns(patterns) {
    return patterns.map((p) => `${p.type}${p.silent ? "S" : ""}`).join("");
  }
  getMemoized(key) {
    if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {
      return { hit: false };
    }
    const cached = this.memoCache.get(key);
    if (cached !== void 0) {
      if (this.isCachedResultValid(cached, key)) {
        this.memoHits++;
        this.log("verbose", `\u{1F50B} Memo HIT: ${key} \u2192 ${cached.newIndex}`);
        return { hit: true, result: cached.result, newIndex: cached.newIndex };
      } else {
        this.memoCache.delete(key);
        this.log("verbose", `\u{1F5D1}\uFE0F Memo INVALID: ${key}`);
      }
    }
    this.memoMisses++;
    return { hit: false };
  }
  isCachedResultValid(cached, key) {
    if (typeof cached.newIndex !== "number" || cached.newIndex < 0) {
      return false;
    }
    if (cached.newIndex > this.tokens.length) {
      return false;
    }
    return true;
  }
  memoize(key, result, startIndex, endIndex) {
    if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {
      return;
    }
    if (result === null && startIndex === endIndex) {
      this.log("verbose", `\u26A0\uFE0F Skip memo (no progress): ${key}`);
      return;
    }
    if (this.errors.length > 0 && this.stats.errorsRecovered > 0) {
      this.log("verbose", `\u26A0\uFE0F Skip memo (error state): ${key}`);
      return;
    }
    if (this.memoCache.size >= this.settings.maxCacheSize * 0.9) {
      this.cleanMemoCache();
    }
    const memoEntry = {
      result: this.deepClone(result),
      // Clone to avoid reference issues
      newIndex: endIndex,
      // Store additional metadata for validation
      cachedAt: Date.now(),
      silentContext: this.isInSilentMode(),
      errorCount: this.errors.length
    };
    this.memoCache.set(key, memoEntry);
    this.log("verbose", `\u{1F4DD} Memo SET: ${key} \u2192 ${endIndex}`);
  }
  shouldUseMemoization(pattern, parentRule) {
    if (this.stats.errorsRecovered > 0 && this.errors.length > 0) {
      return false;
    }
    if (pattern.type === "token") {
      return false;
    }
    if (pattern.type === "rule" && this.isRecursiveContext(pattern.name)) {
      return false;
    }
    return pattern.type === "rule" || pattern.type === "choice" || pattern.type === "seq" || pattern.type === "repeat" && (pattern.min > 1 || pattern.max > 1);
  }
  isRecursiveContext(ruleName) {
    return this.depth > 10;
  }
  // └────────────────────────────────────────────────────────────────────┘
};
function parse(tokens, rules, settings) {
  const parser = new Parser(rules, settings);
  try {
    return parser.parse(tokens);
  } finally {
    parser.dispose();
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
function token(name, silent2 = false) {
  if (!name || typeof name !== "string") {
    throw new Error("Token name must be a non-empty string");
  }
  return { type: "token", name, silent: silent2 };
}
function rule(name, silent2 = false) {
  if (!name || typeof name !== "string") {
    throw new Error("Rule name must be a non-empty string");
  }
  return { type: "rule", name, silent: silent2 };
}
function repeat(pattern, min = 0, max = Infinity, separator, silent2 = false) {
  if (min < 0) {
    throw new Error("Minimum repetition count cannot be negative");
  }
  if (max < min) {
    throw new Error("Maximum repetition count cannot be less than minimum");
  }
  return { type: "repeat", pattern, min, max, separator, silent: silent2 };
}
function oneOrMore(pattern, separator, silent2 = false) {
  return repeat(pattern, 1, Infinity, separator, silent2);
}
function zeroOrMore(pattern, separator, silent2 = false) {
  return repeat(pattern, 0, Infinity, separator, silent2);
}
function zeroOrOne(pattern, separator, silent2 = true) {
  return repeat(pattern, 0, 1, separator, silent2);
}
function optional(pattern) {
  return repeat(pattern, 0, 1, void 0, true);
}
function choice(...patterns) {
  if (patterns.length === 0) {
    throw new Error("Choice must have at least one pattern");
  }
  return { type: "choice", patterns, silent: false };
}
function seq(...patterns) {
  if (patterns.length === 0) {
    throw new Error("Sequence must have at least one pattern");
  }
  return { type: "seq", patterns, silent: false };
}
function errorOrArrayOfOne(pattern, silent2 = false) {
  return repeat(pattern, 1, 1, void 0, silent2);
}
function silent(pattern) {
  return __spreadProps(__spreadValues({}, pattern), { silent: true });
}
function loud(pattern) {
  return __spreadProps(__spreadValues({}, pattern), { silent: false });
}
function error(cond, msg, code) {
  return { cond, msg, code: code != null ? code : 2457 };
}
var errorRecoveryStrategies = {
  panicMode() {
    return { type: "panic" };
  },
  skipUntil(tokens) {
    return { type: "skipUntil", tokens: Array.isArray(tokens) ? tokens : [tokens] };
  }
};
function getMatchesSpan(matches) {
  if (!matches || matches.length === 0) {
    return void 0;
  }
  let firstSpan = null;
  let lastSpan = null;
  for (const match of matches) {
    if (match && match.span) {
      if (!firstSpan) {
        firstSpan = match.span;
      }
      lastSpan = match.span;
    }
  }
  if (firstSpan && lastSpan) {
    return {
      start: firstSpan.start,
      end: lastSpan.end
    };
  }
  if (firstSpan) {
    return firstSpan;
  }
  return void 0;
}
function resWithoutSpan(res) {
  const result = __spreadValues({}, res);
  delete result.span;
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Parser,
  choice,
  createRule,
  error,
  errorOrArrayOfOne,
  errorRecoveryStrategies,
  getMatchesSpan,
  loud,
  oneOrMore,
  optional,
  parse,
  repeat,
  resWithoutSpan,
  rule,
  seq,
  silent,
  token,
  zeroOrMore,
  zeroOrOne
});
//# sourceMappingURL=parser.js.map