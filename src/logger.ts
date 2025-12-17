import chalk from 'chalk';
import { PLUGIN_LOG_TITLE } from './constant.js';
import { isDebug } from './utils.js';

enum LogType {
  Stdout = 'stdout',
  Stderr = 'stderr',
}

const logMap: Record<LogType, 'log' | 'error'> = {
  [LogType.Stdout]: 'log',
  [LogType.Stderr]: 'error',
};

export class Logger {
  stdout: string;
  stderr: string;
  name: string;
  logTitle: string;

  constructor({
    name,
  }: {
    name: string;
  }) {
    this.name = name;
    this.stdout = '';
    this.stderr = '';
    this.logTitle = PLUGIN_LOG_TITLE;
  }

  appendLog(type: 'stdout' | 'stderr', log: string) {
    this[type] += log;
  }

  emitLog(type: 'stdout' | 'stderr') {
    console[logMap[type]](this[type]);
  }

  emitLogOnce(type: 'stdout' | 'stderr', log: string) {
    const logWithName = `${chalk.hex('#808080').bold(this.name)}: ${log}`;
    console[logMap[type]](logWithName);
  }

  reset(type: 'stdout' | 'stderr') {
    this[type] = '';
  }

  setBanner(name: string) {
    const startBanner = `\n------------ ${chalk.hex('#c95ab3').bold('log start:')} ${chalk.green(
      name,
    )} ${'-'.repeat(Math.max(50 - name.toString().length, 5))}`;

    this.stdout = startBanner + this.stdout;
  }

  flushStdout() {
    if (isDebug) {
      return;
    }
    this.setBanner(this.name);
    this.emitLog(LogType.Stdout);
  }

  static setEndBanner() {
    const endBanner = `------------ ${chalk.hex('#c95ab3').bold('log end:')} ${chalk.green(
      'all sub project have been started.',
    )} ------------\n`;

    console.log(endBanner);
  }
}

export const debugLog = (msg: string, prefix = PLUGIN_LOG_TITLE) => {
  if (isDebug) {
    console.log(prefix + msg);
  }
};
