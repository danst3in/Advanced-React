import React, { Component } from "react";
import { Mutation, Query } from "react-apollo";
import gql from "graphql-tag";
import Router from "next/router";
import Form from "./styles/Form";
import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage";

export const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`;

export const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    $id: ID!
    $title: String
    $description: String
    $price: Int
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
    ) {
      id
      title
      description
      price
    }
  }
`;

export default class UpdateItem extends Component {
  state = {};

  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({ [name]: val });
  };

  updateItem = async (e, UpdateItemMutation) => {
    //  stop submission
    e.preventDefault();
    // //  call mutation
    const res = await UpdateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      },
    });

    console.log("Updating Item!!");
    console.log(this.state);
  };

  render() {
    return (
      <Query
        query={SINGLE_ITEM_QUERY}
        variables={{
          id: this.props.id,
        }}
      >
        {({ data, error, loading }) => {
          console.log(
            "🚀 ~ file: UpdateItem.js ~ line 56 ~ UpdateItem ~ render ~ data, error, loading",
            data,
            error,
            loading
          );
          if (!data.item) {
            return <p>No Item found for the submitted ID {this.props.id}</p>;
          }
          if (loading) {
            return <p>Loading...</p>;
          }
          return (
            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                <Form onSubmit={(e) => this.updateItem(e, updateItem)}>
                  <Error error={error} />
                  <fieldset disabled={loading} aria-busy={loading}>
                    {/* <label htmlFor="file">
                Image
                <input
                type="file"
                name="file"
                id="file"
                placeholder="Upload an image"
                required
                onChange={this.uploadFile}
                />
                {this.state.image && (
                  <img
                  width="200"
                  src={this.state.image}
                  alt="Upload Preview"
                  />
                  )}
                </label> */}
                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        name="title"
                        id="title"
                        placeholder="Title"
                        required
                        defaultValue={data.item.title}
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
                        defaultValue={data.item.price}
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
                        defaultValue={data.item.description}
                        onChange={this.handleChange}
                      />
                    </label>
                    <button type="submit">
                      Sav{loading ? "ing" : "e"} Changes
                    </button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}
