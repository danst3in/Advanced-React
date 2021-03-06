const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

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
      user{id}
    }`
    );
    // 2. Check if they own that item, or have permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some((permission) =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );
    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }
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
  async updatePermissions(parent, args, ctx, info) {
    // check if user is logged in
    if (!ctx.request.userId) {
      throw new Error("Must be logged in!");
    }
    // query current user
    const currentUser = await ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    );
    // check for sufficient permissions
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);
    // update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: { id: args.userId },
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // check if logged in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be signed in");
    }
    // Query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: { user: { id: userId }, item: { id: args.id } },
    });

    // check if item is already in the cart - increment or ...
    if (existingCartItem) {
      console.log("This item is already in their cart!");
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      );
    }
    // add new item to cart
    console.log("Adding new item to their cart!");
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    //  find cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id,
        },
      },
      `{id,user{id}}`
    );
    //  make sure we found an item
    if (!cartItem) {
      throw new Error("No Cart Item Found!");
    }
    //  make sure the user owns that cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("This item does not belong to your cart!");
    }
    //  delete that cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id },
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    //  query current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId)
      throw new Error("You must be signed in to complete this order");
    const user = await ctx.db.query.user(
      {
        where: { id: userId },
      },
      `{
        id
        name
        email
        cart {
          id
          quantity
          item {
            title
            price
            id
            description
            image
            largeImage
              }
              }
        }`
    );
    //  recalculate total for price on server side for safety
    const amount = user.cart.reduce((tally, cartItem) => {
      return tally + cartItem.item.price * cartItem.quantity;
    }, 0);
    console.log(`Going to charge for a total of ${amount}`);
    //  create the stripe charge (token >> money)
    //  see docs for more args that can be passed in the charge such as description etc.
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token,
    });
    //  convert the cartItems to OrderItems
    const orderItems = user.cart.map((cartItem) => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });
    //  create the Order
    //  like "connect" prisma method, "create" has special functionality and
    //  will take the array of orderItems from above and automatically create several items at once
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });
    //  clear the user's cart after purchase
    //  delete the cartItems from db
    const cartItemIds = user.cart.map((cartItem) => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: { id_in: cartItemIds },
    });
    //  return order to client
    return order;
  },
};

module.exports = Mutations;
