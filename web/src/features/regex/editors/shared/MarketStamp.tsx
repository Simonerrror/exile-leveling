interface MarketStampProps {
  date: string;
  league: string;
  locale: "en" | "ru";
}

export function MarketStamp({ date, league, locale }: MarketStampProps) {
  const parsed = new Date(date);
  const displayDate = Number.isNaN(parsed.valueOf())
    ? date
    : new Intl.DateTimeFormat(locale).format(parsed);
  return <span>{league} · {displayDate}</span>;
}
