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
  ERRORS: () => ERRORS,
  Parser: () => Parser,
  choice: () => choice,
  createRule: () => createRule,
  error: () => error,
  errorRecoveryStrategies: () => errorRecoveryStrategies,
  getMatchesSpan: () => getMatchesSpan,
  getOptional: () => getOptional,
  isOptionalPassed: () => isOptionalPassed,
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
var ERRORS = {
  // Core parsing errors
  LEXICAL_ERROR: "LEXICAL_ERROR",
  TOKEN_EXPECTED_EOF: "TOKEN_EXPECTED_EOF",
  TOKEN_MISMATCH: "TOKEN_MISMATCH",
  RULE_FAILED: "RULE_FAILED",
  BUILD_FUNCTION_FAILED: "BUILD_FUNCTION_FAILED",
  REPEAT_MIN_NOT_MET: "REPEAT_MIN_NOT_MET",
  SEQUENCE_FAILED: "SEQUENCE_FAILED",
  CUSTOM_ERROR: "CUSTOM_ERROR",
  // Choice and alternatives
  CHOICE_ALL_FAILED: "CHOICE_ALL_FAILED",
  // System errors
  FATAL_ERROR: "FATAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  // Recovery and validation
  RECOVERY_CUSTOM: "RECOVERY_CUSTOM"
};
var Parser = class {
  constructor(rules, settings) {
    // State
    this.tokens = [];
    this.ast = [];
    this.errors = [];
    this.index = 0;
    this.depth = 0;
    this.indentLevel = 0;
    this.startTime = 0;
    this.errorSeq = 0;
    // Performance
    this.memoCache = /* @__PURE__ */ new Map();
    this.ignoredSet = /* @__PURE__ */ new Set();
    this.memoHits = 0;
    this.memoMisses = 0;
    // Context tracking
    this.silentContextStack = [];
    this.lastVisitedIndex = 0;
    this.lastHandledRule = "unknown";
    this.ruleStack = [];
    this.patternStack = [];
    this.lastInnerRule = "unknown";
    this.lastCompletedRule = "unknown";
    this.successfulRules = [];
    this.globalSuccessRules = [];
    this.lastLeafRule = "unknown";
    this.rules = new Map(rules.map((rule2) => [rule2.name, rule2]));
    this.settings = this.normalizeSettings(settings);
    this.debugLevel = this.settings.debug;
    this.ignoredSet = new Set(this.settings.ignored);
    this.stats = { tokensProcessed: 0, rulesApplied: 0, errorsRecovered: 0, parseTimeMs: 0 };
    const grammarIssues = this.validateGrammar();
    if (grammarIssues.length > 0) {
      throw new Error(`Grammar validation failed: ${grammarIssues.join(", ")}`);
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  parse(tokens) {
    this.resetState(tokens);
    this.startTime = Date.now();
    this.log("rules", `\u{1F680} Parse started: ${tokens.length} tokens`);
    if (!(tokens == null ? void 0 : tokens.length)) return { ast: [], errors: [] };
    const errorToken = tokens.find((token2) => token2.kind === "error");
    if (errorToken) {
      return {
        ast: [],
        errors: [this.createError(ERRORS.LEXICAL_ERROR, `Unexpected token '${errorToken.value}'`, errorToken.span, 0, 0, this.lastHandledRule)]
      };
    }
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
    this.stats.parseTimeMs = Date.now() - this.startTime;
    this.log("rules", `\u2705 Parse completed: ${this.ast.length} nodes, ${this.errors.length} errors (${this.stats.parseTimeMs}ms)`);
    this.log("verbose", `\u{1F4CA} Memo stats: ${this.memoHits} hits, ${this.memoMisses} misses, ${this.memoCache.size} cached entries`);
    return {
      ast: this.ast,
      errors: this.errors,
      statistics: this.stats
    };
  }
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
        if (this.settings.errorRecovery.mode === "resilient") {
          this.applyRecovery(startRule, beforeIndex);
          if (this.index === beforeIndex && this.index < this.tokens.length) {
            this.index++;
          }
        } else {
          break;
        }
        if (consecutiveErrors > 10) {
          break;
        }
      }
      this.skipIgnored();
    }
  }
  parsePattern(pattern, parentRule) {
    var _a;
    this.lastHandledRule = pattern.type;
    if (this.depth > this.settings.maxDepth) {
      throw new Error("Maximum parsing depth exceeded");
    }
    const shouldBeSilent = this.shouldBeSilent(pattern, parentRule);
    const isOptionalContext = (parentRule == null ? void 0 : parentRule.name) === "optional" || this.patternStack[this.patternStack.length - 1] === "optional";
    this.silentContextStack.push(shouldBeSilent || isOptionalContext);
    const startIndex = this.index;
    const memoKey = this.shouldUseMemoization(pattern, parentRule) ? this.createMemoKey(pattern.type, pattern, startIndex, parentRule == null ? void 0 : parentRule.name) : null;
    if (memoKey) {
      const memoResult = this.getMemoized(memoKey);
      if (memoResult.hit) {
        this.index = memoResult.newIndex;
        this.silentContextStack.pop();
        this.log("verbose", `\u{1F50B} Memo HIT: ${memoKey} \u2192 ${memoResult.newIndex}`);
        return memoResult.result;
      }
    }
    this.indentLevel++;
    this.log("patterns", `${"  ".repeat(this.indentLevel)}\u26A1 ${pattern.type}${parentRule ? ` (${parentRule.name})` : ""}${shouldBeSilent ? " [SILENT]" : ""} @${this.index}`);
    this.depth++;
    let result = null;
    try {
      this.skipIgnored((_a = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _a.ignored);
      result = this.executePattern(pattern, parentRule, shouldBeSilent);
      const status = result !== null ? "\u2713" : "\u2717";
      this.log("patterns", `${"  ".repeat(this.indentLevel)}${status} ${pattern.type} \u2192 ${this.index}`);
      if (memoKey && !isOptionalContext) {
        this.memoize(memoKey, result, startIndex, this.index);
      }
      return result;
    } catch (error2) {
      if (isOptionalContext) {
        this.index = startIndex;
        this.log("patterns", `${"  ".repeat(this.indentLevel)}\u2717 ${pattern.type} (optional context, suppressed) \u2192 ${startIndex}`);
        return null;
      }
      throw error2;
    } finally {
      this.depth--;
      this.indentLevel--;
      this.silentContextStack.pop();
    }
  }
  executePattern(pattern, parentRule, shouldBeSilent) {
    switch (pattern.type) {
      case "token":
        return this.parseToken(pattern.name, parentRule, shouldBeSilent);
      case "rule":
        return this.parseRule(pattern.name, parentRule, shouldBeSilent);
      case "repeat":
        return this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, parentRule, shouldBeSilent);
      case "seq":
        return this.parseSequence(pattern.patterns, parentRule, shouldBeSilent);
      case "choice":
        return this.parseChoice(pattern.patterns, parentRule, shouldBeSilent);
      case "optional":
        return this.parseOptional(pattern.pattern, parentRule);
      default:
        throw new Error(`Unknown pattern type: ${pattern.type}`);
    }
  }
  parseToken(tokenName, parentRule, shouldBeSilent) {
    this.lastHandledRule = (parentRule == null ? void 0 : parentRule.name) || tokenName;
    this.log("tokens", `\u2192 ${tokenName} @${this.index}`);
    this.lastVisitedIndex = this.index;
    if (this.index >= this.tokens.length) {
      this.log("tokens", `\u2717 Expected '${tokenName}', got 'EOF' @${this.index}`);
      if (shouldBeSilent) return null;
      const error3 = this.createError(
        ERRORS.TOKEN_EXPECTED_EOF,
        `Expected '${tokenName}', got 'EOF'`,
        this.getCurrentSpan(),
        0,
        this.index,
        this.lastHandledRule,
        this.getInnerMostRule()
      );
      this.handleParseError(error3, parentRule);
    }
    const token2 = this.getCurrentToken();
    if (token2.kind === tokenName) {
      const consumedToken = __spreadValues({}, token2);
      this.index++;
      this.stats.tokensProcessed++;
      this.log("tokens", `\u2713 ${tokenName} = "${token2.value}" @${this.index - 1}`);
      return consumedToken;
    }
    this.log("tokens", `\u2717 Expected '${tokenName}', got '${token2.kind}' @${this.lastVisitedIndex}`);
    if (shouldBeSilent) return null;
    const error2 = this.createError(
      ERRORS.TOKEN_MISMATCH,
      `Expected '${tokenName}', got '${token2.kind}'`,
      this.getCurrentSpan(),
      0,
      this.lastVisitedIndex,
      this.lastHandledRule,
      this.getInnerMostRule(true)
    );
    this.handleParseError(error2, parentRule);
  }
  parseRule(ruleName, parentRule, shouldBeSilent) {
    var _a;
    this.lastHandledRule = ruleName;
    this.ruleStack.push(ruleName);
    this.patternStack.push("rule");
    this.lastInnerRule = ruleName;
    this.log("rules", `\u2192 ${ruleName} @${this.index} [Stack: ${this.ruleStack.join(" \u2192 ")}]`);
    this.lastVisitedIndex = this.index;
    const targetRule = this.rules.get(ruleName);
    if (!targetRule) {
      this.ruleStack.pop();
      this.patternStack.pop();
      const error2 = new Error(`Rule '${ruleName}' not found`);
      this.handleFatalError(error2);
      return null;
    }
    const startIndex = this.index;
    const savedErrors = [...this.errors];
    const savedSuccessfulRules = [...this.successfulRules];
    try {
      this.stats.rulesApplied++;
      const result = this.parsePattern(targetRule.pattern, targetRule);
      if (result === null) {
        this.successfulRules = savedSuccessfulRules;
        if (shouldBeSilent) {
          this.log("rules", `\u2717 ${ruleName} (silent) @${this.lastVisitedIndex}`);
          this.ruleStack.pop();
          this.patternStack.pop();
          return null;
        }
        const error2 = this.createError(
          ERRORS.RULE_FAILED,
          `Rule '${ruleName}' failed to match`,
          this.getCurrentSpan(),
          0,
          this.lastVisitedIndex,
          this.lastHandledRule,
          this.getInnerMostRule(true)
        );
        this.ruleStack.pop();
        this.patternStack.pop();
        this.handleParseError(error2, parentRule);
      }
      let finalResult = result;
      if (result !== null && ((_a = targetRule.options) == null ? void 0 : _a.build)) {
        finalResult = this.safeBuild(targetRule.options.build, result);
      }
      this.log("rules", `\u2713 RULE \u2192 ${ruleName} @${this.lastVisitedIndex}`);
      this.lastCompletedRule = ruleName;
      this.successfulRules.push(ruleName);
      this.globalSuccessRules.push(ruleName);
      this.updateLeafRule(ruleName);
      this.trimSuccessfulRules();
      this.ruleStack.pop();
      this.patternStack.pop();
      return finalResult;
    } catch (e) {
      this.successfulRules = savedSuccessfulRules;
      this.ruleStack.pop();
      this.patternStack.pop();
      if (shouldBeSilent) {
        this.index = startIndex;
        this.errors = savedErrors;
        return null;
      }
      if (e instanceof Error) {
        this.handleFatalError(e);
      } else {
        const error2 = this.createError(
          e.code,
          e.msg,
          e.span,
          e.failedAt,
          e.tokenIndex,
          e.prevRule,
          this.getInnerMostRule()
        );
        this.handleParseError(error2, parentRule);
      }
    }
  }
  parseOptional(pattern, parentRule) {
    this.lastHandledRule = "optional";
    this.log("verbose", `OPTIONAL @${this.index}`);
    this.lastVisitedIndex = this.index;
    const startIndex = this.index;
    const savedErrors = [...this.errors];
    try {
      const result = this.parsePattern(pattern, parentRule);
      if (result !== null) {
        this.log("verbose", `\u2713 OPTIONAL \u2192 [1 element] @${this.index}`);
        return [result];
      } else {
        this.index = startIndex;
        this.errors = savedErrors;
        this.log("verbose", `\u2713 OPTIONAL \u2192 [] (pattern returned null) @${this.index}`);
        return [];
      }
    } catch (e) {
      this.index = startIndex;
      this.errors = savedErrors;
      this.log("verbose", `\u2713 OPTIONAL \u2192 [] (exception caught: ${e.msg || e}) @${this.index}`);
      return [];
    }
  }
  parseRepeat(pattern, min = 0, max = Infinity, separator, parentRule, shouldBeSilent) {
    var _a, _b;
    this.lastHandledRule = pattern.type;
    this.log("verbose", `REPEAT(${min}-${max}) @${this.index}`);
    this.lastVisitedIndex = this.index;
    const results = [];
    let consecutiveFailures = 0;
    const startIndex = this.index;
    while (results.length < max && this.index < this.tokens.length) {
      const iterationStart = this.index;
      const savedErrors = [...this.errors];
      try {
        const result = this.parsePattern(pattern, parentRule);
        if (result === null) {
          this.errors = savedErrors;
          if (results.length >= min) {
            break;
          } else if (shouldBeSilent || pattern.silent) {
            break;
          } else {
            consecutiveFailures++;
            if (consecutiveFailures > 3) break;
            if ((_a = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _a.recovery) {
              this.applyRecovery(parentRule, iterationStart);
              if (this.index === iterationStart) {
                this.index++;
              }
              continue;
            } else {
              break;
            }
          }
        }
        consecutiveFailures = 0;
        results.push(result);
        if (this.index === iterationStart) {
          this.log("verbose", `\u26A0\uFE0F No progress in repeat iteration, breaking @${this.index}`);
          break;
        }
        if (separator && results.length < max && this.index < this.tokens.length) {
          const sepStart = this.index;
          const sepSavedErrors = [...this.errors];
          try {
            const sepResult = this.parsePattern(separator, void 0);
            if (sepResult === null) {
              this.index = sepStart;
              this.errors = sepSavedErrors;
              break;
            }
          } catch (e) {
            this.index = sepStart;
            this.errors = sepSavedErrors;
            break;
          }
        }
      } catch (e) {
        consecutiveFailures++;
        this.index = iterationStart;
        this.errors = savedErrors;
        if (shouldBeSilent || results.length >= min) {
          break;
        }
        throw e;
      }
    }
    if (results.length < min) {
      if (shouldBeSilent) {
        return null;
      }
      if ((_b = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _b.errors) {
        const customError = this.getCustomErrorForCondition(parentRule, 0, this.index, startIndex);
        if (customError) {
          throw customError;
        }
      }
      const error2 = this.createError(
        ERRORS.REPEAT_MIN_NOT_MET,
        `Expected at least ${min} occurrences, got ${results.length}`,
        this.getCurrentSpan(),
        0,
        this.index,
        this.lastHandledRule
      );
      throw error2;
    }
    this.log("verbose", `REPEAT \u2192 [${results.length}] @${this.index}`);
    if (results.length === 0) {
      return min === 0 ? [] : null;
    }
    return results.length === 1 && min === 1 && max === 1 ? results[0] : results;
  }
  parseChoice(patterns, parentRule, shouldBeSilent) {
    this.log("verbose", `CHOICE[${patterns.length}] @${this.index}`);
    this.lastVisitedIndex = this.index;
    const startIndex = this.index;
    const savedErrors = [...this.errors];
    let bestResult = null;
    for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
      this.index = startIndex;
      this.errors = [...savedErrors];
      try {
        const result = this.parsePattern(patterns[patternIndex], parentRule);
        if (result !== null) {
          this.log("verbose", `\u2713 CHOICE \u2192 alt ${patternIndex + 1}/${patterns.length} succeeded @${this.lastVisitedIndex}`);
          return result;
        }
        const progress = this.lastVisitedIndex - startIndex;
        const currentErrors = this.errors.slice(savedErrors.length);
        this.log("verbose", `\u2717 CHOICE \u2192 alt ${patternIndex + 1} failed, errors=${currentErrors.length}, progress=${progress}`);
        if (!bestResult || progress > bestResult.progress || progress === bestResult.progress && currentErrors.length > 0) {
          bestResult = {
            index: this.index,
            errors: currentErrors,
            span: this.getCurrentSpan(),
            progress,
            patternIndex,
            failedAt: -1
          };
        }
      } catch (error3) {
        const progress = this.lastVisitedIndex - startIndex;
        const normalizedError = this.normalizeError(error3, this.getCurrentSpan());
        this.log("verbose", `\u2717 CHOICE \u2192 alt ${patternIndex + 1} threw error: ${normalizedError.msg}, progress=${progress}`);
        if (!bestResult || progress >= bestResult.progress && error3.failedAt > bestResult.failedAt) {
          bestResult = {
            index: this.lastVisitedIndex,
            errors: [normalizedError],
            span: normalizedError.span,
            progress,
            patternIndex,
            failedAt: normalizedError.failedAt || -1
          };
        }
      }
    }
    this.index = startIndex;
    this.errors = savedErrors;
    if (shouldBeSilent) return null;
    if (bestResult) {
      const bestError = bestResult.errors.length > 0 ? bestResult.errors[bestResult.errors.length - 1] : this.createError(
        ERRORS.CHOICE_ALL_FAILED,
        `Choice failed at alternative ${this.lastVisitedIndex + 1}`,
        bestResult.span,
        bestResult.failedAt,
        this.lastVisitedIndex,
        this.lastHandledRule
      );
      this.log("verbose", `\u2717 All alternatives failed. Best: pattern ${this.lastVisitedIndex}, progress ${bestResult.progress}, failedAt ${bestResult.failedAt}, error: ${bestError.msg}`);
      throw bestError;
    }
    const error2 = this.createError(
      ERRORS.CHOICE_ALL_FAILED,
      `Expected one of: ${patterns.map((p) => this.patternToString(p)).join(", ")}`,
      this.getCurrentSpan(),
      0,
      this.lastVisitedIndex,
      this.lastHandledRule
    );
    throw error2;
  }
  parseSequence(patterns, parentRule, shouldBeSilent) {
    var _a;
    this.log("verbose", `SEQUENCE[${patterns.length}] @${this.index}`);
    this.lastVisitedIndex = this.index;
    if (patterns.length === 0) return [];
    const startIndex = this.index;
    const savedErrors = [...this.errors];
    const results = [];
    let lastPatternIndex = 0;
    try {
      for (lastPatternIndex = 0; lastPatternIndex < patterns.length; lastPatternIndex++) {
        const pattern = patterns[lastPatternIndex];
        const beforePatternIndex = this.index;
        const result = this.parsePattern(pattern, parentRule);
        if (result === null) {
          if (shouldBeSilent) {
            this.index = startIndex;
            this.errors = savedErrors;
            return null;
          }
          const error2 = this.createError(
            ERRORS.SEQUENCE_FAILED,
            `Sequence failed at element ${lastPatternIndex + 1}/${patterns.length}`,
            this.getCurrentSpan(),
            lastPatternIndex,
            this.lastVisitedIndex,
            this.lastHandledRule
          );
          this.handleParseError(error2, parentRule);
        }
        results.push(result);
        if (this.index === beforePatternIndex && !pattern.silent) {
          this.log("verbose", `\u26A0\uFE0F  No progress at sequence element ${lastPatternIndex} @${this.lastVisitedIndex}`);
        }
        this.skipIgnored((_a = parentRule == null ? void 0 : parentRule.options) == null ? void 0 : _a.ignored);
      }
      this.log("verbose", `SEQUENCE \u2192 [${results.length}] @${this.lastVisitedIndex}`);
      return results;
    } catch (e) {
      this.index = startIndex;
      this.errors = savedErrors;
      if (!shouldBeSilent && !this.isInSilentMode()) {
        if (e instanceof Error) {
          this.handleFatalError(e);
        } else {
          const error2 = this.createError(e.code, e.msg, e.span, lastPatternIndex, this.lastVisitedIndex, this.lastHandledRule);
          this.handleParseError(error2, parentRule);
        }
      }
      return null;
    }
  }
  safeBuild(buildFn, matches) {
    try {
      const input = Array.isArray(matches) ? matches : [matches];
      return buildFn(input);
    } catch (error2) {
      if (!this.isInSilentMode()) {
        console.error(`Build function failed: ${JSON.stringify(matches, null, 2)}, lastVisitedIndex: ${this.lastVisitedIndex}, lastHandledRule: ${this.lastHandledRule}`);
        const buildError = this.createError(
          ERRORS.BUILD_FUNCTION_FAILED,
          `Build function failed: ${error2.message}`,
          this.getCurrentSpan(),
          0,
          this.lastVisitedIndex,
          this.lastHandledRule
        );
        this.addError(buildError);
        this.log("errors", `Build error: ${error2.message}`);
      }
      return matches;
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MODE ──────────────────────────────┐
  shouldBeSilent(pattern, rule2) {
    var _a;
    return ((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.silent) === true || pattern.silent === true || this.silentContextStack.length > 0 && this.silentContextStack[this.silentContextStack.length - 1];
  }
  isInSilentMode() {
    return this.silentContextStack.length > 0 && this.silentContextStack[this.silentContextStack.length - 1];
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  normalizeSettings(settings) {
    const defaultSettings = {
      startRule: "root",
      errorRecovery: {
        mode: "strict",
        maxErrors: 1
      },
      ignored: ["ws"],
      debug: "off",
      maxDepth: 1e3,
      maxCacheSize: 1
      // 1 MB
    };
    if (!settings) return defaultSettings;
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
      case "optional":
        refs.push(...this.extractRuleReferences(pattern.pattern));
        break;
      case "seq":
      case "choice":
        if (pattern.patterns) {
          for (const p of pattern.patterns) {
            refs.push(...this.extractRuleReferences(p));
          }
        }
        break;
    }
    return refs;
  }
  skipIgnored(ruleIgnored) {
    if (this.ignoredSet.size === 0 && !(ruleIgnored == null ? void 0 : ruleIgnored.length)) return;
    const combinedIgnored = ruleIgnored ? /* @__PURE__ */ new Set([...this.ignoredSet, ...ruleIgnored]) : this.ignoredSet;
    while (this.index < this.tokens.length) {
      const token2 = this.tokens[this.index];
      if (!combinedIgnored.has(token2.kind)) break;
      this.index++;
      this.stats.tokensProcessed++;
    }
  }
  skipUntilTokens(tokens) {
    if (tokens.length === 0) return;
    const tokenSet = new Set(tokens);
    const maxIterations = Math.min(1e4, this.tokens.length - this.index);
    let skipped = 0;
    while (this.index < this.tokens.length && skipped < maxIterations) {
      const currentToken = this.tokens[this.index];
      if (tokenSet.has(currentToken.kind)) {
        this.log("errors", `Found sync token '${currentToken.kind}' @${this.index}`);
        return;
      }
      this.index++;
      skipped++;
    }
  }
  deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item));
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
    this.ruleStack = [];
    this.patternStack = [];
    this.lastInnerRule = "unknown";
    this.lastCompletedRule = "unknown";
    this.successfulRules = [];
    this.globalSuccessRules = [];
    this.lastLeafRule = "unknown";
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
    return this.tokens[this.index].span;
  }
  patternToString(pattern) {
    switch (pattern.type) {
      case "token":
        return `'${pattern.name}'`;
      case "rule":
        return pattern.name;
      case "repeat":
        return `${this.patternToString(pattern.pattern)}...`;
      case "optional":
        return `${this.patternToString(pattern.pattern)}?`;
      case "choice":
        return `choice(${pattern.patterns.map((p) => this.patternToString(p)).join("|")})`;
      case "seq":
        return `seq(${pattern.patterns.map((p) => this.patternToString(p)).join(" ")})`;
      default:
        return pattern.type;
    }
  }
  updateLeafRule(ruleName) {
    if (ruleName !== "unknown" && !ruleName.includes("<") && !ruleName.includes("\u2192") && ruleName.length < 30 && !["Statement", "VariableDeclaration", "let <mut> name;"].includes(ruleName)) {
      this.lastLeafRule = ruleName;
      this.log("verbose", `\u{1F343} Updated lastLeafRule to: "${ruleName}"`);
    }
  }
  trimSuccessfulRules() {
    if (this.successfulRules.length > 10) {
      this.successfulRules = this.successfulRules.slice(-5);
    }
    if (this.globalSuccessRules.length > 20) {
      this.globalSuccessRules = this.globalSuccessRules.slice(-10);
    }
  }
  isNextToken(type, ignoredTokens) {
    const ignored = [...ignoredTokens != null ? ignoredTokens : [], ...this.settings.ignored];
    let currentIndex = this.index;
    while (currentIndex < this.tokens.length) {
      const currentToken = this.tokens[currentIndex];
      if (currentToken.kind === type) return true;
      if (ignored.includes(currentToken.kind)) {
        currentIndex++;
      } else {
        break;
      }
    }
    return false;
  }
  isPrevToken(type, startIndex = -1, ignoredTokens) {
    if (startIndex === -1) startIndex = this.index > 0 ? this.index : 0;
    const ignored = [...ignoredTokens != null ? ignoredTokens : [], ...this.settings.ignored];
    let currentIndex = startIndex - 1;
    while (currentIndex >= 0) {
      const currentToken = this.tokens[currentIndex];
      if (currentToken.kind === type) return true;
      if (ignored.includes(currentToken.kind)) {
        currentIndex--;
      } else {
        break;
      }
    }
    return false;
  }
  isPrevRule(name) {
    console.warn(`isPrevRule: ${JSON.stringify(this.lastHandledRule, null, 2)}`);
    return this.lastHandledRule === name;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── ERROR ──────────────────────────────┐
  createError(code, msg, span, failedAt, tokenIndex, prevRule, prevInnerRule) {
    return {
      code,
      msg,
      span: span || this.getCurrentSpan(),
      failedAt,
      tokenIndex,
      prevRule,
      prevInnerRule: prevInnerRule || this.getInnerMostRule()
    };
  }
  getCustomErrorOr(rule2, defaultError) {
    var _a;
    if (!((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.errors)) return defaultError;
    for (const errorHandler of rule2.options.errors) {
      let matches = false;
      if (typeof errorHandler.cond === "number") {
        matches = defaultError.failedAt === errorHandler.cond;
      } else if (typeof errorHandler.cond === "function") {
        try {
          const contextualInnerRule = this.getInnerMostRule(true);
          const opt = {
            failedAt: defaultError.failedAt,
            tokenIndex: defaultError.tokenIndex,
            prevRule: defaultError.prevRule,
            prevInnerRule: contextualInnerRule
          };
          matches = errorHandler.cond(this, opt);
        } catch (err) {
          console.error("Error in condition function:", err);
          matches = false;
        }
      }
      if (matches) {
        return this.createError(
          errorHandler.code || ERRORS.CUSTOM_ERROR,
          errorHandler.msg,
          defaultError.span,
          defaultError.failedAt,
          defaultError.tokenIndex,
          defaultError.prevRule,
          defaultError.prevInnerRule || this.getInnerMostRule(true)
        );
      }
    }
    return defaultError;
  }
  getInnerMostRule(forErrorCondition = false) {
    this.log("verbose", `\u{1F4CD} Rule context: stack=[${this.ruleStack.join(",")} as ${this.patternStack.join(",")}], recent=[${this.successfulRules.slice(-3).join(",")}], leaf=${this.lastLeafRule}, current=${this.lastHandledRule}`);
    if (forErrorCondition && this.lastLeafRule !== "unknown") {
      this.log("verbose", `\u{1F3AF} getInnerMostRule(forErrorCondition=true) using lastLeafRule: "${this.lastLeafRule}"`);
      return this.lastLeafRule;
    }
    if (this.ruleStack.length > 0) {
      return this.ruleStack[this.ruleStack.length - 1];
    }
    if (this.lastLeafRule !== "unknown") {
      return this.lastLeafRule;
    }
    const meaningfulRules = [...this.successfulRules, ...this.globalSuccessRules];
    for (let i = meaningfulRules.length - 1; i >= 0; i--) {
      const rule2 = meaningfulRules[i];
      if (this.isMeaningfulRule(rule2)) {
        return rule2;
      }
    }
    if (this.lastCompletedRule !== "unknown" && this.lastCompletedRule.length < 30) {
      return this.lastCompletedRule;
    }
    return this.lastInnerRule;
  }
  isMeaningfulRule(rule2) {
    return rule2 !== "unknown" && !rule2.includes("<") && !rule2.includes("\u2192") && rule2.length < 30 && !["Statement", "VariableDeclaration"].includes(rule2);
  }
  addError(error2) {
    if (this.isInSilentMode()) return;
    const maxErrors = this.settings.errorRecovery.maxErrors;
    if (maxErrors !== 0 && this.errors.length >= maxErrors) return;
    if (this.settings.errorRecovery.mode === "strict" && this.errors.length > 0) return;
    this.errors.push(error2);
    this.log("errors", `\u26A0\uFE0F  ${error2.msg} @${error2.span.start}:${error2.span.end}`);
  }
  handleParseError(error2, rule2) {
    const finalError = this.getCustomErrorOr(rule2, error2);
    throw finalError;
  }
  handleFatalError(error2) {
    const parseError = this.normalizeError(error2, this.getCurrentSpan());
    parseError.prevInnerRule = this.getInnerMostRule();
    this.addError(parseError);
    this.log("errors", `\u{1F4A5} Fatal error: ${parseError.msg} @${this.index}`);
  }
  normalizeError(error2, defaultSpan) {
    if (error2 && typeof error2 === "object" && "msg" in error2 && "code" in error2 && "span" in error2) {
      const parseError = error2;
      if (!parseError.prevInnerRule) {
        parseError.prevInnerRule = this.getInnerMostRule();
      }
      return parseError;
    }
    if (error2 instanceof Error) {
      return this.createError(
        ERRORS.FATAL_ERROR,
        error2.message,
        defaultSpan,
        0,
        this.lastVisitedIndex,
        this.lastHandledRule,
        this.getInnerMostRule()
      );
    }
    return this.createError(
      ERRORS.UNKNOWN_ERROR,
      `Unknown error: ${error2}`,
      defaultSpan,
      0,
      this.lastVisitedIndex,
      this.lastHandledRule,
      this.getInnerMostRule()
    );
  }
  applyRecovery(rule2, startIndex) {
    var _a;
    const recovery = (_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.recovery;
    if (recovery) {
      this.applyRecoveryStrategy(recovery);
    } else {
      this.skipIgnored();
      if (this.index < this.tokens.length) {
        this.index++;
      }
    }
    this.stats.errorsRecovered++;
    if (startIndex !== void 0 && this.index === startIndex && this.index < this.tokens.length) {
      this.index++;
    }
  }
  getCustomErrorForCondition(rule2, failedAt, tokenIndex, startIndex) {
    var _a;
    if (!((_a = rule2 == null ? void 0 : rule2.options) == null ? void 0 : _a.errors)) return null;
    for (const errorHandler of rule2.options.errors) {
      let matches = false;
      if (typeof errorHandler.cond === "number") {
        matches = failedAt === errorHandler.cond;
      } else if (typeof errorHandler.cond === "function") {
        try {
          const opt = {
            failedAt,
            tokenIndex,
            prevRule: rule2.name,
            prevInnerRule: this.getInnerMostRule(true)
          };
          matches = errorHandler.cond(this, opt);
        } catch (err) {
          console.error("Error in condition function:", err);
          matches = false;
        }
      }
      if (matches) {
        return this.createError(
          errorHandler.code || ERRORS.CUSTOM_ERROR,
          errorHandler.msg,
          this.getCurrentSpan(),
          failedAt,
          tokenIndex,
          rule2.name,
          this.getInnerMostRule(true)
        );
      }
    }
    return null;
  }
  applyRecoveryStrategy(strategy) {
    const beforePos = this.index;
    this.log("errors", `\u{1F527} Recovery: ${strategy.type} @${beforePos}`);
    switch (strategy.type) {
      case "skipUntil":
        const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
        this.skipUntilTokens(tokens);
        break;
      default:
    }
    this.log("errors", `Recovery: ${beforePos} \u2192 ${this.index}`);
  }
  // └────────────────────────────────────────────────────────────────────┘
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
    this.ruleStack = [];
    this.successfulRules = [];
    this.globalSuccessRules = [];
  }
  cleanMemoCache() {
    const entries = Array.from(this.memoCache.entries());
    const now = Date.now();
    const validEntries = entries.filter(([, value]) => {
      if (now - (value.cachedAt || 0) > 1e3) return false;
      if (value.errorCount !== this.errors.length) return false;
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
      case "optional":
        return `${baseKey}:optional`;
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
      if (this.isCachedResultValid(cached)) {
        this.memoHits++;
        this.log("verbose", `\u{1F4CB} Memo HIT: ${key} \u2192 ${cached.newIndex}`);
        return { hit: true, result: cached.result, newIndex: cached.newIndex };
      } else {
        this.memoCache.delete(key);
        this.log("verbose", `\u{1F5D1}\uFE0F Memo INVALID: ${key}`);
      }
    }
    this.memoMisses++;
    return { hit: false };
  }
  isCachedResultValid(cached) {
    if (typeof cached.newIndex !== "number" || cached.newIndex < 0) return false;
    if (cached.newIndex > this.tokens.length) return false;
    return true;
  }
  memoize(key, result, startIndex, endIndex) {
    if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) return;
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
      newIndex: endIndex,
      cachedAt: Date.now(),
      silentContext: this.isInSilentMode(),
      errorCount: this.errors.length
    };
    this.memoCache.set(key, memoEntry);
    this.log("verbose", `\u{1F4BE} Memo SET: ${key} \u2192 ${endIndex}`);
  }
  shouldUseMemoization(pattern, parentRule) {
    if (this.stats.errorsRecovered > 0 && this.errors.length > 0) return false;
    if (pattern.type === "token") return false;
    if (pattern.type === "rule" && this.isRecursiveContext()) return false;
    return pattern.type === "rule" || pattern.type === "choice" || pattern.type === "seq" || pattern.type === "optional" || pattern.type === "repeat" && (pattern.min > 1 || pattern.max > 1);
  }
  isRecursiveContext() {
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
var createRule = (name, pattern, options = {}) => {
  const finalOptions = __spreadValues({ name, silent: false }, options);
  return { name, pattern, options: finalOptions };
};
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
function optional(pattern, silent2 = false) {
  if (!pattern || typeof pattern !== "object") {
    throw new Error("Optional pattern must be a valid pattern");
  }
  return { type: "optional", pattern, silent: silent2 };
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
function silent(pattern) {
  return __spreadProps(__spreadValues({}, pattern), { silent: true });
}
function loud(pattern) {
  return __spreadProps(__spreadValues({}, pattern), { silent: false });
}
function error(cond, msg, code) {
  return { cond, msg, code: code != null ? code : ERRORS.RECOVERY_CUSTOM };
}
var errorRecoveryStrategies = {
  skipUntil(tokens) {
    return { type: "skipUntil", tokens: Array.isArray(tokens) ? tokens : [tokens] };
  }
};
function getMatchesSpan(matches) {
  const default_span = { start: 0, end: 0 };
  if (!matches || matches.length === 0) return default_span;
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
  return default_span;
}
function resWithoutSpan(res) {
  const result = __spreadValues({}, res);
  delete result.span;
  return result;
}
function isOptionalPassed(res) {
  return res.length > 0;
}
function getOptional(res, ret = void 0, index = 0, isSeq = false) {
  if (!isOptionalPassed(res)) return ret;
  if (isSeq && Array.isArray(res)) res = res[0];
  return res[index];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ERRORS,
  Parser,
  choice,
  createRule,
  error,
  errorRecoveryStrategies,
  getMatchesSpan,
  getOptional,
  isOptionalPassed,
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