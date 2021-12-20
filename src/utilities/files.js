const fs = require('fs');
const path = require('path');

export const getCardMap = (file) => {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, file)));
}

export const getSetMap = () => {
  return getCardMap('../../assets/sets.json');
}
