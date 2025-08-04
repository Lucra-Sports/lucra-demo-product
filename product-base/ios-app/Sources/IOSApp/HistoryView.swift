import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var session: SessionManager
    @State private var numbers: [NumberRecord] = []

    var body: some View {
        List(numbers) { record in
            VStack(alignment: .leading) {
                Text("Number: \(record.value)")
                Text(record.created_at).font(.caption)
            }
        }
        .navigationTitle("History")
        .onAppear { load() }
    }

    private func load() {
        guard let id = session.user?.id else { return }
        APIService.shared.fetchNumbers(userId: id) { result in
            DispatchQueue.main.async {
                if case let .success(list) = result { numbers = list }
            }
        }
    }
}

#Preview {
    HistoryView().environmentObject(SessionManager())
}
