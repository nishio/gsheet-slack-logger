#!/usr/bin/env node
import settings from "./settings.js";
import * as core from '@actions/core';
import { GSheet, sheets_v4 } from './lib/google/sheet.js';
import { fileURLToPath } from 'url';

/**
 * latestシートの内容をクリアする関数
 * 同じ内容が何度も書き込まれるのを防ぐため
 */
export async function clearLatestSheet() {
  try {
    core.notice("Checking for latest sheet to clear...");
    
    const latestSheet = await GSheet.getLatestFile();
    if (!latestSheet) {
      core.notice("No latest sheet found. Nothing to clear.");
      return;
    }
    
    core.notice(`Found latest sheet with ID: ${latestSheet.id}. Clearing content...`);
    
    const meta = await latestSheet.meta();
    const clearRequests: sheets_v4.Schema$Request[] = [];
    
    for (const sheet of meta.sheets || []) {
      if (sheet.properties && sheet.properties.sheetId) {
        clearRequests.push({
          updateCells: {
            range: {
              sheetId: sheet.properties.sheetId,
              startRowIndex: 1, // ヘッダー行を保持
            },
            fields: 'userEnteredValue'
          }
        });
      }
    }
    
    if (clearRequests.length > 0) {
      await latestSheet.batchUpdate(clearRequests);
      core.notice(`Successfully cleared content from ${clearRequests.length} sheets.`);
    } else {
      core.notice("No sheets found to clear.");
    }
    
    return latestSheet;
  } catch (error) {
    console.error("Error clearing latest sheet:", error);
    core.warning(`Failed to clear latest sheet: ${error}`);
    throw error;
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  clearLatestSheet().catch(e => {
    console.error(e);
    core.setFailed(`Action failed with error ${e}`);
  });
}
