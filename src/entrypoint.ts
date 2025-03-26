#!/usr/bin/env node
import settings from "./settings.js";

if (settings.useLatestFile) {
  console.log("Using latest file functionality");
  import("./latest.js");
} else {
  console.log("Using traditional monthly backup");
  import("./monthly.js");
}
