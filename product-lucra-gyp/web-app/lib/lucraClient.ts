import { LucraClient } from "lucra-web-sdk";

export const lucraClient = new LucraClient({
  tenantId: "RNG",
  env: "sandbox",
  onMessage: {
    claimReward: (claimReward) => {
			// the user is attempting to claim their reward from a Free To Play matchup
			console.log("LUCRA CLIENT: CLAIM REWARD: ", claimReward);
    },
    convertToCredit: (convertToCredit) => {
			// if you've enabled convert to credit, the SDK will ask for the conversion amount through this method
			console.log("LUCRA CLIENT: CONVERT TO CREDIT: ", convertToCredit);
    },
    deepLink: (deepLink) => {
			// Lucra is requesting a url that the user of the SDK will open to then open up the LucraClient at where the deepLink url is linking to
			console.log("LUCRA CLIENT: DEEP LINK: ", deepLink);
    },
    matchupAccepted: (matchup) => {
      // the user successfully jointed someone else's matchup, and contains the id of that matchup 
			console.log("LUCRA CLIENT: MATCHUP ACCEPTED: ", matchup);
    },
    matchupCanceled: (matchup) => {
      // the user successfully canceled the matchup, and contains the id of that matchup
			console.log("LUCRA CLIENT: MATCHUP CANCELED: ", matchup);
    },
    matchupCreated: (matchup) => {
      // the user successfully created a matchup, and contains the id of that matchup 
			console.log("LUCRA CLIENT: MATCHUP CREATED: ", matchup);
    },
    matchupStarted: (matchup) => {
			// the user successfully started a matchup, and contains the id of that matchup 
			console.log("LUCRA CLIENT: MATCHUP STARTED: ", matchup);
    },
    navigationEvent: (navigationEvent) => {
			// the user has navigated in Lucra. The full URL will be sent in this message to be used later on with opening a deepLink or for analytics tracking.
			console.log("LUCRA CLIENT: NAVIGATION EVENT: ", navigationEvent);
    },
    tournamentJoined: (tournamentJoined) => {
			// the user successfully joined a tournament
			console.log("LUCRA CLIENT: TOURNAMENT JOINED: ", tournamentJoined);
    },
    userInfo: (userInfo) => {
      // whenever an update happens to the user, the callback to this function will receive the newest version of that user object
			console.log("LUCRA CLIENT: USER INFO: ", userInfo);
    },
  },
  useTestUsers: true,
});
