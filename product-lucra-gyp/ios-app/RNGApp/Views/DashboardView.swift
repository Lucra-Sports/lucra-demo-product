import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SessionManager
    @State private var isGenerating = false
    @State private var targetNumber: Int?
    @State private var history: [Int] = []
    @State private var errorText: String?

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
                    .padding()
                }
                
                Text(errorText ?? "")
                    .foregroundColor(.errorRed)
                    .padding(.bottom, 12)
                
                HStack {
                    generateButton
                    
                    if let _ = session.lucraUser {
                        createContestButton
                    }
                }
            }
        }
        .navigationBarBackButtonHidden(true)
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
    
    @ViewBuilder
    private var createContestButton: some View {
        Button(action: createContest) {
            Text("Challenge an opponent")
        }
        .frame(width: 120, height: 120)
        .background(
            LinearGradient(colors: [.secondaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing)
                .ignoresSafeArea(.all)
        )
        .foregroundColor(.white)
        .clipShape(Circle())
        .padding(.bottom, 40)
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
        
        Task {
            do {
                let num = try await APIService.shared.generateNumber(userId: user.id)
                targetNumber = num
            } catch {
                isGenerating = false
                errorText = ""
            }
        }
    }
    
    func createContest() {
        guard let _ = session.lucraUser else {
            errorText = "Lucra User Not logged in"
            return
        }
        
        session.flow = .createGamesMatchup(gameId: "BEST_NUMBER", location: nil)
    }
}

#Preview {
    DashboardView()
        .environmentObject(SessionManager())
}
