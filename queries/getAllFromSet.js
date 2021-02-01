import { getElementContentBuilder, buildQuery } from '../utilities';
import { CKScraper } from '../scraper';
import { Root, CollectContent } from 'nodejs-web-scraper';

export const getAllCardsFromSet = async () => {
  const myCards=[];
  const getElementContent = getElementContentBuilder(myCards);

  const scraper = new CKScraper(buildQuery());

  const cards = new CollectContent('ul.itemList.buyList li .itemContentWrapper', {
    contentType: 'html',
    getElementContent
  });

  const cardRoot = new Root({
    pagination: await scraper.getPaginationConfig()
  });
  cardRoot.addOperation(cards);

  await scraper.scrape(cardRoot);

  return myCards;
}

