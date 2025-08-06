import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var session: SessionManager
    @Environment(\.dismiss) var dismiss
    @State private var numbers: [NumberRecord] = []
    @State private var page = 1
    @State private var isLoading = false
    @State private var hasMore = true

    var body: some View {
        ZStack {
            LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            List {
                ForEach(numbers) { item in
                    HStack {
                        Text("\(item.value)")
                        Spacer()
                        Text(item.created_at)
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .listRowBackground(Color.clear)
                    .onAppear {
                        if item.id == numbers.last?.id { loadMore() }
                    }
                }
                if isLoading {
                    ProgressView()
                        .listRowBackground(Color.clear)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        }
        .onAppear { load() }
        .navigationTitle("History")
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.white)
                }
            }
        }
    }

    func load() {
        numbers = []
        page = 1
        hasMore = true
        loadMore()
    }

    func loadMore() {
        guard !isLoading, hasMore, let id = session.user?.id else { return }
        isLoading = true
        Task {
            if let res = try? await APIService.shared.getNumberHistory(page: page, limit: 25, userId: id) {
                await MainActor.run {
                    numbers.append(contentsOf: res.numbers)
                    page += 1
                    hasMore = res.next != nil
                    isLoading = false
                }
            } else {
                await MainActor.run { isLoading = false }
            }
        }
    }
}
