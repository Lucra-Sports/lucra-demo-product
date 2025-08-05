import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SessionManager
    @State private var isGenerating = false
    @State private var targetNumber: Int?
    @State private var history: [Int] = []

    var body: some View {
        ZStack {
            LinearGradient(colors: [.indigo, .purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack {
                HStack {
                    Spacer()
                    NavigationLink(destination: ProfileView()) {
                        Image(systemName: "person.circle")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }
                .padding()
                Text("RNG")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                Text("Your Random Number Generator")
                    .foregroundColor(.white.opacity(0.8))
                Spacer()
                NumberDisplayView(isGenerating: isGenerating, targetNumber: targetNumber) { final in
                    history.insert(final, at: 0)
                    isGenerating = false
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
                }
                Button(action: generate) {
                    Text("Generate").bold()
                }
                .frame(width: 120, height: 120)
                .background(LinearGradient(colors: [.yellow, .orange], startPoint: .topLeading, endPoint: .bottomTrailing))
                .foregroundColor(.white)
                .clipShape(Circle())
                .padding(.bottom, 40)
            }
        }
        .navigationBarBackButtonHidden(true)
    }

    func generate() {
        guard let user = session.user, !isGenerating else { return }
        isGenerating = true
        Task {
            do {
                let num = try await APIService.shared.generateNumber(userId: user.id)
                targetNumber = num
            } catch {
                isGenerating = false
            }
        }
    }
}
