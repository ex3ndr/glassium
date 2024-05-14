import { useWindowDimensions } from 'react-native';

export function useLayout(): 'small' | 'large' {
    const dimensions = useWindowDimensions();
    return dimensions.width < 900 ? 'small' : 'large';
}