import { describe, expect, it } from "vitest";
import { categorize, matchesTopic } from "./filter.ts";

describe("matchesTopic", () => {
  it("keeps news about large families", () => {
    expect(
      matchesTopic("В Петербурге уточнили льготы для многодетных семей на проезд"),
    ).toBe(true);
  });

  it("keeps family tax payment news", () => {
    expect(
      matchesTopic("Стартовал прием заявлений на семейную налоговую выплату"),
    ).toBe(true);
  });

  it("keeps maternity capital news", () => {
    expect(matchesTopic("Материнский капитал проиндексируют с 1 февраля")).toBe(true);
    expect(matchesTopic("Более 15 млн сертификатов выдано с момента введения маткапитала")).toBe(
      true,
    );
  });

  it("drops channel engagement posts", () => {
    expect(
      matchesTopic("Голосуйте реакциями за самый интересный материал про выплаты семьям"),
    ).toBe(false);
  });

  it("drops unrelated headlines", () => {
    expect(matchesTopic("Сборная России сыграет товарищеский матч в сентябре")).toBe(
      false,
    );
  });

  it("does not treat a lone benefit word as a match", () => {
    expect(matchesTopic("Компания объявила выплату дивидендов акционерам")).toBe(false);
  });

  it("accepts extra keywords from env", () => {
    expect(matchesTopic("Городской вестник: новые правила", ["вестник"])).toBe(true);
  });
});

describe("categorize", () => {
  it("puts mortgages into housing", () => {
    expect(categorize("Расширили семейную ипотеку для многодетных")).toBe("Жильё");
  });

  it("puts payments into payments", () => {
    expect(categorize("Единое пособие назначат по новым правилам")).toBe("Выплаты");
  });
});
