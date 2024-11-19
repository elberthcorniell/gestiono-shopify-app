import React from 'react'
import { createGlobalStyle } from 'styled-components'
import { GestionoProvider } from "@bitnation-dev/management"
import Projects from './pages/page'
import { ModalProvider } from '@bitnation-dev/components/dist/components/Modal/Provider'
import { Route } from './components/router'
import './index.css'
import { useLocalStorage } from '@bitnation-dev/management/hooks/local-storage'
import { LayoutGrid } from '@bitnation-dev/management/components/layout/layout-grid'
import { UserProvider } from '@bitnation-dev/management/hooks/user'
import { ThemeProvider } from '@bitnation-dev/management/src/provider/theme'
const GlobalStyle = createGlobalStyle`
:root {
    --color-ui-input: #F4F6F9;
    --color-brand-primary-100: #D6E4FD;
}
`

export const Root = () => {
    const theme = useLocalStorage<'light' | 'dark'>('theme', {
        initialValue: 'light',
        serialize: v => v,
        deserialize: v => v as 'light' | 'dark',
    })

    return <ThemeProvider theme={theme.value}>
        <ModalProvider>
            <UserProvider>
                <GestionoProvider>
                    <LayoutGrid>
                        <Route path="/">
                            <Projects />
                        </Route>
                    </LayoutGrid>
                    <GlobalStyle />
                </GestionoProvider>
            </UserProvider>
        </ModalProvider>
    </ThemeProvider>
}