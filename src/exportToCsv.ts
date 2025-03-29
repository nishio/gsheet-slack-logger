#!/usr/bin/env node
import { loadEnv } from './localEnv.js';
loadEnv(); // 環境変数を読み込む

import settings from './settings.js';
import core from './lib/coreWrapper.js';
import { StatusFile } from './lib/statusFile.js';
import { historyIt, MessageProcessor } from './lib/slack.js';
import { Timestamp } from './lib/timestamp.js';
import { exportChannelToCsv, exportAllChannelsToCsv } from './lib/csv/exporter.js';
import { uploadCsvFiles, UploadOptions } from './lib/csv/uploader.js';
import { Temporal } from '@js-temporal/polyfill';
import { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse';

async function collectMessages(channel_id: string, ts: string, latest: string) {
  const messages: Message[] = [];
  for await (const msg of historyIt(channel_id, ts, latest)) {
    messages.push(msg);
  }
  return messages;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || './csv_output';
    const uploadOption = args.find(arg => arg.startsWith('--upload='))?.split('=')[1] || 'local';
    const includeRaw = args.includes('--include-raw');
    
    const timeZone = settings.tz || 'UTC';
    const year = parseInt(core.getInput('year'));
    const month = parseInt(core.getInput('month'));
    
    let from;
    if (isNaN(year)) {
      if (!isNaN(month)) {
        core.setFailed('should specify both year and month');
        process.exit(1);
      }
      const now = Temporal.Now.zonedDateTimeISO(timeZone).toPlainYearMonth();
      const twoMonths = Temporal.Duration.from({months: 2});
      from = now.subtract(twoMonths).toPlainDate({day: 1}).toZonedDateTime(timeZone);
    } else {
      const ym = Temporal.PlainDateTime.from({
        year,
        month,
        day: 1
      });
      from = ym.toZonedDateTime(timeZone);
    }
    
    const to = from.add({months: 1});
    const oldest = new Date(from.epochMilliseconds);
    const latest = new Date(to.epochMilliseconds);
    
    console.log(`Exporting Slack messages from ${oldest.toISOString()} to ${latest.toISOString()}`);
    
    const file = new StatusFile();
    const oldestTimestamp = new Timestamp(oldest);
    await file.prepare(false, oldestTimestamp);
    
    const messageProcessor = await new MessageProcessor().await();
    
    const channelsData = [];
    for await (const c of file.status.channels) {
      console.log(`Collecting messages from channel: ${c.name}`);
      const messages = await collectMessages(
        c.channel_id, 
        c.ts, 
        new Timestamp(latest).slack()
      );
      
      if (messages.length > 0) {
        channelsData.push({
          name: c.name,
          messages
        });
      }
    }
    
    const exportOptions = {
      outputDir,
      includeRawJson: includeRaw
    };
    
    const filePaths = await exportAllChannelsToCsv(
      channelsData,
      messageProcessor,
      exportOptions
    );
    
    let uploadOptions: UploadOptions = { destination: 'local' };
    
    if (uploadOption === 's3') {
      uploadOptions = {
        destination: 's3',
        bucketName: process.env.AWS_S3_BUCKET,
        remotePath: process.env.AWS_S3_PATH || 'slack-logs'
      };
    } else if (uploadOption === 'github') {
      uploadOptions = {
        destination: 'github',
        githubRepo: process.env.GITHUB_REPOSITORY || 'user/repo',
        githubBranch: process.env.GITHUB_PAGES_BRANCH || 'gh-pages',
        remotePath: 'slack-logs'
      };
    } else if (uploadOption === 'gcs') {
      uploadOptions = {
        destination: 'gcs',
        bucketName: process.env.GCS_BUCKET,
        remotePath: process.env.GCS_PATH || 'slack-logs'
      };
    }
    
    if (uploadOption !== 'local') {
      console.log(`アップロード先: ${uploadOption}`);
      const urls = await uploadCsvFiles(filePaths, uploadOptions);
      console.log('アップロード完了:');
      urls.forEach(url => console.log(` - ${url}`));
    }
    
    console.log('CSV出力が完了しました');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    core.setFailed(`Action failed with error ${error}`);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
