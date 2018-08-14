const _ = require('lodash');
const moment = require('moment');

module.exports = function(opts) {
  // const log = require('../../../lib/winston')({ ...opts, label: 'calendar/report/calendar-query' });
  const eventResponse = require('./eventResponse')(opts);
  return async function(ctx, calendar) {
    const filters = _.get(ctx.request.xml, 'B:calendar-query.B:filter[0].B:comp-filter');
    if (!filters) { return { responses: [] }; }
    const cFilter = _.find(filters, (f) => _.get(f, '$.name') === 'VCALENDAR');
    if (!cFilter) { return { responses: [] }; }
    const eFilter = _.find(cFilter['B:comp-filter'], (f) => _.get(f, '$.name') === 'VEVENT');
    if (!eFilter) { return { responses: [] }; }
    /* https://tools.ietf.org/html/rfc4791#section-9.9 */
    const timeRange = eFilter['B:time-range'];
    if (!timeRange || !timeRange[0]) { return { responses: [] }; }
    const start = timeRange[0].$.start ? moment(timeRange[0].$.start).unix() : null;
    const end = timeRange[0].$.end ? moment(timeRange[0].$.end).unix() : null;
    const events = await opts.getEventsByDate(ctx.state.params.userId, calendar.calendarId, start, end);

    const propTags = _.get(ctx.request.xml, 'B:calendar-query.A:prop[0]');
    return await eventResponse(ctx, events, propTags);
  };
};
