var moment = require('moment')

module.exports = function (value) {
  var date = moment(value)
  var now = moment()
  var format = 'HH:mm'
  if (date.isSame(now, 'day') === false) {
    format = 'M/D ' + format
  }
  if (date.isSame(now, 'year') === false) {
    format = 'YYYY/' + format
  }
  return date.format(format)
}