import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var session: SessionManager
    @State private var stats = Stats(totalNumbersGenerated: 0, bestNumber: 0)

    var body: some View {
        ZStack {
            LinearGradient(colors: [.blue, .purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 20) {
                HStack {
                    NavigationLink(destination: DashboardView()) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.white)
                    }
                    Spacer()
                }
                .padding()
                if let user = session.user {
                    VStack(spacing: 8) {
                        Text(user.full_name)
                            .font(.title)
                            .foregroundColor(.white)
                        Text(user.email)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    HStack {
                        VStack {
                            Text("\(stats.totalNumbersGenerated)")
                            Text("Generated")
                        }
                        .padding()
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                        VStack {
                            Text("\(stats.bestNumber)")
                            Text("Best")
                        }
                        .padding()
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                    }
                    NavigationLink("Number History", destination: HistoryView())
                        .padding()
                        .background(Color.blue.opacity(0.8))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                    Button("Logout") {
                        session.logout()
                    }
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
                    .foregroundColor(.white)
                }
                Spacer()
            }
        }
        .onAppear { load() }
        .navigationBarBackButtonHidden(true)
    }

    func load() {
        guard let id = session.user?.id else { return }
        Task {
            if let s = try? await APIService.shared.getStats(userId: id) {
                await MainActor.run { stats = s }
            }
        }
    }
}
