const weekMap = [6, 0, 1, 2, 3, 4, 5];

const getWeek = (date: Date): [Date, Date] => {
  var now = new Date(date);
  now.setHours(0, 0, 0, 0);
  var monday = new Date(now);
  monday.setDate(monday.getDate() - weekMap[monday.getDay()]);
  var sunday = new Date(now);
  sunday.setDate(sunday.getDate() - weekMap[sunday.getDay()] + 6);
  sunday.setHours(23, 59, 59, 999);
  return [monday, sunday];
};

const getMonth = (date: Date): [Date, Date] => {
  const now = new Date(date);
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [firstDay, lastDay];
};

const getYear = (date: Date): [Date, Date] => {
  const now = new Date(date);
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const lastDay = new Date(now.getFullYear(), 11, 31);
  return [firstDay, lastDay];
};

export const getSelectedDates = (key: string): [Date, Date] => {
  const now = new Date();
  switch (key) {
    case "w":
      return getWeek(now);
    case "m":
      return getMonth(now);
    case "y":
      return getYear(now);

    case "d":
    default:
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      now.setUTCHours(23, 59, 59, 999);
      return [start, now];
  }
};

export const getDates = (key: string) => {
  const now = new Date();
  let range: Date[] = [];
  switch (key) {
    case "d":
      return now.toDateString();
    case "w":
      range = getWeek(now);
      return (
        range[0].toDateString().slice(4, 10) +
        "-" +
        range[1].toDateString().slice(4)
      );
    case "m":
      range = getMonth(now);
      return (
        range[0].toDateString().slice(4, 10) +
        "-" +
        range[1].toDateString().slice(4)
      );
    case "y":
      range = getYear(now);
      return (
        range[0].toDateString().slice(4, 10) +
        "-" +
        range[1].toDateString().slice(4)
      );
    default:
      return "";
  }
};
