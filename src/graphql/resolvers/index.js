const authResolvers = require("./authResolvers");
const userResolvers = require("./userResolvers");
const boardResolvers = require("./boardResolvers");
const columnResolvers = require("./columnResolvers");
const { GraphQLJSON } = require("graphql-type-json");

const taskResolvers = require("./taskResolvers");
const commentResolvers = require("./commentResolvers");
const activityResolvers = require("./activityResolvers");

// دمج جميع الـ resolvers
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    ...userResolvers.Query,
    ...boardResolvers.Query,
    ...columnResolvers.Query,
    ...taskResolvers.Query,
    ...commentResolvers.Query,
    ...activityResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...boardResolvers.Mutation,
    ...columnResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...activityResolvers.Mutation,
  },

  // Field resolvers
  User: {
    ...userResolvers.User,
  },

  Board: {
    ...boardResolvers.Board,
  },

  BoardMember: {
    ...boardResolvers.BoardMember,
  },

  Column: {
    ...columnResolvers.Column,
  },

  Task: {
    ...taskResolvers.Task,
  },

  Comment: {
    ...commentResolvers.Comment,
  },

  ActivityLog: {
    ...activityResolvers.ActivityLog,
  },
};

module.exports = resolvers;
