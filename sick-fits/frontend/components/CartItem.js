import React from "react";
import styled from "styled-components";
import formatMoney from "../lib/formatMoney";
import PropTypes from "prop-types";
import RemoveFromCart from "./RemoveFromCart";

const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${(props) => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
  }
`;

const CartItem = ({ cartItem }) => {
  // check if item exists
  if (!cartItem.item) {
    return (
      <CartItemStyles>
        This item has been removed
        <RemoveFromCart id={cartItem.id} />
      </CartItemStyles>
    );
  }
  return (
    <CartItemStyles>
      <img src={cartItem.item.image} alt={cartItem.item.title} width="100" />
      <div className="cart-item-details">
        <h3>{cartItem.item.title}</h3>
        <p>
          <em>{formatMoney(cartItem.item.price)} ea.</em> &times;
          <em>{cartItem.quantity}</em> &#61;{" "}
          {formatMoney(cartItem.item.price * +cartItem.quantity)}
        </p>
      </div>
      <RemoveFromCart id={cartItem.id} />
    </CartItemStyles>
  );
};

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired,
};

export default CartItem;
