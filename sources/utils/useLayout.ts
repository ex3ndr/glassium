import * as React from 'react';
import { useWindowDimensions } from 'react-native';

export function useLayout(): 'small' | 'large' {
    const dimensions = useWindowDimensions();
    return dimensions.width < 600 ? 'small' : 'large';
}