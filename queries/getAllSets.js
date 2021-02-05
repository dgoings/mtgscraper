const cheerio = require('cheerio');
const { Root, CollectContent } = require('nodejs-web-scraper');
import { buildQuery } from '../utilities';
import { CKScraper } from '../scraper';

export const getAllSets = async () => {
  const mySets={};
  const getSetInfo = (element) => {
    const $ = cheerio.load(element, null, false);
    $('option').each((i, elem) => {
      mySets[$(elem).text().trim()] = $(elem).attr("value");
    });
  }

  const scraper = new CKScraper(buildQuery());

  const sets = new CollectContent('#editionContainer select', {
    contentType: 'html',
    getElementContent: getSetInfo
  });

  const cardRoot = new Root();
  cardRoot.addOperation(sets);

  await scraper.scrape(cardRoot);

  return mySets;
}

