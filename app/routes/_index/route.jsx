import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import indexStyles from "./styles.module.css";

export const links = () => [{ rel: "stylesheet", href: indexStyles }];

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({ showForm: Boolean(login) });
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div datatype="index">
      <div datatype="content">
        <img
          src="https://cdn.shopify.com/s/files/1/0656/2096/7579/files/ScriptInjector_New.png?v=1727415720"
          alt="login_logo"
          style={{ margin: "0 auto" }}
          height="100"
          width="100"
        />
         <h1>Welcome to ScripInjector App</h1>
         <p>Enhance Your Storefront with Flexible Script Integration.</p>
        {showForm && (
          <Form method="post" class="form" action="/auth/login">
            <label>
              <span datatype="labelSpan">Shop domain:</span>
              <input type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button type="submit">Log in</button>
          </Form>
        )}
      </div>
    </div>
  );
}
