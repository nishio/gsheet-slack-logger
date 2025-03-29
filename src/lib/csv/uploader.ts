import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface UploadOptions {
  destination: 'local' | 's3' | 'github' | 'gcs';
  bucketName?: string;
  remotePath?: string;
  githubRepo?: string;
  githubBranch?: string;
}

export async function uploadCsvFiles(
  filePaths: string[],
  options: UploadOptions
): Promise<string[]> {
  const { destination } = options;
  
  switch (destination) {
    case 'local':
      return filePaths;
      
    case 's3':
      return uploadToS3(filePaths, options);
      
    case 'github':
      return uploadToGitHub(filePaths, options);
      
    case 'gcs':
      return uploadToGCS(filePaths, options);
      
    default:
      throw new Error(`サポートされていない保存先: ${destination}`);
  }
}

async function uploadToS3(
  filePaths: string[],
  options: UploadOptions
): Promise<string[]> {
  const { bucketName, remotePath = '' } = options;
  
  if (!bucketName) {
    throw new Error('S3バケット名が指定されていません');
  }
  
  const uploadedUrls: string[] = [];
  
  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
    const s3Path = path.join(remotePath, fileName).replace(/\\/g, '/');
    
    await execAsync(`aws s3 cp "${filePath}" "s3://${bucketName}/${s3Path}"`);
    
    uploadedUrls.push(`https://${bucketName}.s3.amazonaws.com/${s3Path}`);
  }
  
  return uploadedUrls;
}

async function uploadToGitHub(
  filePaths: string[],
  options: UploadOptions
): Promise<string[]> {
  const { githubRepo, githubBranch = 'gh-pages', remotePath = 'csv' } = options;
  
  if (!githubRepo) {
    throw new Error('GitHubリポジトリが指定されていません');
  }
  
  const tempDir = path.join(process.cwd(), '.tmp_gh_pages');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    await execAsync(`git clone -b ${githubBranch} https://github.com/${githubRepo}.git ${tempDir}`);
    
    const outputDir = path.join(tempDir, remotePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const uploadedUrls: string[] = [];
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const destPath = path.join(outputDir, fileName);
      
      fs.copyFileSync(filePath, destPath);
      
      const repoUrl = githubRepo.split('/');
      uploadedUrls.push(`https://${repoUrl[0]}.github.io/${repoUrl[1]}/${remotePath}/${fileName}`);
    }
    
    await execAsync(`cd ${tempDir} && git add . && git commit -m "Update CSV files" && git push`);
    
    return uploadedUrls;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function uploadToGCS(
  filePaths: string[],
  options: UploadOptions
): Promise<string[]> {
  const { bucketName, remotePath = '' } = options;
  
  if (!bucketName) {
    throw new Error('GCSバケット名が指定されていません');
  }
  
  const uploadedUrls: string[] = [];
  
  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
    const gcsPath = path.join(remotePath, fileName).replace(/\\/g, '/');
    
    await execAsync(`gcloud storage cp "${filePath}" "gs://${bucketName}/${gcsPath}"`);
    
    uploadedUrls.push(`https://storage.googleapis.com/${bucketName}/${gcsPath}`);
  }
  
  return uploadedUrls;
}
