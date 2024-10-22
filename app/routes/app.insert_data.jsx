import { useNavigate, useActionData, Form, useSubmit } from "@remix-run/react";
import { Button, Card, Page, TextField, Layout, PageActions, Toast, Frame, ContextualSaveBar } from "@shopify/polaris";
import { useState, useEffect, useCallback } from 'react';
import React from "react";
import axios from "axios";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    return session;
};

export const action = async ({ request }) => {

    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const value = formData.get('value');
    const head = formData.get('head');
    const body = formData.get('body');
    const shopName = formData.get('shopName');

    try {
        // Your existing API call
        const headerResponse = await axios.post(
            `https://checklist.codecrewinfotech.com/api/header`,
            {
                title: value,
                header: head,
                body: body,
                storename: shopName
            },
            {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'x-api-key': 'abcdefg',
                },
            }
        );

        if (headerResponse.status !== 201) {
            throw new Error(`Failed to add header: ${headerResponse.statusText}`);
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

        // Fetch script data
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
        const metafieldUpdateResponse = await admin.graphql(`
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

const Test = () => {
    const shopName1 = useLoaderData();
    const actionData = useActionData();
    const navigate = useNavigate();
    const submit = useSubmit();
    const [value, setValue] = useState('');
    const [head, setHead] = useState('');
    const [body, setBody] = useState('');
    const [active, setActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [valueError, setValueError] = useState('');
    const [headError, setHeadError] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [initialData, setInitialData] = useState({ value: '', head: '', body: '' });

    // Toast states for error messages
    const [valueErrorToast, setValueErrorToast] = useState(false);
    const [headErrorToast, setHeadErrorToast] = useState(false);
    const [bodyErrorToast, setBodyErrorToast] = useState(false);
    const [backendErrorToast, setBackendErrorToast] = useState(false);
    const [backendErrorMessage, setBackendErrorMessage] = useState('');

    const toggleActive = useCallback(() => {
        setActive((active) => !active);
    }, []);

    useEffect(() => {
        if (actionData?.success) {
            setActive(true);
            setIsDirty(false);
            const timer = setTimeout(() => {
                setActive(false);
                navigate('/app/display_data');
            }, 1500);
            return () => clearTimeout(timer);
        }
        if (actionData?.error) {
            setBackendErrorMessage(actionData.error);
            setBackendErrorToast(true);
            setIsLoading(false);
        }
    }, [actionData, navigate]);

    useEffect(() => {
        setInitialData({ value, head, body });
    }, []);

    useEffect(() => {
        const isDataChanged =
            value !== initialData.value ||
            head !== initialData.head ||
            body !== initialData.body;
        setIsDirty(isDataChanged);
    }, [value, head, body, initialData]);



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

    const toastMarkup = active ? (
        <Toast content="Insert Data Successfully" onDismiss={toggleActive} />
    ) : null;

    const backendErrorToastMarkup = backendErrorToast ? (
        <Toast content='Subject title already exist' error onDismiss={() => setBackendErrorToast(false)} />
    ) : null;


    // Validate form and trigger toasts on errors
    function validateForm() {
        if (!value) {
            setValueError('');  
            setValueErrorToast(true); 
            return false;
        }

        
        if (!head && !body) {
            setHeadError('Either header or body is required');
            setBodyError('Either header or body is required');
            setHeadErrorToast(true);
            return false;
        } else {
            setHeadError('');
            setBodyError('');
        }

        return true;
    }
    function handleSubmit(event) {
        event.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            submit(event.currentTarget, { method: 'post' });
        }
    }

    function handleSave() {
        if (validateForm()) {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('value', value);
            formData.append('head', head);
            formData.append('body', body);
            formData.append('shopName', shopName1.shop);
            submit(formData, { method: 'post' });
        }
    }

    function handleDiscard() {
        setValue(initialData.value);
        setHead(initialData.head);
        setBody(initialData.body);
        setIsDirty(false);
        navigate('/app/display_data');
    }

    function back() {
        navigate('/app/display_data');
    }

    return (

        <Frame
            logo={{
                width: 86,
                contextualSaveBarSource:
                    'https://cdn.shopify.com/s/files/1/2376/3301/files/Shopify_Secondary_Inverted.png',
            }}
        >
            {isDirty && (
                <ContextualSaveBar
                    
                    message="Unsaved changes"
                    saveAction={{
                        onAction: handleSave,
                        loading: isLoading,
                        disabled: isLoading,
                    }}
                    discardAction={{
                        onAction: handleDiscard,
                    }}
                />
            )}


            <Page
                backAction={{ content: 'Settings', onAction: back }}
                title={`Add New Code`}
            >
                <Form method="post" onSubmit={handleSubmit}>
                    <Layout>
                        <Layout.Section>
                            <Card roundedAbove="sm">
                                <TextField
                                    label={
                                        <React.Fragment>
                                            Subject Title <span style={{ color: 'red' }}>*</span>
                                        </React.Fragment>
                                    }
                                    value={value}
                                    onChange={(newValue) => {
                                        if (newValue.length > 80) {
                                            setValueError('Subject Title cannot exceed 80 characters'); 
                                            setValueErrorToast(false);  
                                        } else {
                                            setValue(newValue);
                                            setValueError(''); 
                                        }
                                    }}
                                    error={valueError}  
                                    autoComplete="off"
                                    name="value"
                                />

                            </Card>
                        </Layout.Section>

                        <Layout.Section>
                            <Card roundedAbove="sm">
                                <TextField
                                    label="Code For header"
                                    value={head}
                                    onChange={(newValue) => {
                                        setHead(newValue);
                                        if (newValue || body) { 
                                            setHeadError('');
                                            setBodyError('');
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
                                    value={body}
                                    onChange={(newValue) => {
                                        setBody(newValue);
                                        if (newValue || head) {
                                            setBodyError('');
                                            setHeadError('');
                                        }
                                    }}
                                    multiline={14}
                                    helpText="This code will be printed above the </body> tag."
                                    autoComplete="off"

                                    name="body"
                                />
                            </Card>
                            <input type="hidden" name="shopName" value={shopName1.shop} />
                            <PageActions
                                primaryAction={{ content: 'Save', submit: true, disabled: isLoading }}
                                secondaryActions={{ content: 'Cancel', onAction: back }}
                            />
                        </Layout.Section>
                    </Layout>
                </Form>
            </Page>
          
            {valueErrorToastMarkup}
            {headErrorToastMarkup}
            {bodyErrorToastMarkup}
            {backendErrorToastMarkup}
            {toastMarkup}

        </Frame>

    );
};

export default Test;