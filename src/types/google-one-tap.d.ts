/// <reference types="google-one-tap" />

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: CredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          context?: string;
          prompt_parent_id?: string;
          nonce?: string;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: (
          momentListener?: (promptMoment: {
            isDisplayMoment: () => boolean;
            isDisplayed: () => boolean;
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getDismissedReason: () => string;
            getSkippedReason: () => string;
            getMomentType: () => string;
          }) => void
        ) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type: "standard" | "icon";
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            logo_alignment?: "left" | "center";
            width?: number;
            locale?: string;
          }
        ) => void;
        disableAutoSelect: () => void;
        storeCredential: (
          credential: { id: string; password: string },
          callback?: () => void
        ) => void;
        cancel: () => void;
        revoke: (hint: string, callback?: (done: boolean) => void) => void;
      };
    };
  };
}
