import Head from 'expo-router/head';

export const DefaultMetatags = () => {
    return (
        <Head>
            <title>Glassium - App for AI Wearables</title>
            <meta name="description" content="All-in-one app for AI Wearable devices" />
            <meta property="og:title" content="Glassium" />
            <meta property="og:site_name" content="Glassium" />
            <meta property="og:description" content="All-in-one app for AI Wearable devices" />
            <meta property="og:image" content="/social.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:type" content="website"/>
        </Head>
    );
}