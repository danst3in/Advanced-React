const { forwardTo } = require("prisma-binding");

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
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   console.log(items);
  //   return items;
  // },
};

module.exports = Query;
