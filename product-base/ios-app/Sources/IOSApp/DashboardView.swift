import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SessionManager
    @State private var stats: Stats?
    @State private var generatedNumber: NumberRecord?

    var body: some View {
        VStack(spacing: 16) {
            if let user = session.user {
                Text("Welcome, \(user.full_name)")
            }
            if let stats = stats {
                Text("Total Generated: \(stats.totalNumbersGenerated)")
                Text("Best Number: \(stats.bestNumber)")
            }
            if let generatedNumber = generatedNumber {
                Text("Last Number: \(generatedNumber.value)")
            }
            HStack {
                Button("Generate RNG") { generate() }
                NavigationLink("History") { HistoryView() }
                NavigationLink("Profile") { ProfileView() }
            }
        }
        .navigationTitle("Dashboard")
        .onAppear { load() }
        .padding()
    }

    private func load() {
        guard let id = session.user?.id else { return }
        APIService.shared.fetchStats(userId: id) { result in
            DispatchQueue.main.async {
                if case let .success(s) = result { stats = s }
            }
        }
    }

    private func generate() {
        guard let id = session.user?.id else { return }
        APIService.shared.generateNumber(userId: id) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let record):
                    generatedNumber = record
                    load()
                case .failure:
                    break
                }
            }
        }
    }
}

#Preview {
    DashboardView().environmentObject(SessionManager())
}
