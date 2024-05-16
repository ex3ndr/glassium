import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <title>Glassium - App for AI Wearables</title>
                <meta name="description" content="All-in-one app for AI Wearable devices" />
                <meta property="og:title" content="Glassium" />
                <meta property="og:site_name" content="Glassium" />
                <meta property="og:description" content="All-in-one app for AI Wearable devices" />
                <meta property="og:image" content="/social.jpg" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <ScrollViewStyleReset />
            </head>
            <body>{children}</body>
        </html>
    );
}