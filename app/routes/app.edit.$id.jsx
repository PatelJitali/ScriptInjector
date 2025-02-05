import { useNavigate, useLocation, useFetcher } from "@remix-run/react";
import {
    Button,
    Card,
    Page,
    TextField,
    Layout,
    PageActions,
    Toast,
    Frame,
    ContextualSaveBar
} from "@shopify/polaris";
import { useState, useEffect, useCallback } from 'react';
import axios from "axios";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import React from "react";
import { useParams } from "@remix-run/react";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    return session;
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const updateformData = await request.formData();

    const value = updateformData.get('value');
    const head = updateformData.get('head');
    const body = updateformData.get('body');
    const id = updateformData.get('id');
    const shopName = session.shop;

    try {
        const headerResponse = await axios.put(
            `https://checklist.codecrewinfotech.com/api/header/${id}`,
            {
                title: value,
                header: head,
                body: body,
                storename:shopName
            },
            {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'x-api-key': 'abcdefg',
                },
            }
        );
        
        console.log("new-res",headerResponse)

        if (headerResponse.status !== 200) {
            throw new Error(`Failed to update header: ${headerResponse.statusText}`);
        }

        // Fetch shop data
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

        // Fetch updated script data
        const scriptData = await fetch(`https://checklist.codecrewinfotech.com/api/header?storename=${shopName}`, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'x-api-key': 'abcdefg',
            },
        });

        if (!scriptData.ok) {
            throw new Error(`HTTP error! status: ${scriptData.status}`);
        }

        const responseData = await scriptData.json();

        // Update metafield
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

        return json({ success: true });
    } catch (error) { 
        console.error(error);
        return json({ success: false, error: error.message });
    }
};

