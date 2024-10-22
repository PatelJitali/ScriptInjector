import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
  EmptyState,
  Layout,
  Banner,
  LegacyCard,
  DataTable,
  Pagination,
  Frame,
  Modal,
  TextContainer,
  Toast,
  ButtonGroup,
  Badge,
  Grid
} from "@shopify/polaris";
import { useLoaderData, useNavigate, useLocation, useSubmit, useActionData } from "@remix-run/react";
import axios from "axios";
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);  
   const themeData = await fetch(`https://${session?.shop}/admin/api/2024-07/themes.json`, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': session.accessToken,
      'Content-Type': 'application/json',
    },
  });
  
  const result = await themeData.json();
  
  const activeTheme = result.themes.find((theme) => theme.role === 'main');
  if (activeTheme) {
    const themeData = await fetch(
      `https://${session?.shop}/admin/api/2023-01/themes/${activeTheme.id}/assets.json?asset[key]=config/settings_data.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': session.accessToken,
        },
      }
    );
  
    const resultData = await themeData.json();
    var appEmbedEnabled ;
    var blockType ;
    var appID;
       if (resultData.asset && resultData.asset.value) {
      const settingsData = JSON.parse(resultData.asset.value);
      if(settingsData.current && settingsData.current.blocks){
      Object.values(settingsData.current.blocks).forEach((block) => {
        if ((block.type.includes('scriptinjector-new') && block.type.includes('front_script_body'))) {
          const typeParts = block.type.split('/');
           blockType = typeParts[typeParts.length - 2];
           appID = typeParts[typeParts.length - 1];  
          }else{
          
            appID = process.env.SHOPIFY_HEADER_BODY_SCRIPTS_ID;
            blockType = 'front_script_body';
            appEmbedEnabled = false;
          }
        });
        appEmbedEnabled = Object.values(settingsData.current.blocks).some(
         (block) => (block.type.includes('scriptinjector-new') && block.type.includes('front_script_body')) && block.disabled === false
      );
    } else{
      appID = process.env.SHOPIFY_HEADER_BODY_SCRIPTS_ID;
      blockType = 'front_script_body';
      appEmbedEnabled = false;
    }
  }
    var headerappEmbedEnabled ;
    var headerblockType ;
    var headerappID;


    if (resultData.asset && resultData.asset.value) {
      const settingsData = JSON.parse(resultData.asset.value);
      if(settingsData.current && settingsData.current.blocks){
      Object.values(settingsData.current.blocks).forEach((block) => {
        if ((block.type.includes('scriptinjector-new') && block.type.includes('front_script_header'))) {
          const typeParts = block.type.split('/');
           headerblockType = typeParts[typeParts.length - 2];
           headerappID = typeParts[typeParts.length - 1]; 
          }else{
          
            headerappID = process.env.SHOPIFY_HEADER_BODY_SCRIPTS_ID;
           
            headerblockType = 'front_script_header';
            headerappEmbedEnabled = false;
          }
        });
        headerappEmbedEnabled = Object.values(settingsData.current.blocks).some(
         (block) => (block.type.includes('scriptinjector-new') && block.type.includes('front_script_header')) && block.disabled === false
      );
    } else{
      headerappID = process.env.SHOPIFY_HEADER_BODY_SCRIPTS_ID;
      headerblockType = 'front_script_header';
      headerappEmbedEnabled = false;
    }
  }
  }
  const response = await admin.graphql(`
    query {
        shop {
            id
            name
            email
            myshopifyDomain
        }
    }
`);

const responseBody = await response.json();
const shopData = responseBody.data.shop;

const scriptData = await fetch(`https://checklist.codecrewinfotech.com/api/header?storename=${session.shop}`, {
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'x-api-key': 'abcdefg',
    },
});

if (!scriptData.ok) {
    throw new Error(`HTTP error! status: ${scriptData.status}`);
}

const responseData = await scriptData.json();

