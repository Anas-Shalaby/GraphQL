const { gql } = require("graphql-tag");
const types = require("./types");

const schema = gql`
  ${types.loc.source.body}
`;

module.exports = schema;
