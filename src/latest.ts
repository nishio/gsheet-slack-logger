import main from './main.js'
import settings from './settings.js';
import * as core from '@actions/core';

import { Temporal } from '@js-temporal/polyfill';

const timeZone = settings.tz;

const now = Temporal.Now.zonedDateTimeISO(timeZone);

const daysBefore = Temporal.Duration.from({days: settings.lastDays});
const from = now.subtract(daysBefore);

core.notice(`Start backing up from ${from.year}/${from.month}/${from.day} to now`);

const today = now.toPlainDate();

main(false, new Date(from.epochMilliseconds), new Date(now.epochMilliseconds)).catch(e => {
  console.error(e)
  core.setFailed(`Action failed with error ${e}`);
})
