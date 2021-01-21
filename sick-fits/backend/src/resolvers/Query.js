const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");

const Query = {
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  async me(parent, args, ctx, info) {
    // check for current userId
    if (!ctx.request.userId) {
      return null;
    }
    const user = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );
    return user;
  },
  async users(parent, args, ctx, info) {
    //  check if user is logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }
    //  check if user has permission to query all users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);
    //  if yes, query all users

    const userList = await ctx.db.query.users({}, info);

    return userList;
  },
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   console.log(items);
  //   return items;
  // },
};

module.exports = Query;
