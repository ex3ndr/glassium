import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Text, View } from 'react-native';
import { Maybe } from '@/utils/types';
import { randomKey } from '@/modules/crypto/randomKey';

export type ModalContextType = {
    current: string | null,
    close: (id?: Maybe<string> | Array<string>) => void,
    show: (c: React.ReactNode, parent?: Maybe<string>) => string
};

const ModalContext = React.createContext<ModalContextType | null>(null);

export function useModal() {
    const context = React.useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}

type ModalItem = {
    key: string,
    node: React.ReactNode,
    parent: string | null
}

function removeModalById(src: ModalItem[], key: string): ModalItem[] {

    // Remove item
    let res: ModalItem[] = [];
    let child: string[] = [];
    for (let i = 0; i < src.length; i++) {
        if (src[i].key !== key) {
            res.push(src[i]);
        } else {
            if (src[i].parent === key) {
                child.push(src[i].key);
            }
        }
    }

    // Remove child
    for (let ch of child) {
        res = removeModalById(res, ch);
    }

    return res;
}

function removeModals(src: ModalItem[], id?: Maybe<string> | Array<string>): ModalItem[] {
    if (src.length > 0) {
        if (typeof id === 'string') {
            return removeModalById(src, id);
        } else if (Array.isArray(id)) {
            for (let i of id) {
                src = removeModalById(src, i);
            }
            return src;
        } else {
            return removeModalById(src, src[src.length - 1].key);
        }
    }
    return src;
}

const ModalProviderRoot = React.memo((props: { children: React.ReactNode }) => {
    const [modals, setModals] = React.useState<ModalItem[]>([]);
    const close = React.useCallback((id?: Maybe<string> | Array<string>) => {
        setModals((a) => { return removeModals(a, id); });
    }, []);
    const show = React.useCallback((node: React.ReactNode, p?: Maybe<string>) => {
        let key = randomKey();
        let parent = p ? p : null;
        setModals((a) => [...a, { key, node, parent }]);
        return key;
    }, []);
    const current = React.useMemo<string | null>(() => {
        return null;
    }, []);
    const ctx = React.useMemo(() => ({ close, show, current }), [close, show, current]);
    return (
        <ModalContext.Provider value={ctx}>
            <>
                {props.children}
                <AnimatePresence>
                    {modals.map((v, k) => <ModalProviderChild ctx={ctx} parent={v.key} key={k}>{v.node}</ModalProviderChild>)}
                </AnimatePresence>
            </>
        </ModalContext.Provider>
    )
});

const ModalProviderChild = React.memo((props: { parent: string, ctx: ModalContextType, children: React.ReactNode }) => {
    const close = React.useCallback((id?: Maybe<string> | Array<string>) => {
        props.ctx.close(props.parent || id);
    }, []);
    const show = React.useCallback((node: React.ReactNode, p?: Maybe<string>) => {
        return props.ctx.show(node, props.parent || p);
    }, []);
    const current = React.useMemo<string | null>(() => {
        return props.parent;
    }, []);
    const ctx = React.useMemo(() => ({ close, show, current }), [close, show, current]);
    return (
        <ModalContext.Provider value={ctx}>
            {props.children}
        </ModalContext.Provider>
    )
});

export const ModalProvider = React.memo((props: { children: React.ReactNode }) => {
    return (<ModalProviderRoot>{props.children}</ModalProviderRoot>);
});

//
// UI
//

export const Modal = React.memo((props: {
    children?: React.ReactNode,
    backdropClassName?: string,
    className?: string,
}) => {
    return (
        <motion.div
            className={'backdrop'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={'modal'}>
                <View style={{ alignSelf: 'stretch' }}>
                    {props.children}
                </View>
            </div>
        </motion.div>
    );
});