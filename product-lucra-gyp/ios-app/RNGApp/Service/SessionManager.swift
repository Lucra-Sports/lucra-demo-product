//
//  SessionManager.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

import Combine
import Foundation
import LucraSDK
import SwiftUI

class SessionManager: ObservableObject {
    
    @Published var client: LucraClient
    @Published var user: User? {
        didSet { saveUser() }
    }
    
    @Published private(set) var lucraUser: SDKUser?
    @Published var flow: LucraFlow?
    private var cancellables = Set<AnyCancellable>()

    init() {
        
        self.client = LucraClient(config: .init(environment: .init(apiURL: "api-rng.sandbox.lucrasports.com",
                                                                   apiKey: "coXydksUigTnn87Z6e45tabTSOaTBj0l",
                                                                   environment: .sandbox,
                                                                   urlScheme: ""),
                                                appearance: .init(universalTheme: .init(primary: Color.primaryColor,
                                                                                        secondary: Color.secondaryColor))))
        
        if let data = UserDefaults.standard.data(forKey: "rng_user"),
           let u = try? JSONDecoder().decode(User.self, from: data) {
            self.user = u
        }
        
        subscribeToUser()
    }
    
    func setFlow(flow: LucraFlow) {
        self.flow = flow
    }

    func login(email: String, password: String) async throws {
        let u = try await APIService.shared.login(email: email, password: password)
        await MainActor.run { self.user = u }
    }

    func signup(data: APIService.SignupData) async throws {
        let u = try await APIService.shared.signup(data: data)
        await MainActor.run { self.user = u }
    }

    func logout() {
        user = nil
    }

    private func saveUser() {
        if let u = user, let data = try? JSONEncoder().encode(u) {
            UserDefaults.standard.set(data, forKey: "rng_user")
        } else {
            UserDefaults.standard.removeObject(forKey: "rng_user")
        }
    }
    
    private func subscribeToUser() {
        client.$user.sink { user in
            self.lucraUser = user
        }
        .store(in: &cancellables)
    }
}

