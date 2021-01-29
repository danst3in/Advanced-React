import SingleItem, { SINGLE_ITEM_QUERY } from "../components/SingleItem";
import { mount } from "enzyme";
import toJSON, { toJson } from "enzyme-to-json";
import wait from "waait";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeItem } from "../lib/testUtils";

describe("<SingleItem />", () => {
  it("renders with proper data", async () => {
    const mocks = [
      {
        // when a request is made with this query and variables
        request: { query: SINGLE_ITEM_QUERY, variables: { id: "123" } },
        // return this fake data (mocked data)
        result: {
          data: {
            item: fakeItem(),
          },
        },
      },
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    // expect(wrapper.text()).toContain("Loading...");
    await wait(); // pushes following code further up the call stack, gives time to get past Loading
    wrapper.update();
    // console.log(wrapper.debug());
    // expect(toJSON(wrapper)).toMatchSnapshot(); // too messy of snapshot, includes ApolloProvider
    expect(toJSON(wrapper.find("h2"))).toMatchSnapshot();
    expect(toJSON(wrapper.find("img"))).toMatchSnapshot();
    expect(toJSON(wrapper.find("p"))).toMatchSnapshot();
  });

  it("Errors with non-found item", async () => {
    const mocks = [
      {
        request: { query: SINGLE_ITEM_QUERY, variables: { id: "123" } },
        // return this fake data (mocked data)
        result: {
          errors: [
            {
              message: "Item Not Found!",
            },
          ],
        },
      },
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    console.log(wrapper.debug());
    const item = wrapper.find('[data-test="graphql-error"]');
    expect(item.text()).toContain("Item Not Found!");
    expect(toJSON(item)).toMatchSnapshot();
  });
});
