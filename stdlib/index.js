const metabolism = require('./metabolism');
const witness = require('./witness');
const identity = require('./identity');
const memory = require('./memory');
const hire = require('./hire');
const swarm = require('./swarm');
const evolve = require('./evolve');

module.exports = {
  ...metabolism,
  ...witness,
  ...identity,
  ...memory,
  ...hire,
  ...swarm,
  ...evolve,
};
