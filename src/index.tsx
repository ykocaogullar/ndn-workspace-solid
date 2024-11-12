/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route, RouteSectionProps } from '@solidjs/router'

import {
  Description as DescriptionIcon,
  Apps as AppsIcon,
  SettingsEthernet as SettingsEthernetIcon,
  Home as HomeIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
} from '@suid/icons-material'

import Root from './components/root-wrapper'
import App from './App'
import ShareLatex from './components/share-latex'
import OauthTest from './components/oauth-test'
import { NdnWorkspaceProvider, useNdnWorkspace, initTestbed } from './Context'
import { Connect, StoredConns } from './components/connect'
import { Workspace, Profile, ConvertTestbed } from './components/workspace'
import { project } from './backend/models'
import { Toaster } from 'solid-toast'
import { Chat } from './components/chat/chat'
import ConfigPage from './components/config'
import InvitationPage from './components/invitation-page/invitation-page'
import KeyEntry from './components/personal-key/personal'
import WorkspaceCreationPage from './components/creation-page/creation'

const rootElement = document.getElementById('root')!

function RootComponent(props: RouteSectionProps) {
  // Global initialization
  initTestbed()

  return (
    <Root
      routes={[
        { icon: <HomeIcon />, href: '/', title: 'Home' },
        { icon: <AppsIcon />, href: '/profile', title: 'Workspace' },
        {
          icon: <DescriptionIcon />,
          href: `/latex/${project.RootId}`,
          title: 'Editor',
          level: 1, // not displayed by default
          trigger: () => {
            const { booted } = useNdnWorkspace()!
            return booted()
          },
        },
        {
          icon: <ChatIcon />,
          href: '/chat',
          title: 'Chat',
          level: 1, // not displayed by default
          trigger: () => {
            const { booted } = useNdnWorkspace()!
            return booted()
          },
        },
        {
          icon: <SettingsEthernetIcon />,
          href: '/connection',
          title: 'Connection',
        },
        { icon: <SettingsIcon />, href: '/config-page', title: 'Settings' },
        { icon: <SettingsIcon />, href: '/creation-page', title: 'Create Workspace' },
        { icon: <SettingsIcon />, href: '/invitation-page', title: 'Invitation' },
        { icon: <SettingsIcon />, href: '/personal-key', title: 'Personal Key' },
      ]}
    >
      {props.children}
    </Root>
  )
}

render(
  () => (
    <NdnWorkspaceProvider>
      <Router root={RootComponent}>
        <Route path="/" component={App} />
        <Route path="/latex/:itemId" component={() => <ShareLatex rootUri="/latex" />} />
        <Route path="/connection/add" component={Connect} />
        <Route path="/connection" component={StoredConns} />
        <Route path="/workspace" component={Workspace} />
        <Route path="/chat" component={Chat} />
        <Route path="/profile" component={Profile} />
        <Route path="/convert-testbed" component={ConvertTestbed} />
        <Route path="/oauth-test" component={OauthTest} />
        <Route path="/config-page" component={ConfigPage} />
        <Route path="/invitation-page" component={InvitationPage} />
        <Route path="/personal-key" component={KeyEntry} />
        <Route path="/creation-page" component={WorkspaceCreationPage} />
      </Router>

      <Toaster />
    </NdnWorkspaceProvider>
  ),
  rootElement,
)
