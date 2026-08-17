import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import CommonPopup, { PopupButton, PopupVariant } from '../../../components/CommonPopup';

interface ShowPopupOptions {
  title: string;
  description?: string;
  variant?: PopupVariant;
  buttons?: PopupButton[];
  dismissable?: boolean;
  stackedButtons?: boolean;
}

interface PopupContextValue {
  show: (opts: ShowPopupOptions) => void;
  hide: () => void;
  // Convenience helpers
  success: (title: string, description?: string, onOk?: () => void) => void;
  error: (title: string, description?: string, onOk?: () => void) => void;
  warning: (title: string, description?: string, onOk?: () => void) => void;
  info: (title: string, description?: string, onOk?: () => void) => void;
  confirm: (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  premiumRequired: (description?: string, onUpgrade?: () => void) => void;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opts, setOpts] = useState<ShowPopupOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const show = useCallback((next: ShowPopupOptions) => {
    setOpts(next);
    setVisible(true);
  }, []);

  const wrapButton = useCallback(
    (btn: PopupButton): PopupButton => ({
      ...btn,
      onPress: () => {
        hide();
        // Allow modal close animation to complete
        setTimeout(() => btn.onPress?.(), 100);
      },
    }),
    [hide]
  );

  const success = useCallback(
    (title: string, description?: string, onOk?: () => void) =>
      show({
        title,
        description,
        variant: 'success',
        buttons: [wrapButton({ text: 'OK', variant: 'primary', onPress: onOk })],
      }),
    [show, wrapButton]
  );

  const errorFn = useCallback(
    (title: string, description?: string, onOk?: () => void) =>
      show({
        title,
        description,
        variant: 'error',
        buttons: [wrapButton({ text: 'OK', variant: 'primary', onPress: onOk })],
      }),
    [show, wrapButton]
  );

  const warning = useCallback(
    (title: string, description?: string, onOk?: () => void) =>
      show({
        title,
        description,
        variant: 'warning',
        buttons: [wrapButton({ text: 'OK', variant: 'primary', onPress: onOk })],
      }),
    [show, wrapButton]
  );

  const info = useCallback(
    (title: string, description?: string, onOk?: () => void) =>
      show({
        title,
        description,
        variant: 'info',
        buttons: [wrapButton({ text: 'OK', variant: 'primary', onPress: onOk })],
      }),
    [show, wrapButton]
  );

  const confirm = useCallback(
    (
      title: string,
      description: string,
      onConfirm: () => void,
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    ) =>
      show({
        title,
        description,
        variant: 'confirm',
        buttons: [
          wrapButton({ text: cancelText, variant: 'secondary' }),
          wrapButton({ text: confirmText, variant: 'primary', onPress: onConfirm }),
        ],
      }),
    [show, wrapButton]
  );

  const premiumRequired = useCallback(
    (description = 'Upgrade to Premium to unlock this feature and many more.', onUpgrade?: () => void) =>
      show({
        title: 'Premium Required',
        description,
        variant: 'premium',
        stackedButtons: true,
        buttons: [
          wrapButton({ text: 'Upgrade Now', variant: 'primary', onPress: onUpgrade }),
          wrapButton({ text: 'Close', variant: 'secondary' }),
        ],
      }),
    [show, wrapButton]
  );

  // All eight helpers are already stable, so this value never changes identity — without
  // the memo, opening/closing any popup re-rendered every usePopup() consumer in the tree.
  const value = useMemo(
    () => ({ show, hide, success, error: errorFn, warning, info, confirm, premiumRequired }),
    [show, hide, success, errorFn, warning, info, confirm, premiumRequired]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}
      {opts ? (
        <CommonPopup
          visible={visible}
          title={opts.title}
          description={opts.description}
          variant={opts.variant}
          buttons={opts.buttons}
          dismissable={opts.dismissable}
          stackedButtons={opts.stackedButtons}
          onClose={hide}
        />
      ) : null}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextValue => {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return ctx;
};
