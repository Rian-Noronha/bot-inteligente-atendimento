const { sequelize } = require('../models');
const { createWithTransaction } = require('../utils/transaction');
const withTransaction = createWithTransaction(sequelize);
module.exports = withTransaction;