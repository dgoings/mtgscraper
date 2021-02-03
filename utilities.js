import fs from 'fs';
import path from 'path';

// currently just an example search
const defaultQueryString = `?filter%5Bsort%5D=price_desc&filter%5Bsearch%5D=mtg_advanced&filter%5Bname%5D=&filter%5Bcategory_id%5D=2530&filter%5Bfoil%5D=1&filter%5Bnonfoil%5D=1&filter%5Bprice_op%5D=&filter%5Bprice%5D=`;

const defaultOptions = {
  sort: "price_desc",
  search: "mtg_advanced",
  category_id: "0",
  foil: "1",
  nonfoil: "1"
}

// Eventually this should dynamically build a query string based on input params
export const buildQuery = (queryOptions) => {
  const options = {
    ...defaultOptions,
    ...queryOptions
  }

  const queryString = Object.entries(options).reduce((acc, [key, value]) => {
    return acc.concat(`&filter%5B${key}%5D=${value}`);
  }, '');

  return queryString.slice(1);
}

export const getSetMap = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, './cards/sets.json')));
}

export const getCardMap = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, './cards/cards.json')));
}
