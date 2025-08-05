import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var session: SessionManager
    @State private var numbers: [NumberRecord] = []

    var body: some View {
        ZStack {
            LinearGradient(colors: [.blue, .purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            List(numbers) { item in
                HStack {
                    Text("\(item.value)")
                    Spacer()
                    Text(item.created_at)
                        .font(.caption)
                }
                .foregroundColor(.white)
            }
            .scrollContentBackground(.hidden)
        }
        .onAppear { load() }
        .navigationTitle("History")
    }

    func load() {
        guard let id = session.user?.id else { return }
        Task {
            if let res = try? await APIService.shared.getNumberHistory(page: 1, limit: 25, userId: id) {
                await MainActor.run { numbers = res.numbers }
            }
        }
    }
}
