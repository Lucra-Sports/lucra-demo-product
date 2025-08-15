import { LucraClient } from "lucra-web-sdk";
import type { SDKClientUser } from "lucra-web-sdk/types";
import { lucraMatchupStarted, updateBindings } from "./api";

// Global reference to track Lucra URL function
let trackLucraUrlRef: ((url: string) => void) | null = null;

// Store for redirect URL
let storedRedirectUrl: string | null = null;

// Function to set the tracking function from the context
export const setLucraJourneyTracker = (
  trackLucraUrl: (url: string) => void
) => {
  trackLucraUrlRef = trackLucraUrl;
};

// Function to get the stored redirect URL
export const getStoredRedirectUrl = () => storedRedirectUrl;

// Function to clear the stored redirect URL
export const clearStoredRedirectUrl = () => {
  storedRedirectUrl = null;
};

// Create and export the client instance
export const lucraClient = new LucraClient({
  tenantId: "RNG",
  env: "sandbox",
  onMessage: {
    claimReward: (claimReward) => {
      console.log("!!!: SDK: Callback: Claim Reward", claimReward);
    },
    convertToCredit: (convertToCredit) => {
      console.log("!!!: SDK: Callback: Convert To Credit", convertToCredit);
    },
    deepLink: (deepLink) => {
      console.log("!!!: SDK: Callback: Deep Link", deepLink);
    },
    matchupAccepted: (matchup) => {
      console.log("!!!: SDK: Callback: Matchup Accepted", matchup);
    },
    matchupCanceled: (matchup) => {
      console.log("!!!: SDK: Callback: Matchup Canceled", matchup);
    },
    matchupCreated: (matchup) => {
      console.log("!!!: SDK: Callback: Matchup Created", matchup);
    },
    matchupStarted: (matchup) => {
      console.log("!!!: SDK: Callback: Matchup Started", matchup);
      lucraMatchupStarted(matchup.matchupId);
      // Hide the iframe when matchup starts (preserve communication)
      const container = document.getElementById("lucra-iframe-container");
      if (container) {
        container.classList.add("opacity-0", "pointer-events-none");
        container.classList.remove("opacity-100");
        console.log("!!!: RNG: Hidden Lucra iframe after matchup started");
      }
    },
    navigationEvent: (navigationEvent) => {
      console.log("!!!: SDK: Callback: Navigation Event", navigationEvent);
      // Track the URL in LucraJourneyContext
      if (trackLucraUrlRef && navigationEvent.url) {
        trackLucraUrlRef(navigationEvent.url);
      }
    },
    tournamentJoined: (tournamentJoined) => {
      console.log("!!!: SDK: Callback: Tournament Joined", tournamentJoined);
    },
    userInfo: (userInfo) => {
      // whenever an update happens to the user, the callback to this function will receive the newest version of that user object
      console.log("!!!: SDK: Callback: User Info", userInfo);

      // Call PUT /bindings with the external ID from Lucra
      if (userInfo.id) {
        updateBindings(userInfo.id)
          .then(() => {
            console.log(
              "RNG: Successfully updated bindings for Lucra user:",
              userInfo.id
            );
          })
          .catch((error) => {
            console.error("RNG: Failed to update bindings:", error);
          });
      }
    },
  },
});

// Deep link handler utility function
function handleDeepLinkRequest({ url }: { url: string }) {
  console.log("!!!: RNG: handleDeepLinkRequest: Lucra URL: ", url);

  // Store the original Lucra URL as redirect URL
  storedRedirectUrl = url;

  // Create a generic localhost share URL
  const shareUrl = `http://localhost:3000?redirect=${storedRedirectUrl}`;
  console.log("!!!: RNG: Custom deep link URL: ", shareUrl);

  lucraClient?.sendMessage.deepLinkResponse({
    url: shareUrl,
  });
}

// Register the deep link handler after instantiation
lucraClient.deepLinkHandler = handleDeepLinkRequest;

let navigation: any = null;

// Initialize when DOM is ready
export const initLucraClient = (userPhoneNumber: string) => {
  const iframeContainer = document.getElementById("lucra-iframe-container");
  if (iframeContainer) {
    navigation = lucraClient.open(iframeContainer, userPhoneNumber);
  }
};

// Export navigation for direct use
export const getNavigation = () => {
  // If navigation doesn't exist yet, try to initialize
  if (!navigation) {
    const container = document.getElementById("lucra-iframe-container");
    if (container) {
      navigation = lucraClient.open(container);
    }
  }

  // Show the iframe when navigation is requested
  const container = document.getElementById("lucra-iframe-container");
  if (container && navigation) {
    container.classList.remove("opacity-0", "pointer-events-none");
    container.classList.add("opacity-100");
  }
  return navigation;
};

// Helper function for user updates
export const updateUser = (user: any) => {
  const userInfo: Partial<SDKClientUser> = {};

  // Map user properties to SDKClientUser properties
  if (user.full_name) userInfo.username = user.full_name;
  if (user.avatar_url) userInfo.avatarURL = user.avatar_url;
  if (user.phone_number) userInfo.phoneNumber = user.phone_number;
  if (user.email) userInfo.email = user.email;
  if (user.fullName) {
    userInfo.firstName = user.fullName.split(" ")[0];
    userInfo.lastName = user.fullName.split(" ")[1];
  }

  // Handle address object
  if (user.address || user.city || user.state || user.zip_code) {
    userInfo.address = {};
    if (user.address) userInfo.address.address = user.address;
    if (user.city) userInfo.address.city = user.city;
    if (user.state) userInfo.address.state = user.state;
    if (user.zip_code) userInfo.address.zip = user.zip_code;
  }

  // Mock phone number using Next.js env variable
  if (process.env.NEXT_PUBLIC_MOCK_PHONE_NUMBER) {
    userInfo.phoneNumber = process.env.NEXT_PUBLIC_MOCK_PHONE_NUMBER;
  }
  console.log("!!!: RNG via LucraClient: sendMessage.userUpdated: ", userInfo);
  lucraClient.sendMessage.userUpdated(userInfo as SDKClientUser);
};
