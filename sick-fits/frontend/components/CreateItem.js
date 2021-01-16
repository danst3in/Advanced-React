import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Form from "./styles/Form";
import formatMoney from "../lib/formatMoney";

export const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION {
    createItem
  }
`;

export default class CreateItem extends Component {
  state = {
    title: "Sample Title",
    description: "Love what you did",
    image: "sample.jpg",
    largeImage: "large-sample.jpg",
    price: 2000,
  };

  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({ [name]: val });
  };

  render() {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          console.log(this.state);
        }}
      >
        <fieldset>
          <label htmlFor="title">
            Title
            <input
              type="text"
              name="title"
              id="title"
              placeholder="Title"
              required
              value={this.state.title}
              onChange={this.handleChange}
            />
          </label>
          <label htmlFor="price">
            Price
            <input
              type="number"
              name="price"
              id="price"
              placeholder="Price"
              required
              value={this.state.price}
              onChange={this.handleChange}
            />
          </label>
          <label htmlFor="description">
            Description
            <textarea
              type="text"
              name="description"
              id="description"
              placeholder="Enter a description"
              required
              value={this.state.description}
              onChange={this.handleChange}
            />
          </label>
          <button type="submit">Submit</button>
        </fieldset>
      </Form>
    );
  }
}
