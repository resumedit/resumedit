// formatDate.ts
import { format } from "date-fns";

export enum DateTimeFormat {
  YeamMonthDayTime = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  MonthDayTime = "MM-dd'T'HH:mm:ss.SSS",
  DayTime = "dd'T'HH:mm:ss.SSS",
  Time = "HH:mm:ss.SSS",
}

export enum DateTimeSeparator {
  LetterT = "'T'",
  Space = "' '",
  Newline = "'\n'",
}

export const dateToISOLocal = (
  date: Date | null | undefined,
  fmt?: DateTimeFormat,
  sep?: DateTimeSeparator,
): string => {
  const separator = sep ? sep : DateTimeSeparator.LetterT;
  const formatString = (fmt ? fmt : DateTimeFormat.YeamMonthDayTime).replace(`'T'`, separator);
  return date instanceof Date ? format(date, formatString) : "Not a Date";
};

export const tsToISOLocal = (
  timestamp: number | null | undefined,
  fmt?: DateTimeFormat,
  sep?: DateTimeSeparator,
): string => {
  const separator = sep ? sep : DateTimeSeparator.LetterT;
  const formatString = (fmt ? fmt : DateTimeFormat.YeamMonthDayTime).replace(`'T'`, separator);
  return typeof timestamp === "number" ? format(timestamp, formatString) : "Not a number";
};

// Avoid hydration errors from rendering date on server and client in different time zones
// https://stackoverflow.com/a/73006128/617559
// https://github.com/vercel/next.js/discussions/38263#discussioncomment-3162871
// import { useState, useEffect } from "react";

// const useFormattedDate = (date: Date) => {
//   const [formattedDate, setFormattedDate] = useState(null);

//   useEffect(() => setFormattedDate(new Date(date).toLocaleDateString("en-US")), []);

//   return formattedDate;
// };

// export default useFormattedDate;
