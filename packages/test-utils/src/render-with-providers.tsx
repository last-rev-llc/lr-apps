import React, { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

interface ProviderProps {
  children: ReactNode;
  messages?: AbstractIntlMessages;
  locale?: string;
}

function AllProviders({ children, messages, locale = "en" }: ProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages ?? {}}
      onError={() => {}}
      getMessageFallback={({ key, namespace }) => `${namespace ?? ""}.${key}`}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export interface RenderWithProvidersOptions
  extends Omit<RenderOptions, "wrapper"> {
  messages?: AbstractIntlMessages;
  locale?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { messages, locale, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders messages={messages} locale={locale}>
        {children}
      </AllProviders>
    ),
    ...options,
  });
}

export { screen, waitFor, within, act, fireEvent } from "@testing-library/react";
