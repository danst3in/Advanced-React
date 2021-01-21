const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that!");
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          //  This is how to create relationship btw item and user in prisma
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    );
    // console.log(item);
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
    // console.log(item);
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
    // creat user in db and sign them in // edit permissions here to add an ADMIN since Prisma console doesn't allow
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
  async signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async requestReset(parent, args, ctx, info) {
    //  check if real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // set reset token and expiry on that user
    const resetToken = (await promisify(randomBytes)(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    });
    //  email them the reset token
    const mailResponse = await transport.sendMail({
      from: "danstein@hey.com",
      to: user.email,
      subject: "Your Password Reset Token",
      html: makeANiceEmail(
        `Your Password Reset Token is Here!
        
        <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`
      ),
    });

    return { message: "Thanks!" };
  },
  async resetPassword(parent, args, ctx, info) {
    //  check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error(`Your Passwords don't match!`);
    }
    //  check if its a valid reset token
    //  check if it has expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error("This token is either invalid or expired!");
    }
    //  hash the password
    const password = await bcrypt.hash(args.password, 10);
    //  save the new password to the user and remove the old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    //  generate new jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    //  set the JWT cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 365 * 24 * 60 * 60,
    });
    //  return the new user
    return updatedUser;
  },
};

module.exports = Mutations;
