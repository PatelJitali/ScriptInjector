import {
  Layout,
  Page,
  EmptyState,
  Card,
  Box,
  Text,
  InlineStack,
  BlockStack,
  Button,
} from "@shopify/polaris";
import main_ScriptInjector from "../assets/ScriptInjector_logo.png"
import head_ScriptInjector from "../assets/ScriptInjector.png";
import { useLoaderData } from "@remix-run/react";
import { apiVersion, authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);

    const { shop, accessToken } = session;
    const responseOfShop = await fetch(
      `https://${shop}/admin/api/${apiVersion}/shop.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
      },
    );

    if (!responseOfShop.ok) {
      throw new Error(
        `Failed to fetch shop details: ${responseOfShop.status} ${responseOfShop.statusText}`,
      );
    }

    const shopDetails = await responseOfShop.json();
    return { shopDetails };
  } catch (error) {
    console.log(error, "ErrorResponse");
    return { error: error.message };
  }
};

export default function FirstPagePage() {
  const data = useLoaderData();
  const [shopOwnerName, setShopOwnerName] = useState("");
  useEffect(() => {
    const shop = data?.shopDetails?.shop?.shop_owner;
    setShopOwnerName(shop);
  }, [data]);

  const greetings = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return "Morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Afternoon";
    } else {
      return "Evening";
    }
  };
  return (
    <Page>
      <ui-title-bar title="HomePage"></ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card>
            <Box
              style={{
                display: "flex",
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <>
                <Box>
                  <Box style={{ display: "flex" }}>
                    <Text as="h1" variant="headingXl">
                      Good {greetings()},&nbsp;
                    </Text>
                    {shopOwnerName && (
                      <Text
                        as="h1"
                        variant="headingXl"
                        style={{ display: "none" }}
                      >
                        {shopOwnerName} 👋
                      </Text>
                    )}
                  </Box>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="bodyLg">
                      Welcome to ScriptInjector App
                    </Text>
                  </Box>
                </Box>
                <img
                  src={head_ScriptInjector}
                  alt="ScriptInjector"
                  style={{
                    maxWidth: 100,
                    height: 70,
                    marginRight: "20px",
                    borderRadius: "50%",
                  }}
                />
              </>
            </Box>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Box padding="500">
              <BlockStack gap="300">
                <Box>
                  <InlineStack align="center">
                    <img
                      src={main_ScriptInjector}
                      alt="main_ScriptInjectorp"
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 5,
                        boxShadow:
                          "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                      }}
                    />
                  </InlineStack>
                </Box>
                <Box paddingBlockStart="500">
                  <InlineStack align="center">
                    <Text as="h2" variant="headingLg">
                      Welcome to ScriptInjector App
                    </Text>
                  </InlineStack>
                </Box>
                <Box paddingBlockStart="100">
                  <InlineStack align="center">
                    <Text as="p" variant="bodyLg">
                      Enhance Your Storefront with Flexible Script Integration
                    </Text>
                  </InlineStack>
                </Box>
                <Box paddingBlockStart="100">
                  <InlineStack align="center">
                    <Button size="large" url="/app/display_data">
                      Configure Data
                    </Button>
                  </InlineStack>
                </Box>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
