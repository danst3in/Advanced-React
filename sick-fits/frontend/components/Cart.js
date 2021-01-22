import gql from "graphql-tag";
import link from "next/link";
import React from "react";
import { Mutation, Query } from "react-apollo";
import CartStyles from "./styles/CartStyles";
import CloseButton from "./styles/CloseButton";
import SickButton from "./styles/SickButton";
import Supreme from "./styles/Supreme";
import User from "./User";
import CartItem from "./CartItem";
import calcTotalPrice from "../lib/calcTotalPrice";
import formatMoney from "../lib/formatMoney";

export const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;
export const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Cart = () => (
  <User>
    {({ data: { me } }) => {
      if (!me) {
        return null;
      }
      console.log("me", me);
      return (
        <Mutation mutation={TOGGLE_CART_MUTATION}>
          {(toggleCart) => (
            <Query query={LOCAL_STATE_QUERY}>
              {({ data }) => (
                <CartStyles open={data.cartOpen}>
                  <header>
                    <CloseButton title="close" onClick={toggleCart}>
                      &times;
                    </CloseButton>
                    <Supreme>{me.name}'s Cart</Supreme>
                    <p>
                      You have {me.cart.length} Item
                      {me.cart.length === 1 ? "" : "s"} in your cart
                    </p>
                  </header>
                  <ul>
                    {me.cart.map((cartItem) => (
                      <CartItem key={cartItem.id} cartItem={cartItem} />
                    ))}
                  </ul>
                  <footer>
                    <p>{formatMoney(calcTotalPrice(me.cart))}</p>
                    <SickButton>Checkout</SickButton>
                  </footer>
                </CartStyles>
              )}
            </Query>
          )}
        </Mutation>
      );
    }}
  </User>
);

export default Cart;
