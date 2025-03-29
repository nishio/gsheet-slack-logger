/**
 * @actions/coreのラッパー
 * ローカル環境で実行する場合はコンソールにログを出力するだけの実装を提供
 */

interface AnnotationProperties {
  title?: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
}

const createMockCore = () => {
  const noop = () => {};
  const noopReturn = (val: any = '') => val;
  
  return {
    getInput: (name: string) => process.env[`INPUT_${name.toUpperCase()}`] || '',
    getMultilineInput: (name: string) => {
      const value = process.env[`INPUT_${name.toUpperCase()}`] || '';
      return value.split('\n').filter(Boolean);
    },
    getBooleanInput: (name: string) => {
      const value = process.env[`INPUT_${name.toUpperCase()}`] || '';
      return value.toLowerCase() === 'true';
    },
    setOutput: (name: string, value: any) => console.log(`Setting output ${name}: ${value}`),
    setFailed: (message: string | Error) => {
      console.error(`ERROR: ${message instanceof Error ? message.message : message}`);
      process.exit(1);
    },
    exportVariable: noop,
    setSecret: noop,
    addPath: noop,
    group: async (name: string, fn: () => Promise<void>) => await fn(),
    endGroup: noop,
    saveState: noop,
    getState: noopReturn,
    startGroup: (name: string) => console.log(`GROUP: ${name}`),
    notice: (message: string | Error, properties?: AnnotationProperties) => 
      console.log(`NOTICE: ${message instanceof Error ? message.message : message}`),
    warning: (message: string | Error, properties?: AnnotationProperties) => 
      console.warn(`WARNING: ${message instanceof Error ? message.message : message}`),
    error: (message: string | Error, properties?: AnnotationProperties) => 
      console.error(`ERROR: ${message instanceof Error ? message.message : message}`),
    debug: (message: string) => console.debug(`DEBUG: ${message}`),
    info: (message: string) => console.info(`INFO: ${message}`),
    isDebug: () => false,
    summary: {
      addRaw: (text: string) => ({ write: async () => {} }),
      addEOL: () => ({ write: async () => {} }),
      write: async () => {}
    },
    toPosixPath: (path: string) => path.replace(/\\/g, '/'),
    toWin32Path: (path: string) => path.replace(/\//g, '\\'),
    toPlatformPath: (path: string) => path
  };
};

let core: any;

try {
  core = require('@actions/core');
} catch (error) {
  core = createMockCore();
}

export default core;
