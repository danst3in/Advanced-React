const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
        },
      },
      info
    );
    console.log(item);
    return item;
  },
  async updateItem(parent, args, ctx, info) {
    //  first take a copy of updates
    const updates = { ...args };
    // remove id from the updates
    delete updates.id;
    // run update method
    const item = await ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
    console.log(item);
    return item;
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. Find the item - query
    const item = await ctx.db.query.item(
      { where },
      `{
      id
      title
    }`
    );
    // 2. Check if they own that item, or have permissions
    // TODO
    // 3. Delete item
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    //  hash user passwords
    const password = await bcrypt.hash(args.password, 10);
    // creat user in db and sign them in
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] },
        },
      },
      info
    );
    //  JWT creation
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //  set JWT as cookie on response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    //  1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    //  2. check if password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid Password!`);
    }
    //  3. Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //  4. Set cookie with token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    //  5. return user
    return user;
  },
};

module.exports = Mutations;
