import React, { Component } from "react";
import PropTypes from "prop-types";
import StripeCheckout from "react-stripe-checkout";
import { Mutation } from "react-apollo";
import Router from "next/router";
import NProgress from "nprogress";
import gql from "graphql-tag";
import calcTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => {
    return tally + cartItem.quantity;
  }, 0);
}

export default class TakeMyMoney extends Component {
  // static propTypes = {
  //   prop: PropTypes,
  // };
  onToken = (res) => {
    console.log("On Token Call");
    console.log("token res.id", res.id);
  };

  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <StripeCheckout
            amount={calcTotalPrice(me.cart)}
            name="Sicks Fits"
            description={`Order of ${totalItems(me.cart)} items.`}
            image={me.cart[0].item && me.cart[0].item.image}
            stripeKey="pk_test_51IDhH4F9fGfPVE2oe5sTUZITtvo1ArKF2mDNulrX7bmOepBE6vVEiCU0BO0xt5bmaxHCW6PHAI4x806712szmjUM00apgzZMP0"
            currency="USD"
            email={me.email}
            token={(res) => this.onToken(res)}
          >
            {this.props.children}
          </StripeCheckout>
        )}
      </User>
    );
  }
}
