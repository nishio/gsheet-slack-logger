#!/usr/bin/env node
import settings from "./settings.js";
import * as core from '@actions/core';

if (settings.useLatestFile) {
  console.log("Using latest file functionality");
  import("./clearLatestSheet.js").then(() => {
    core.notice("Cleared latest sheet, proceeding with data retrieval");
    import("./latest.js");
  });
} else {
  console.log("Using traditional monthly backup");
  import("./monthly.js");
}
