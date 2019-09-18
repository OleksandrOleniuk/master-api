import * as cheerio from 'cheerio';
import * as request from 'request';
import * as fs from 'fs';

const logger = fs.createWriteStream('logs.log', {
  flags: 'a',
});

export class Utils {
  static sendLogs(log: string) {
    console.log(log);
    logger.write(`${log} \n`);
  }

  static randomNumber(min: number, max: number): number {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
  }

  static googleIt(config: any): Promise<any> {
    const { query, options = {} } = config;
    const defaultOptions = {
      url: 'https://www.google.com/search',
      qs: {
        q: query,
        num: 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0'
      }
    };

    return new Promise((resolve: any, reject: any) => {
      request(
        Object.assign({}, defaultOptions, options),
        (error: any, response: any, body: any) => {
          if (error) {
            return reject(`Error making web request: ${error}`);
          }
          if (response.statusCode !== 200) {
            return reject(new Error('google search error'));
          }

          const total = Utils.getTotal({ data: body });
          return resolve(total);
        }
      );
    });
  }

  static getTotal({ data }: any) {
    console.log('getTotal');
    const S = cheerio.load(data);
    const contents = S('#resultStats').contents();
    if (contents && contents[0]) {
      const dataS = contents[0].data;
      if (dataS) {
        const splited = dataS.split(':');
        if (splited && splited.length > 1) {
          return splited[1].trim();
        }
      }
    }
    return 0;
  }
}
