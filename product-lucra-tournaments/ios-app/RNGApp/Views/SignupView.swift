import SwiftUI

struct SignupView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var session: SessionManager
    @State private var data = APIService.SignupData(name: "", email: "", password: "", address: "", city: "", state: "", zip: "", birthday: "")
    @State private var isLoading = false

    var body: some View {
        ZStack {
            backgroundGradient
            
            ScrollView {
                VStack(spacing: 12) {
                    
                    Text("Create Account")
                        .font(.title)
                    
                    Group {
                        TextField("Full Name", text: $data.name)
                        TextField("Email", text: $data.email)
                        SecureField("Password", text: $data.password)
                        TextField("Address", text: $data.address)
                        TextField("City", text: $data.city)
                        TextField("State", text: $data.state)
                        TextField("ZIP", text: $data.zip)
                        TextField("Birthday (YYYY-MM-DD)", text: $data.birthday)
                    }
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .disableAutocorrection(true)
                    
                    signUpButton
                }
                .padding()
            }
        }
    }
    
    private var backgroundGradient: some View {
        LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
            .ignoresSafeArea()
    }
    
    private var signUpButton: some View {
        Button(action: signup) {
            if isLoading { ProgressView().tint(.white) } else { Text("Sign Up").bold() }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
        .foregroundColor(.white)
        .cornerRadius(16)
    }

    func signup() {
        Task {
            isLoading = true
            do {
                try await session.signup(data: data)
                dismiss()
            } catch {
                // handle error
            }
            isLoading = false
        }
    }
}

#Preview {
    SignupView()
}
