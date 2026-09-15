const CITY = /санкт[-\s]?петербург|петербург|петербурж|(?:^|[^а-яё])питер(?:е|а|у|ом)?(?:[^а-яё]|$)|(?:^|[^а-яё])спб(?:[^а-яё]|$)/i;
const LENOBL = /ленинградск[а-яё]*\s+област|ленобласт|лен\.?\s*обл/i;
const LOCAL_SOURCE =
  /фонтанк|канонер|spbdnevnik|вечерний санкт|78\.ru|бумага|paperpaper|ленправда|47news|online47|мурино|кудрово/i;
const LO_PLACES =
  /гатчин|всеволожск|выборг(?:е|а|у|ом)?(?:[^а-яё]|$)|тихвин|кингисепп|тосно|кириш|лужск|(?:^|[^а-яё])луга(?:[^а-яё]|$)|волхов|приозерск|сосновый бор|сертолово|кудрово|мурино|коммунар|сланц|бокситогорск|подпорож|ивангород|шлиссельбург|кировск(?:е|а|у|ом)(?:[^а-яё]|$)|отрадное|никольское|бугры|янино|новоселье|петергоф|кронштадт|сестрорецк|ломоносов|парголово|шушар|колпин|павловск|пушкин(?:е|а|у|ом)?(?:[^а-яё]|$)|царск(?:ое|ого|ом)\s+село/i;

export function mentionsSpbLenobl(text: string) {
  const haystack = text.replace(/\s+/g, " ").trim();
  if (!haystack) return false;
  return (
    CITY.test(haystack) ||
    LENOBL.test(haystack) ||
    LOCAL_SOURCE.test(haystack) ||
    LO_PLACES.test(haystack)
  );
}

export function itemMentionsSpbLenobl(item: {
  title: string;
  excerpt?: string;
  source?: string;
  districts?: string[];
}) {
  return mentionsSpbLenobl(
    [item.title, item.excerpt, item.source, ...(item.districts ?? [])].join(" "),
  );
}

export function filterByRegion<T>(
  items: T[],
  enabled: boolean,
  textOf: (item: T) => Parameters<typeof itemMentionsSpbLenobl>[0],
) {
  if (!enabled) return items;
  return items.filter((item) => itemMentionsSpbLenobl(textOf(item)));
}
