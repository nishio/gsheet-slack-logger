#!/usr/bin/env node
import { loadEnv } from './localEnv.js';
loadEnv(); // 環境変数を読み込む

import settings from "./settings.js";
import core from './lib/coreWrapper.js';

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
