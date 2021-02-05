const fs = require('fs');
const path = require('path');

const defaultOptions = {
  sort: "price_desc",
  search: "mtg_advanced",
  category_id: "0"
}

export const parseFilters = (filters) => {

  const parsedFilters = filters.reduce((acc, filter) => {
    const splitFilter = filter.split(':', 2);
    switch (splitFilter[0]) {
      case 'foil':
        if (splitFilter[1] === 'yes') {
          acc.foil = 1;
          break;
        }
        // Check for specific foil/nonfoil negations
        // e.g. foil:no with no nonfoil filter should result in an explicit { nonfoil: 1 } query option
        if (splitFilter[1] === 'no') {
          acc.nonfoil = 1
        }
        break;
      case 'nonfoil':
        if (splitFilter[1] === 'yes') {
          acc.nonfoil = 1;
          break;
        }
        // nonfoil:no with no foil filter should result in an explicit { foil: 1 } query option
        if (splitFilter[1] === 'no') {
          acc.foil = 1
        }
        break;
      case 'rarity':
        acc['rarity'] = [];
        const rarities = splitFilter[1].split(',');
        rarities.forEach((rarity) => {
          switch (rarity) {
            case 'mythic':
              acc['rarity'].push('M')
              break;
            case 'rare':
              acc['rarity'].push('R')
              break;
            case 'uncommon':
              acc['rarity'].push('U')
              break;
            case 'common':
              acc['rarity'].push('C')
              break;
            case 'basic':
              acc['rarity'].push('L')
              break;
            case 'special':
              acc['rarity'].push('S')
              break;
          }
        });
        break;
      case 'name':
        acc.name = splitFilter[1]
        break;
      case 'price':
        const match = splitFilter[1].match(/(<=|>=)\$?(\d+\.\d\d)/);
        if (match) {
          acc.price_op = match[1];
          acc.price = match[2];
        }
        break;
    }

    return acc;
  }, {});

  return parsedFilters;
}

// Eventually this should dynamically build a query string based on input params
export const buildQuery = (queryOptions) => {
  const options = {
    ...defaultOptions,
    ...queryOptions
  }

  const queryString = Object.entries(options).reduce((acc, [key, value]) => {
    if (key === 'rarity') {
      const rarityFilters = value.reduce((acc, rarity, i) => {
        return acc.concat(`&filter[rarity][${i}]=${rarity}`)
      }, '');
      return acc.concat(rarityFilters);
    }
    return acc.concat(`&filter[${key}]=${value}`);
  }, '');

  return encodeURI(queryString.slice(1));
}

export const getSetMap = () => {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './cards/sets.json')));
}

export const getCardMap = (file) => {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file)));
}

export const exportCardsToCSV = (cards) => {
  const cardMap = (typeof cards === 'string') ? getCardMap(file) : cards;
  const header = `Card Name,Edition,Foil,Quantity,Cash,Credit\n`;

  let csv = '';
  csv += header;

  Object.entries(cardMap).forEach(([set, cards]) => {
    const setCode = getSetCode(set);
    cards.forEach((card) => {
      csv += `"${card.title}",${setCode},${card.foil},${card.qty},${card.cash},${card.credit}\n`
    });
  });

  return csv;
}

const setCodeMap = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './cards/SetList.json'))).data.reduce((acc, set, i) => {
  acc[set.name] = set.code;
  return acc;
}, {});

export const getSetCode = (setName) => {
  return setCodeMap[setName];
}
