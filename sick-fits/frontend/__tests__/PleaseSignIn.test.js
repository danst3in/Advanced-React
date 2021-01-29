import { mount } from "enzyme";
import { MockedProvider } from "react-apollo/test-utils";
import wait from "waait";
import PleaseSignIn from "../components/PleaseSignIn";
import { CURRENT_USER_QUERY } from "../components/User";
import { fakeUser } from "../lib/testUtils";

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } },
  },
];
const signedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } },
  },
];

describe("<PleaseSignIn />", () => {
  it("It renders the sign in dialog to logged out users", async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain("Please Sign In Before Continuing");

    const Signin = wrapper.find("Signin");
    // console.log(Signin.debug());
    expect(Signin.exists()).toBe(true);
    // console.log(wrapper.debug());
  });

  it("Renders the child component when the user is signed in", async () => {
    const Hey = () => <p>Hey!</p>;
    const wrapper = mount(
      <MockedProvider mocks={signedInMocks}>
        <PleaseSignIn>
          <Hey />
        </PleaseSignIn>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.debug());
    const hey = wrapper.find("Hey");
    console.log(hey.debug());
    expect(hey.exists()).toBe(true); // both this and below work
    expect(wrapper.contains(<Hey />)).toBe(true); // both this and above work
  });
});
