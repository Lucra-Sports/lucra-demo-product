import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SessionManager
    @State private var isGenerating = false
    @State private var targetNumber: Int?
    @State private var history: [Int] = []
    @State private var errorText: String?
    @State private var currentMatchupId: String?
    @State private var leaderboard: [APIService.LeaderboardEntry] = []
    @State private var hasLoadedLeaderboard = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea(.all)

            VStack {
                HStack {
                    NavigationLink(destination: ProfileView()) {
                        Image(systemName: "person.circle")
                            .font(.title)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    session.client.ui.component(.userProfilePill)
                }
                .padding()

                Text("RNG Tournaments")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)

                Text("Your Random Number Generator")
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)

                Button(action: joinTournament) {
                    HStack {
                        Image(systemName: "trophy.fill")
                        Text("Join Tournament").bold()
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.yellow)
                    .foregroundColor(.primaryColor)
                    .cornerRadius(25)
                }
                .padding(.horizontal)

                Spacer()

                NumberDisplayView(isGenerating: isGenerating, targetNumber: targetNumber) { final in
                    history.insert(final, at: 0)
                    isGenerating = false
                }

                if !leaderboard.isEmpty {
                    Text("Daily RNG Leaderboard")
                        .font(.title2)
                        .bold()
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)

                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(Array(leaderboard.enumerated()), id: \.1.id) { index, entry in
                                HStack {
                                    Text("\(index + 1).")
                                        .bold()
                                    Text(entry.displayName)
                                        .font(.headline)
                                    Spacer()
                                    Text("\(entry.value)")
                                        .bold()
                                }
                                .padding()
                                .background(Color.gray.opacity(0.2))
                                .cornerRadius(10)
                                .foregroundColor(.white)
                            }
                        }
                        .padding()
                    }
                    .frame(height: 150)
                    .padding(.horizontal)
                }

                Spacer()

                if !history.isEmpty && !isGenerating {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(history.prefix(5), id: \.self) { num in
                                Text("\(num)")
                                    .padding(8)
                                    .background(Color.white.opacity(0.2))
                                    .cornerRadius(12)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .padding()
                }

                Text(errorText ?? "")
                    .foregroundColor(.errorRed)
                    .padding(.bottom, 12)

                HStack {
                    generateButton
                }

                if let matchupId = currentMatchupId {
                    Button(action: {
                        session.flow = .gamesMatchupDetails(matchupId: matchupId)
                    }) {
                        Text("This score applied to a matchup")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(Color.yellow)
                            .foregroundColor(.primaryColor)
                            .cornerRadius(25)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .task {
            if !hasLoadedLeaderboard {
                hasLoadedLeaderboard = true
                await loadLeaderboard()
            }
        }
    }

    private var generateButton: some View {
        Button(action: generate) {
            Text("Generate").bold()
        }
        .frame(width: 120, height: 120)
        .background(
            LinearGradient(colors: [.primaryColor, .primaryColor], startPoint: .leading, endPoint: .trailing)
                .ignoresSafeArea(.all)
        )
        .foregroundColor(.white)
        .clipShape(Circle())
        .padding(.bottom, 40)
    }

    func loadLeaderboard() async {
        do {
            leaderboard = try await APIService.shared.getLeaderboard()
        } catch {
            print("Failed to load leaderboard:", error)
        }
    }

    func generate() {
        guard let user = session.user else {
            errorText = "User not logged in."
            return
        }

        guard !isGenerating else {
            errorText = "Generating, please wait."
            return
        }

        isGenerating = true
        currentMatchupId = nil

        Task {
            do {
                let record = try await APIService.shared.generateNumber(userId: user.id)
                targetNumber = record.number
                currentMatchupId = record.matchupId
                await loadLeaderboard()
            } catch {
                isGenerating = false
                errorText = ""
            }
        }
    }

    func joinTournament() {
        guard let _ = session.lucraUser else {
            errorText = "Lucra User Not logged in"
            return
        }

        session.flow = .createGamesMatchup(gameId: "", location: "")
    }
}

#Preview {
    DashboardView()
        .environmentObject(SessionManager())
}
