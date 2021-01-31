import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import Router from "next/router";
import React from "react";
import { MockedProvider } from "react-apollo/test-utils";
import wait from "waait";
import CreateItem, { CREATE_ITEM_MUTATION } from "../components/CreateItem";
import { fakeItem } from "../lib/testUtils";

const dogImage = "https://dog.com/dog.jpg";
// mock the global fetch api as used in original file
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({
    secure_url: dogImage,
    eager: [{ secure_url: dogImage }],
  }),
});

describe("<CreateItem/>", async () => {
  it("renders and matches snapshot", () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it("uploads a file when changed", async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const input = wrapper.find('input[type="file"]');
    input.simulate("change", { target: { files: ["fakedog.jpg"] } });
    await wait();
    const component = wrapper.find("CreateItem").instance(); // peer into component instance to check state
    console.log(component);
    expect(component.state.image).toEqual(dogImage);
    expect(component.state.largeImage).toEqual(dogImage);
    expect(global.fetch).toHaveBeenCalled();
    // expect(global.fetch).toHaveBeenCalledWith("abc"); // obvious incorrect value will expose actual call values in error message
    global.fetch.mockReset();
  });

  it("handles state updating", async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );

    wrapper
      .find("#title")
      .simulate("change", { target: { value: "Testing", name: "title" } });

    wrapper.find("#price").simulate("change", {
      target: { value: 50000, name: "price", type: "number" },
    });

    wrapper.find("#description").simulate("change", {
      target: { value: "Nice item", name: "description" },
    });

    expect(wrapper.find(CreateItem).instance().state).toMatchObject({
      description: "Nice item",
      image: "",
      largeImage: "",
      price: 50000,
      title: "Testing",
    });
  });

  it("creates an item when the form is submitted ", async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            image: "",
            largeImage: "",
            price: item.price,
          },
        },
        result: {
          data: {
            createItem: {
              ...item,
              __typename: "Item",
            },
          },
        },
      },
    ];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find("#title")
      .simulate("change", { target: { value: item.title, name: "title" } });

    wrapper.find("#price").simulate("change", {
      target: { value: item.price, name: "price", type: "number" },
    });

    wrapper.find("#description").simulate("change", {
      target: { value: item.description, name: "description" },
    });

    // mock the router submitting form to backend for creation and rerouting to new item page
    Router.router = { push: jest.fn() };
    wrapper.find("form").simulate("submit");
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: "/item",
      query: { id: "abc123" },
    });
  });
});
