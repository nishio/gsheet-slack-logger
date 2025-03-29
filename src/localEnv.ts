import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ローカル環境での実行時に.envファイルから環境変数を読み込む
 * GitHub Actions上では何もしない
 */
export function loadEnv(): void {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('Running in GitHub Actions, using existing environment variables');
    return;
  }

  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment variables from ${envPath}`);
      config({ path: envPath });
      return;
    }
  }

  console.warn('No .env file found. Make sure to set up your environment variables manually.');
}
