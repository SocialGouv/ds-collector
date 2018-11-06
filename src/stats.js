const get = require("lodash.get");
const { format, differenceInDays } = require("date-fns");

// https://github.com/betagouv/tps/blob/58ce66/app/serializers/dossier_serializer.rb#L38-L53
const DS_STATUSES = {
  draft: "Brouillon",
  initiated: "En construction",
  received: "En instruction",
  closed: "Accepté",
  refused: "Refusé",
  without_continuation: "Sans suite"
};

// filter out valid status used to compute procedure duration
const DS_STATUSES_COMPLETED = ["closed", "refused", "without_continuation"];

// compute some dossier duration in days
const computeDuration = doc =>
  differenceInDays(doc.dossier.updated_at, doc.dossier.created_at);

const sum = arr => arr.reduce((sum, item) => sum + item, 0);
const flatten = arr => arr.reduce((a, c) => [...a, ...c], []);

const getEmptyStatusData = () => ({
  // we init each possible status
  status: Object.keys(DS_STATUSES).reduce(
    (statuses, status) => ({
      ...statuses,
      [status]: { count: 0, label: DS_STATUSES[status] }
    }),
    {}
  )
});

const getEmptyStatData = () => ({
  count: 0,
  duration: 0,
  // we store each duration to compute the real average duration based on all values
  durations: [],
  // we init each possible status
  ...getEmptyStatusData()
});

const computeMonthlyProcessingStats = docs =>
  docs.reduce((months, doc) => {
    month = format(doc.dossier.created_at, "YYYY-MM");
    if (doc.dossier.processed_at) {
      month = format(doc.dossier.processed_at, "YYYY-MM");
    }
    if (!months[month]) {
      months[month] = getEmptyStatusData();
    }
    months[month].count += 1;
    months[month].status[doc.dossier.state].count += 1;
    return months;
  }, {});

// compute daily stats for a set of docs
const computeDailyStats = docs => {
  const days = docs.reduce((days, doc) => {
    const day = format(doc.dossier.created_at, "YYYY-MM-DD");
    if (!days[day]) {
      days[day] = getEmptyStatData();
    }
    days[day].count += 1;
    days[day].status[doc.dossier.state].count += 1;
    // compute duration for closed docs
    if (DS_STATUSES_COMPLETED.indexOf(doc.dossier.state) > -1) {
      days[day].durations.push(computeDuration(doc));
    }
    return days;
  }, {});
  // compute avg duration
  Object.keys(days).forEach(day => {
    days[day].duration = days[day].durations.length
      ? sum(days[day].durations) / days[day].durations.length
      : 0;
  });
  return days;
};

// aggregate daily data on a monthly basis
const computeMonthlyStats = dailyStats => {
  const months = Object.keys(dailyStats).reduce((months, day) => {
    const month = format(day, "YYYY-MM");
    if (!months[month]) {
      months[month] = getEmptyStatData();
    }
    months[month].count += dailyStats[day].count;
    months[month].durations = [
      ...months[month].durations,
      ...dailyStats[day].durations
    ];
    Object.keys(dailyStats[day].status).forEach(status => {
      months[month].status[status].count +=
        dailyStats[day].status[status].count;
    });
    return months;
  }, {});
  // compute avg duration
  Object.keys(months).forEach(month => {
    months[month].duration = months[month].durations.length
      ? sum(months[month].durations) / months[month].durations.length
      : 0;
  });
  return months;
};

const computeTotalStats = monthlyStats => {
  const allDurations = flatten(
    Object.keys(monthlyStats).map(month => monthlyStats[month].durations)
  );
  const allStats = {
    count: sum(
      Object.keys(monthlyStats).map(month => monthlyStats[month].count)
    ),
    duration: allDurations.length ? sum(allDurations) / allDurations.length : 0,
    status: Object.keys(DS_STATUSES).reduce(
      (statuses, status) => ({
        ...statuses,
        [status]: { count: 0, label: DS_STATUSES[status] }
      }),
      {}
    )
  };
  // compute status count
  Object.keys(monthlyStats).forEach(month => {
    Object.keys(allStats.status).forEach(status => {
      allStats.status[status].count += monthlyStats[month].status[status].count;
    });
  });
  return allStats;
};

const getStats = docs => {
  const dailyStats = computeDailyStats(docs);
  const monthlyStats = computeMonthlyStats(dailyStats);
  const totalStats = {
    ...computeTotalStats(monthlyStats),
    monthly: monthlyStats,
    daily: dailyStats,
    processing: computeMonthlyProcessingStats(docs)
  };
  return totalStats;
};

// aggregate docs by champ libelle
const aggregate = (docs, libelle) =>
  docs.reduce((agg, doc) => {
    const key = doc.dossier.champs.find(
      champ => champ.type_de_champ.libelle === libelle
    ).value;
    if (!agg[key]) {
      agg[key] = 0;
    }
    agg[key] += 1;
    return agg;
  }, {});

module.exports = {
  getStats,
  aggregate
};
