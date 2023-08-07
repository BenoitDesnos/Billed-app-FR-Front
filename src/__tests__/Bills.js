/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

beforeAll(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "employee@test.tld",
      status: "connected",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.Bills);
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills page, I click on the icon eye", () => {
    test("Then a modal should appear and the image is rendered", async () => {
      const billUrl =
        "https://test.storage.tld/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3";
      const iconEye = screen.getAllByTestId("icon-eye");
      const secondEye = iconEye[1];
      const dialog = await screen.findByRole("dialog", { hidden: true });
      $.fn.modal = jest.fn();
      userEvent.click(secondEye);
      const img = screen.getByAltText("Bill");
      expect(dialog).toBeInTheDocument();
      expect($.fn.modal).toHaveBeenCalledWith("show");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", billUrl);
    });
  });
  describe("When I am on Bills page, I click on the button New Bill", () => {
    test("Then, should render the Add a New Bill Page", async () => {
      const btn = screen.getByTestId("btn-new-bill");
      userEvent.click(btn);
      expect(await screen.findByText("Envoyer une note de frais")).toBeTruthy();
    });
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const mailIcon = screen.getByTestId("icon-mail");
      await expect(mailIcon.classList.contains("active-icon")).toBe(true);
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as an employee", () => {
  describe("WWhen I am on Bills page", () => {
    test("Then fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      const dataMocked = jest.spyOn(mockStore.bills(), "list");
      mockStore.bills().list();
      await waitFor(() => {
        expect(dataMocked).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll("tbody tr").length).toBe(4);
        expect(screen.findByText("Mes notes de frais")).toBeTruthy();
      });
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      test("Then fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("Then fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});