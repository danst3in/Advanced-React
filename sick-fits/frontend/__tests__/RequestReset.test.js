import { mount } from "enzyme";
import wait from "waait";
import toJSON from "enzyme-to-json";
import RequestReset, {
  REQUEST_RESET_MUTATION,
} from "../components/RequestReset";
import { MockedProvider } from "react-apollo/test-utils";

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: "studio@dansteinphoto.com" },
    },
    result: {
      data: { requestReset: { message: "success", __typename: "Message" } },
    },
  },
];

describe("<RequesReset/>", () => {
  it("renders and matches the snapshot", async () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );

    // console.log(wrapper.debug());
    const form = wrapper.find('form[data-test="form"]');
    // console.log(form.debug());
    expect(toJSON(form)).toMatchSnapshot();
  });

  it("calls the Mutation", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );

    console.log(wrapper.debug());
    // simulate typing an email into the input
    wrapper.find("input").simulate("change", {
      target: { name: "email", value: "studio@dansteinphoto.com" },
    });
    //  submit the form
    wrapper.find("form").simulate("submit");
    await wait();
    wrapper.update();
    expect(wrapper.find("p").text()).toContain(
      "Success! Check your email for a reset link."
    );
    // console.log(wrapper.debug());
  });
});
