import BasicFilter from "./BasicFilter";

const types = {
  string: () => BasicFilter,
  number: () => BasicFilter,
  int: () => BasicFilter,
  date: () => BasicFilter,
  time: () => BasicFilter,
  dateTime: () => BasicFilter
};
module.exports = {
  getFilterRenderer: (type, props) =>
    types[type] ? types[type](type, props) : types.basicFilter(type, props),
  BasicFilter
};
