import { useState, useCallback, useRef } from 'react';
import { LucraClient } from 'lucra-web-sdk';

export const useLucraClient = () => {
  const [isOpen, setIsOpen] = useState(false);
  const clientRef = useRef<LucraClient | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const navigationRef = useRef<any>(null);

  const openClient = useCallback(() => {
    if (clientRef.current && containerRef.current && navigationRef.current) {
      // Client is already open, just make container visible
      containerRef.current.classList.remove('opacity-0', 'pointer-events-none');
      containerRef.current.classList.add('opacity-100');
      setIsOpen(true);
      return navigationRef.current;
    }

    // Find the iframe container element
    const iframeContainer = document.getElementById("lucra-iframe-container");
    if (!iframeContainer) {
      console.error("Iframe container not found");
      return null;
    }

    // Create new client instance if it doesn't exist
    if (!clientRef.current) {
      clientRef.current = new LucraClient({
        tenantId: "RNG",
        env: "sandbox",
        onMessage: {
          claimReward: (claimReward) => {
            console.log("KG: CLAIM REWARD: ", claimReward);
          },
          convertToCredit: (convertToCredit) => {
            console.log("KG: CONVERT TO CREDIT: ", convertToCredit);
          },
          deepLink: (deepLink) => {
            console.log("KG: DEEP LINK: ", deepLink);
          },
          matchupAccepted: (matchup) => {
            console.log("KG: MATCHUP ACCEPTED: ", matchup);
          },
          matchupCanceled: (matchup) => {
            console.log("KG: MATCHUP CANCELED: ", matchup);
          },
          matchupCreated: (matchup) => {
            console.log("KG: MATCHUP CREATED: ", matchup);
          },
          matchupStarted: (matchup) => {
            console.log("KG: MATCHUP STARTED: ", matchup);
          },
          navigationEvent: (navigationEvent) => {
            console.log("KG: NAVIGATION EVENT: ", navigationEvent);
          },
          tournamentJoined: (tournamentJoined) => {
            console.log("KG: TOURNAMENT JOINED: ", tournamentJoined);
          },
          userInfo: (userInfo) => {
            // whenever an update happens to the user, the callback to this function will receive the newest version of that user object
          }
        },
      });
    }

    // Store container reference and open client
    containerRef.current = iframeContainer;
    containerRef.current.classList.remove('opacity-0', 'pointer-events-none');
    containerRef.current.classList.add('opacity-100');
    
    const openedClient = clientRef.current.open(iframeContainer);
    navigationRef.current = openedClient;
    setIsOpen(true);
    
    return openedClient;
  }, []);

  const closeClient = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.classList.add('opacity-0', 'pointer-events-none');
      containerRef.current.classList.remove('opacity-100');
      setIsOpen(false);
    }
  }, []);

  const navigateToProfile = useCallback(() => {
    const navigation = openClient();
    if (navigation) {
      navigation.profile();
    }
  }, [openClient]);

  const navigateToHome = useCallback((locationId?: string) => {
    const navigation = openClient();
    if (navigation) {
      navigation.home(locationId);
    }
  }, [openClient]);

  const navigateToDeposit = useCallback(() => {
    const navigation = openClient();
    if (navigation) {
      navigation.deposit();
    }
  }, [openClient]);

  const navigateToWithdraw = useCallback(() => {
    const navigation = openClient();
    if (navigation) {
      navigation.withdraw();
    }
  }, [openClient]);

  const navigateToCreateMatchup = useCallback((gameId?: string) => {
    const navigation = openClient();
    if (navigation) {
      navigation.createMatchup(gameId);
    }
  }, [openClient]);

  return {
    isOpen,
    openClient,
    closeClient,
    navigateToProfile,
    navigateToHome,
    navigateToDeposit,
    navigateToWithdraw,
    navigateToCreateMatchup,
    client: clientRef.current,
  };
}; 