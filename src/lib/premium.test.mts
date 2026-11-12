import assert from "node:assert/strict";
import { test } from "node:test";

import { detectRegion, formatMoney, pickRegion, rupeesToPaise, wholeUnitsToMinor, validWhatsappNumber, whatsappUrl } from "./premium.ts";

test("formatMoney renders whole units per currency", () => {
  assert.match(formatMoney("INR", 59900), /₹\s?599$/);
  assert.match(formatMoney("AED", 2900), /29/);
  assert.match(formatMoney("AED", 2900), /AED|د\.إ/);
  assert.match(formatMoney("USD", 900), /\$\s?9$/);
});

test("detectRegion uses the time zone, then the language subtag, else INT", () => {
  assert.equal(detectRegion("Asia/Kolkata", []), "IN");
  assert.equal(detectRegion("Asia/Calcutta", ["en-US"]), "IN");
  assert.equal(detectRegion("Asia/Dubai", ["en-US"]), "AE");
  assert.equal(detectRegion("Asia/Muscat", []), "INT");
  assert.equal(detectRegion("Europe/London", ["en-IN"]), "IN");
  assert.equal(detectRegion(undefined, ["fr", "ar-AE"]), "AE");
  assert.equal(detectRegion("America/New_York", ["en-US"]), "INT");
  assert.equal(detectRegion(undefined, []), "INT");
});

test("pickRegion only chooses offered regions", () => {
  const prices = [
    { region: "IN", currency: "INR", amount_minor: 59900 },
    { region: "INT", currency: "USD", amount_minor: 900 },
  ] as const;
  assert.equal(pickRegion("INT", prices), "INT");
  assert.equal(pickRegion("AE", prices), "IN");
  assert.equal(pickRegion(null, prices), "IN");
  assert.equal(pickRegion("AE", [prices[1]]), "INT");
  assert.equal(pickRegion("IN", []), null);
});

test("wholeUnitsToMinor treats blank as not offered and rejects bad input", () => {
  assert.equal(wholeUnitsToMinor(""), null);
  assert.equal(wholeUnitsToMinor("  "), null);
  assert.equal(wholeUnitsToMinor("29"), 2900);
  assert.equal(wholeUnitsToMinor("0"), undefined);
  assert.equal(wholeUnitsToMinor("2.5"), undefined);
});

test("validWhatsappNumber accepts digits only", () => {
  assert.equal(validWhatsappNumber("919876543210"), "919876543210");
  assert.equal(validWhatsappNumber("+919876543210"), null);
  assert.equal(validWhatsappNumber("12ab"), null);
  assert.equal(validWhatsappNumber(""), null);
  assert.equal(validWhatsappNumber(undefined), null);
});

test("whatsappUrl encodes the message and rejects a bad number", () => {
  assert.equal(whatsappUrl("919876543210", "Hi & bye"), "https://wa.me/919876543210?text=Hi%20%26%20bye");
  assert.equal(whatsappUrl("nope", "x"), null);
});

test("rupeesToPaise accepts whole rupees 1..10000 only", () => {
  assert.equal(rupeesToPaise("599"), 59900);
  assert.equal(rupeesToPaise(" 1 "), 100);
  assert.equal(rupeesToPaise("10000"), 1000000);
  assert.equal(rupeesToPaise("10001"), null);
  assert.equal(rupeesToPaise("0"), null);
  assert.equal(rupeesToPaise("5.5"), null);
  assert.equal(rupeesToPaise("-3"), null);
  assert.equal(rupeesToPaise(""), null);
});
