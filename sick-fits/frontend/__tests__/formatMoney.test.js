import formatMoney from "../lib/formatMoney";

describe("formatMoney Function", () => {
  it("works with fractional dollars", () => {
    expect(formatMoney(1)).toEqual("$0.01");
    expect(formatMoney(10)).toEqual("$0.10");
    expect(formatMoney(9)).toEqual("$0.09");
    expect(formatMoney(40)).toEqual("$0.40");
  });

  it("leaves cents off for whole dollars", () => {
    expect(formatMoney(5000)).toEqual("$50");
    expect(formatMoney(100)).toEqual("$1");
    expect(formatMoney(5000000000)).toEqual("$50,000,000");
  });

  it("works with whole and fractional dollars", () => {
    expect(formatMoney(5000)).toEqual("$50");
    expect(formatMoney(5012)).toEqual("$50.12");
    expect(formatMoney(101)).toEqual("$1.01");
  });

  it("rounds values less than 0.5 cents to $0", () => {
    expect(formatMoney(0.01)).toEqual("$0.00");
    expect(formatMoney(0.001)).toEqual("$0.00");
    expect(formatMoney(0.49)).toEqual("$0.00");
    expect(formatMoney(0.5)).toEqual("$0.01");
    expect(formatMoney(0.6)).toEqual("$0.01");
  });
});
