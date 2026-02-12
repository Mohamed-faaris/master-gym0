import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import React from 'react'
import { StatusBar } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

import ConvexProvider from '../integrations/convex/provider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { AuthProvider } from '@/components/auth/AuthProvider'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFoundComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  React.useEffect(() => {
    // Configure Capacitor status bar for mobile apps
    StatusBar.setOverlaysWebView({ overlay: false })
  }, [])

  React.useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return
    }

    const closeOpenOverlay = () => {
      const openOverlaySelector = [
        '[data-vaul-overlay][data-state="open"]',
        '[data-radix-dialog-overlay][data-state="open"]',
        '[data-state="open"][role="dialog"]',
      ].join(',')

      const overlay = document.querySelector<HTMLElement>(openOverlaySelector)

      if (!overlay) {
        return false
      }

      overlay.click()
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
        }),
      )

      return true
    }

    const backButtonListener = App.addListener('backButton', async () => {
      if (closeOpenOverlay()) {
        return
      }

      if (router.history.canGoBack()) {
        router.history.back()
        return
      }

      await App.exitApp()
    })

    return () => {
      void backButtonListener.then((listener) => listener.remove())
    }
  }, [router])

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script src="https://tweakcn.com/live-preview.min.js"></script>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="dark">
        <ConvexProvider>
          <AuthProvider>
            <div vaul-drawer-wrapper="" className="min-h-screen bg-background">
              {children}
            </div>
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </AuthProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-gray-600">This page (url is not found)</p>
      <Link to="/app" className="text-blue-500 hover:text-blue-700 underline">
        Go to dashboard
      </Link>
    </div>
  )
}
