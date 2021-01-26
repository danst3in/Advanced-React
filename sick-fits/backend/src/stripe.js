module.exports = require("stripe")(process.env.STRIPE_SECRET);

// this can also be written as...
/* 
const stripe = require('stripe')
const config = stripe(process.env.STRIPE_SECRET)
module.exports = config
 */
