import ItemComponent from "../components/Item";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A Cool Item",
  price: 5000,
  description: "This item is really cool!",
  image: "dog.jpg",
  largeImage: "largedog.jpg",
};

describe("<Item/>", () => {
  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});

// describe("<Item/>", () => {
//   it("renders the image properly", () => {
//     const wrapper = shallow(<ItemComponent item={fakeItem} />);
//     console.log("🚀 ~ file: Item.js ~ line 16 ~ it ~ wrapper", wrapper.debug());
//     const img = wrapper.find("img");
//     // console.log("img.debug", img.debug());
//     // console.log("img.props", img.props());
//     expect(img.props().src).toBe(fakeItem.image);
//     expect(img.props().alt).toBe(fakeItem.title);
//   });
//   it("renders the pricetag and title properly", () => {
//     const wrapper = shallow(<ItemComponent item={fakeItem} />);
//     const PriceTag = wrapper.find("PriceTag");
//     console.log(PriceTag.dive().text());
//     // console.log("🚀 ~ file: Item.js ~ line 16 ~ it ~ wrapper", wrapper.debug());
//     expect(PriceTag.children().text()).toBe("$50");
//     expect(wrapper.find("Title a").text()).toBe(fakeItem.title);
//   });
//   it("renders out the buttons properly", () => {
//     const wrapper = shallow(<ItemComponent item={fakeItem} />);
//     const buttonList = wrapper.find(".buttonList");
//     expect(buttonList.children()).toHaveLength(3);
//     // expect(buttonList.find("Link")).toHaveLength(1);
//     // expect(buttonList.find("Link")).toBeTruthy();
//     expect(buttonList.find("Link").exists()).toBe(true);
//     expect(buttonList.find("AddToCart").exists()).toBe(true);
//     expect(buttonList.find("DeleteItem").exists()).toBe(true);
//   });
// });