const Edit = () => {
    const { id } = useParams(); 
    const [editValue, setEditValue] = useState('');
    const [editHead, setEditHead] = useState('');
    const [editBody, setEditBody] = useState('');
    const [active, setActive] = useState(false);
    const [valueError, setValueError] = useState('');
    const [headError, setHeadError] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 
    const [initialData, setInitialData] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const fetcher = useFetcher();

    // Toast states for error messages
    const [valueErrorToast, setValueErrorToast] = useState(false);
    const [headErrorToast, setHeadErrorToast] = useState(false);
    const [bodyErrorToast, setBodyErrorToast] = useState(false);
    const [backendErrorToast, setBackendErrorToast] = useState(false);
    const [backendErrorMessage, setBackendErrorMessage] = useState('');

    // Preload header data
    useEffect(() => {
        (async function fetchHeaderData() {
            try {
                const response = await axios.get(
                    `https://checklist.codecrewinfotech.com/api/header/${id}`,
                    {
                        headers: {
                            'ngrok-skip-browser-warning': 'true',
                            'x-api-key': 'abcdefg',
                        },
                    }
                );
                const headerData = response.data.header;
                setEditValue(headerData.title);
                setEditBody(headerData.body);
                setEditHead(headerData.header);
                setInitialData({
                    title: headerData.title,
                    body: headerData.body,
                    header: headerData.header,
                });
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching header data:", error);
                setIsLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!isLoading) {
            const isDataChanged =
                editValue !== initialData.title ||
                editHead !== initialData.header ||
                editBody !== initialData.body;
            setIsDirty(isDataChanged);
        }
    }, [editValue, editHead, editBody, initialData]);

    // Show toast on successful update
    useEffect(() => {
        if (fetcher.state === "idle") {
            if (fetcher.data?.success) {
                setActive(true);
                setIsDirty(false);

                const timeoutId = setTimeout(() => {
                    setActive(false);
                    navigate('/app/scriptdata');
                }, 1500);

                return () => clearTimeout(timeoutId);
            }
            if (fetcher.data?.error) {
                setBackendErrorMessage(fetcher.data.error);
                setBackendErrorToast(true);
                setIsLoading(false);
            }
        }
    }, [fetcher, navigate]);
    

    const handleChange = (value) => {
        setEditValue(value);
        if (value.length > 80) {
            setValueError('Subject Title cannot exceed 80 characters');
            setValueErrorToast(false); 
        } else if (!value.trim()) {
            setValueError(''); 
            setValueErrorToast(true);
        } else {

            setValueError('');
            setValueErrorToast(false);
        }
    };

    
    const validateForm = () => {
        let isValid = true;
    

        console.log("editValue",editValue)
        if (!editValue.trim()) {
            setValueError(''); 
            setValueErrorToast(true); 
            isValid = false;
        } else if (editValue.length > 80) {
            setValueError('Subject Title cannot exceed 80 characters');
            setValueErrorToast(false);
            isValid = false;
        } else {
            setValueError(''); 
            setValueErrorToast(false);
        }
        
        if (!editHead.trim() && !editBody.trim()) {
            setHeadError('Either header or body is required');
            setHeadErrorToast(true); 
            isValid = false;
        } else {
            setHeadError('');
            setBodyError('');
            setHeadErrorToast(false); 
        }
    
        return isValid;
    };
    
const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
        submitForm();
    }
};

    const submitForm = () => {
        const formData = new FormData();
        formData.append('value', editValue);
        formData.append('head', editHead);
        formData.append('body', editBody);
        formData.append('id', id);
        formData.append('shopName', location?.state?.shopName);

        fetcher.submit(formData, { method: "post" });
    };

    const handleDiscard = () => {
        setEditValue(initialData.title);
        setEditHead(initialData.header);
        setEditBody(initialData.body);
        setIsDirty(false);
        navigate('/app/scriptdata');
    };

    const toggleActive = useCallback(() => setActive((active) => !active), []);

    // Toast components for errors
    const valueErrorToastMarkup = valueErrorToast ? (
        <Toast content="Subject Title is required" error onDismiss={() => setValueErrorToast(false)} />
    ) : null;

    const headErrorToastMarkup = headErrorToast ? (
        <Toast content="Either header or body is required" error onDismiss={() => setHeadErrorToast(false)} />
    ) : null;

    const bodyErrorToastMarkup = bodyErrorToast ? (
        <Toast content="Either header or body is required" error onDismiss={() => setBodyErrorToast(false)} />
    ) : null;

    const backendErrorToastMarkup = backendErrorToast ? (
        <Toast content='Subject title already exist' error onDismiss={() => setBackendErrorToast(false)} />
    ) : null;

    const toastMarkup = active ? <Toast content="Update Data Successfully" onDismiss={toggleActive} /> : null;

    const back = () => navigate('/app/scriptdata');
    return (
        <Frame
            logo={{
                width: 86,
                contextualSaveBarSource:
                    'https://cdn.shopify.com/s/files/1/2376/3301/files/Shopify_Secondary_Inverted.png',
            }}>
            {isDirty && (
                <ContextualSaveBar
                    
                    message="Unsaved changes"
                    saveAction={{
                        onAction: handleSubmit,
                        loading: fetcher.state === "submitting",
                        disabled: fetcher.state === "submitting",
                    }}
                    discardAction={{
                        onAction: handleDiscard,
                    }}
                />
            )}
            <Page backAction={{ content: 'Settings', onAction: back }} title="Edit Code">
                <fetcher.Form method="post" onSubmit={handleSubmit}>
                    <Layout>
                        <Layout.Section>
                            <Card roundedAbove="sm">
                                <TextField
                                    label={
                                        <React.Fragment>
                                            Subject Title <span style={{ color: 'red' }}>*</span>
                                        </React.Fragment>
                                    }
                                    value={editValue}
                                    // onChange={handleChange(editValue)}
                                    onChange={(editValue) => {
                                        handleChange(editValue);
                                    }}

                                    onBlur={() => {
                                        if (!editValue) {
                                            setValueError('');  // Don't show inline error for required
                                            setValueErrorToast(true);  // Trigger the toast for required field
                                        }
                                    }}
                                    error={valueError}  // Show inline error if the character limit exceeds
                                    autoComplete="off"
                                    name="value"
                                />

                            </Card>
                        </Layout.Section>
                        <Layout.Section>
                            <Card roundedAbove="sm">
                                <TextField
                                    label="Code For header"
                                    value={editHead}
                                    onChange={(value) => {
                                        setEditHead(value);
                                        if (value) setHeadError('');  // Clear error on change
                                    }}
                                    onBlur={() => {
                                        if (!editHead) {
                                            setHeadError('Code in the header is required');  // Validate on blur
                                        }
                                    }}
                                    multiline={14}
                                    helpText="This code will be printed in the <head> section."
                                    autoComplete="off"

                                    name="head"
                                />
                            </Card>
                        </Layout.Section>
                        <Layout.Section>
                            <Card roundedAbove="sm">
                                <TextField
                                    label="Code For body"
                                    value={editBody}
                                    onChange={(value) => setEditBody(value)}
                                    multiline={14}
                                    helpText="This code will be printed above the </body> tag."
                                    autoComplete="off"
                                    name="body"
                                />
                            </Card>
                            <input type="hidden" name="id" value={id} />
                            <input type="hidden" name="shopName" value={location?.state?.shopName} />
                            <PageActions
                                primaryAction={{ content: 'Update', submit: true }}
                                secondaryActions={{ content: 'Cancel', onAction: back }}
                            />
                        </Layout.Section>
                    </Layout>
                </fetcher.Form>
            </Page>
            {valueErrorToastMarkup}
            {headErrorToastMarkup}
            {bodyErrorToastMarkup}
            {backendErrorToastMarkup}
            {toastMarkup}

        </Frame>
    );
};

export default Edit;
