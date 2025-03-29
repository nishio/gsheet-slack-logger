import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse';
import { MessageProcessor } from '../slack.js';
import { Timestamp } from '../timestamp.js';

export interface CsvExportOptions {
  outputDir: string;
  fileNamePrefix?: string;
  dateFormat?: string;
  includeRawJson?: boolean;
}

const defaultOptions: CsvExportOptions = {
  outputDir: './csv_output',
  fileNamePrefix: 'slack_logs',
  dateFormat: 'yyyy-MM-dd HH:mm:ss',
  includeRawJson: false,
};

export async function exportChannelToCsv(
  channelName: string, 
  messages: Message[], 
  processor: MessageProcessor,
  options: Partial<CsvExportOptions> = {}
): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options };
  const { outputDir, fileNamePrefix, includeRawJson } = mergedOptions;
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  const fileName = `${fileNamePrefix}_${channelName}_${timestamp}.csv`;
  const filePath = path.join(outputDir, fileName);
  
  const headers = [
    { id: 'threadMark', title: 'Thread' },
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'username', title: 'User' },
    { id: 'text', title: 'Message' }
  ];
  
  if (includeRawJson) {
    headers.push({ id: 'raw', title: 'Raw Data' });
  }
  
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers
  });
  
  const records = messages.map(msg => {
    const { ts, user, text, ...rest } = msg;
    const threadMark = msg.reply_count ? '+' : msg.parent_user_id ? '>' : '';
    
    const record: any = {
      threadMark,
      timestamp: Timestamp.fromSlack(ts!)?.toLocaleString() || '',
      username: processor.username(user) || rest.username || '',
      text: processor.readable(text) || rest.attachments?.[0].fallback || '',
    };
    
    if (includeRawJson) {
      record.raw = JSON.stringify(rest);
    }
    
    return record;
  });
  
  await csvWriter.writeRecords(records);
  console.log(`CSVファイルを保存しました: ${filePath}`);
  
  return filePath;
}

export async function exportAllChannelsToCsv(
  channelsData: { name: string, messages: Message[] }[],
  processor: MessageProcessor,
  options: Partial<CsvExportOptions> = {}
): Promise<string[]> {
  const filePaths: string[] = [];
  
  for (const { name, messages } of channelsData) {
    const filePath = await exportChannelToCsv(name, messages, processor, options);
    filePaths.push(filePath);
  }
  
  return filePaths;
}
