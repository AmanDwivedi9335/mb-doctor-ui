import assert from "node:assert";
import { normalizeMid, isValidMid } from "./mid.ts";

// normalize strips spaces and uppercases
assert.equal(normalizeMid("  m012 561 001001 "), "M012561001001");
assert.equal(normalizeMid("22052661001002"), "22052661001002");

// valid: 12-14 alphanumerics after normalizing
assert.equal(isValidMid("M012561001001"), true); // 13
assert.equal(isValidMid("22052661001002"), true); // 14
assert.equal(isValidMid("2205266100100"), true); // 13
assert.equal(isValidMid("m012 561 001001"), true); // spaces ok

// invalid: too short, too long, or non-alphanumeric
assert.equal(isValidMid("123"), false);
assert.equal(isValidMid("M012-561-001001"), false);
assert.equal(isValidMid("012561001001012345"), false);
assert.equal(isValidMid(""), false);

console.log("mid.test.ts ok");
