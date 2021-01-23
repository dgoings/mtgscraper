import { buildQuery, getScraper, getPaginationConfig } from './utilities';

const myCards=[];

const getElementContent = (content) => {
  const $ = cheerio.load(content, null, false);
  const title = $('.productDetailTitle').text();
  const dollarAmount = $('.creditSellPrice .sellDollarAmount').text();
  const centsAmount = $('.creditSellPrice .sellCentsAmount').text();
  const qty = $('ul.qtyList li').last().text();
  myCards.push({
    title,
    credit: `${dollarAmount}.${centsAmount}`,
    qty
  });
}

const cards = new CollectContent('ul.itemList.buyList li .itemContentWrapper', {
  contentType: 'html',
  getElementContent
});
// const cardTitles = new CollectContent('.itemContentWrapper .productDetailTitle');

// const buyQuantity = new CollectContent('ul.itemList.buyList .itemContentWrapper .addToCartWrapper')

cardRoot.addOperation(cards);

await scraper.scrape(cardRoot);
