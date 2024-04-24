import React from 'react'
import { createGlobalStyle } from 'styled-components'
import { ThemeProvider } from "@bitnation-dev/management/dist/package/src/provider/theme"
import { GestionoProvider } from "@bitnation-dev/management"
import { UserProvider } from "@bitnation-dev/management/dist/common/utils/hooks/user"
import { useLocalStorage } from '@bitnation-dev/management/dist/package/src/hooks'
import { LayoutGrid } from '@bitnation-dev/management/dist/common/ui/components/layout/layout-grid'
import Projects from './pages/page'
// import ProjectPage from './pages/[projectId]'
import { ModalProvider } from '@bitnation-dev/components/dist/components/Modal/Provider'
import { Route } from './components/router'
import ProjectPage from './pages/[projectId]'
import './index.css'

const GlobalStyle = createGlobalStyle`
:root {
    --color-ui-input: #F4F6F9;
    --color-brand-primary-100: #D6E4FD;
}
`

export const Root = () => {
    const theme = useLocalStorage('theme', {
        initialValue: 'light',
        serialize: v => v,
        deserialize: v => v,
    })

    return <ThemeProvider theme={theme.value}>
        <ModalProvider>
            <UserProvider>
                <GestionoProvider>
                    <LayoutGrid>
                        <Route path="/">
                            <Projects />
                        </Route>
                        <Route path="/[projectId]">
                            <ProjectPage />
                        </Route>
                    </LayoutGrid>
                    <GlobalStyle />
                </GestionoProvider>
            </UserProvider>
        </ModalProvider>
    </ThemeProvider>
}