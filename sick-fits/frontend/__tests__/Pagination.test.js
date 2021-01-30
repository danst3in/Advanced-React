import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import Router from "next/router";
import { MockedProvider } from "react-apollo/test-utils";
import wait from "waait";
import Pagination, { PAGINATION_QUERY } from "../components/Pagination";

// mock the router to handle the prefetch calls causing errors
Router.router = {
  push() {},
  prefetch() {},
};

function makeMocksFor(length) {
  return [
    {
      request: { query: PAGINATION_QUERY },
      result: {
        data: {
          itemsConnection: {
            __typename: "aggregate",
            aggregate: {
              __typename: "count",
              count: length,
            },
          },
        },
      },
    },
  ];
}

describe("<Pagination />", () => {
  it("displays a loading message", () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(1)}>
        <Pagination page={1} />
      </MockedProvider>
    );

    const pagination = wrapper.find('[data-test="pagination"]');
    // console.log(wrapper.debug());
    // console.log(pagination.debug());
    expect(wrapper.text()).toContain("Loading...");
  });

  it("renders pagination for 18 items", async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={1} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find(".totalPages").text()).toEqual("5");
    const pagination = wrapper.find('div[data-test="pagination"]');
    expect(toJSON(pagination)).toMatchSnapshot();
    // console.log(pagination.debug());
  });

  it("disables Prev button on first page", async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={1} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.find("a.prev").debug());
    expect(wrapper.find("a.prev").prop("aria-disabled")).toEqual(true);
    expect(wrapper.find("a.next").prop("aria-disabled")).toEqual(false);
  });

  it("disables Next button on last page", async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={5} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.find("a.prev").debug());
    expect(wrapper.find("a.prev").prop("aria-disabled")).toEqual(false);
    expect(wrapper.find("a.next").prop("aria-disabled")).toEqual(true);
  });

  it("enables Prev and Next buttons on a middle page", async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={3} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.find("a.prev").debug());
    expect(wrapper.find("a.prev").prop("aria-disabled")).toEqual(false);
    expect(wrapper.find("a.next").prop("aria-disabled")).toEqual(false);
  });
});