await admin.graphql(`
    mutation {
        metafieldsSet(metafields: [
            {
                ownerId: "${shopData.id}",  
                namespace: "custom-script",
                key: "header-script",
                value: ${JSON.stringify(JSON.stringify(responseData))},
                type: "json"
            }
        ]) {
            metafields {
                id
            }
        }
    }
`);
return json({
  ...session,
  appEmbedEnabled,
  headerappEmbedEnabled,
  appID,
  blockType,
  headerappID,
  headerblockType
});
};

export const action = async ({ request }) => {
  const { admin ,session  } = await authenticate.admin(request);
  
  if (request.method !== "DELETE") {
    return json({ message: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const id = formData.get("id");

  try {
    await axios.delete(`https://checklist.codecrewinfotech.com/api/header/${id}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'x-api-key': 'abcdefg',
      }
    });
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

const setBannerDismissed = (hours) => {
  const expiryTime = new Date().getTime() + hours * 60 * 60 * 1000;
  localStorage.setItem("bannerDismissedExpiry", expiryTime);
};

const isBannerDismissed = () => {
  const expiryTime = localStorage.getItem("bannerDismissedExpiry");
  if (!expiryTime) return false;
  return new Date().getTime() < expiryTime;
};


const Test = () => {
  const {appEmbedEnabled, headerappEmbedEnabled, appID,blockType,headerappID,headerblockType } = useLoaderData()
  const [appEmbedStatus, setappEmbedStatus] = useState(appEmbedEnabled);
  const [headerappEmbedStatus, setheaderappEmbedStatus] = useState(headerappEmbedEnabled);
  const shopName1 = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = useSubmit();
  const actionData = useActionData();
  const [data, setData] = useState([]);
  const [showBanner, setShowBanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalActive, setModalActive] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastActive, setToastActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  const shopNameParts = shopName1.shop.split('.')
  const shopNameUrl = shopNameParts[0];
   
  useEffect(() => {
    const bannerDismissed = isBannerDismissed();
    if (bannerDismissed) {
      setShowBanner(false);
    }
  }, []);

  const handleBannerDismiss = () => {
    setBannerDismissed(24); 
    setShowBanner(false);
  };

  useEffect(() => {
    window.globalShopName = shopName1.shop;
    headerData();
  }, [shopName1.shop]);

  useEffect(() => {
    localStorage.setItem('shopName', shopName1.shop);
  }, [shopName1.shop]);

  useEffect(() => {
    if (location.state && location.state.updated) {
      setToastActive(true);
      window.history.replaceState({}, document.title); 
    }
  }, [location]);
  useEffect(() => {
    if (actionData?.success) {
      setToastActive(true);
      headerData(); 
    }
  }, [actionData]);

  async function headerData() {
    try {
      const response = await axios.get(
        `https://checklist.codecrewinfotech.com/api/header?storename=${shopName1.shop}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'x-api-key': 'abcdefg',
          },
        }
      );
      
      if (Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData([]); 
      }
    } catch (error) {
      setData([]); 
    }
  }

  const handleEdit = (id) => {
    navigate(`/app/edit/${id}`, {
      state: { id: id }
    });
};

   const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setModalActive(true);
  };

  const handleModalChange = useCallback(() => setModalActive(!modalActive), [modalActive]);

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('id', itemToDelete);
      
      const newTotalItems = data.length - 1; 
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      
      const isCurrentPageEmpty = currentItems.length === 1;
      
      if (isCurrentPageEmpty && currentPage > 1) {
        setCurrentPage(1);
      } else if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
      }
      
      await submit(formData, { method: 'delete' });
      setModalActive(false);
      setItemToDelete(null);

      await headerData();
  
      setIsLoading(false);
    }
  };
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(data) ? data.slice(indexOfFirstItem, indexOfLastItem) : [];

  const rows = Array.isArray(currentItems) 
  ? currentItems.map((item, index) => [
    <div style={{ padding: '15px'}}>
      <Text variant="bodyMd">{item.title}</Text>
    </div>,
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px' }}>
      <ButtonGroup variant="segmented">
        <Button size="slim" icon={EditIcon} onClick={() => handleEdit(item._id)}>Edit</Button>
        <Button variant="primary" tone="critical" size="slim" icon={DeleteIcon} onClick={() => handleDeleteClick(item._id)} destructive>Delete</Button>
      </ButtonGroup>
    </div>
  
  ]) 
  : [];


  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

  const toastMarkup = toastActive ? (
    <Toast content="Delete Data Successfully" onDismiss={toggleToastActive} />
  ) : null;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return (
    <Frame>
      <Page>
      <ui-title-bar title="Configuration Data"></ui-title-bar>
        <Layout>
          <Layout.Section>
            <InlineStack align="space-between">
              <Text variant="headingXl" as="h4" alignment="start">
              Script Injector Codes
              </Text>
              <Button variant="primary" onClick={() => navigate("/app/insert_data")}>
                Add Script
              </Button>
            </InlineStack>
          </Layout.Section>
          
          
     
    <Layout.Section>
  <Grid>
    {/* body embed */}
    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
      {!appEmbedStatus && showBanner ? (
        <LegacyCard title="App Embed for body" sectioned>
          <Banner title="App embed is missing from live theme" tone="critical">
                <Button
                  url={`https://admin.shopify.com/store/${shopNameUrl}/themes/current/editor?context=apps&activateAppId=${appID}/${blockType}`}
                  target="_blank"
                >
                  Enable App Embed
                </Button>
          </Banner>
        </LegacyCard>
      ) : (
        appEmbedStatus && (
          <LegacyCard title="App Embed for body" sectioned>
            <Badge tone="success" progress="complete">
              Activated
            </Badge>
          </LegacyCard>
        )
      )}
    </Grid.Cell>

   {/* header embed */}
    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
      {!headerappEmbedStatus && showBanner ? (
        <LegacyCard title="App Embed for header" sectioned>
          <Banner title="App embed is missing from live theme" tone="critical">
                <Button
                  url={`https://admin.shopify.com/store/${shopNameUrl}/themes/current/editor?context=apps&activateAppId=${headerappID}/${headerblockType}`}
                  target="_blank"
                >
                  Enable App Embed
                </Button>
          </Banner>
        </LegacyCard>
      ) : (
        headerappEmbedStatus && (
          <LegacyCard title="App Embed for header" sectioned>
            <Badge tone="success" progress="complete">
              Activated
            </Badge>
          </LegacyCard>
        )
      )}
    </Grid.Cell>
  </Grid>
</Layout.Section>


          <Layout.Section>
            <LegacyCard>
              {data.length === 0 ? (
                <Card>
                  <EmptyState
                    heading="You don't have any code"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Once you have a code it will display on this page.</p>
                  </EmptyState>
                </Card>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text',
                    
                    ]}
                    headings={[
                      <div style={{ paddingLeft: '15px' }}>
                      <Text variant="bodyMd" fontWeight="bold">Title</Text>
                    </div>,
                      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' , paddingRight: '70px'}}>
                        <Text variant="bodyMd" fontWeight="bold">Action</Text>
                      </div>,
                    ]}
                    rows={rows}
                    hideScrollIndicator
                  />
                  
                    {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '16px 0',
                        borderTop: 'solid 1px rgb(233 222 222)'
                    }}>
                      <Pagination
                        label={`Page ${currentPage} of ${totalPages}`}
                        hasPrevious={currentPage > 1}
                        onPrevious={() => setCurrentPage(prev => prev - 1)}
                        hasNext={indexOfLastItem < totalItems}
                        onNext={() => setCurrentPage(prev => prev + 1)}
                      />
                    </div>
                  )}
                
                </>
              )}
            </LegacyCard>
          </Layout.Section>
        </Layout>

        <Modal
          open={modalActive}
          onClose={handleModalChange}
          title="Confirm Deletion"
          primaryAction={{
            content: 'Delete',
            onAction: handleConfirmDelete,
            destructive: true,
            loading: isLoading,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleModalChange,
            },
          ]}
        >
          <Modal.Section>
            <TextContainer>
              <p>Are you sure you want to delete this item?</p>
            </TextContainer>
          </Modal.Section>
        </Modal>
        {toastMarkup}
      </Page>
    </Frame>
  );
};

export default Test;